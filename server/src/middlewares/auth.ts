import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { sendClientSideError } from "../utils/responseTemplates";
import jwt from "jsonwebtoken";
import { transaction } from "../db/postgres";
import { findOneWithCondition, updateRecords } from "../db/queries";
import { redisClient } from "../redis/client";

export const signupValidation = [
    body("email")
        .exists()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Incorrect email format"),
    body("username")
        .exists()
        .withMessage("Username is required")
        .matches(/^[a-zA-Z0-9_]{4,32}$/)
        .withMessage(
            "Username must be 4-32 characters long and can only contain letters, numbers, and underscores."
        ),
    body("password")
        .exists()
        .withMessage("Password is required")
        .isLength({ min: 8, max: 32 })
        .withMessage("Password must be 8-32 characters in length"),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendClientSideError(req, res, errors.array()[0].msg);
        }
        next();
    },
];

export const loginValidation = [
    check("username")
        .if((value, { req }) => !req.body.email)
        .exists()
        .withMessage("Username or email is required"),
    check("email")
        .if((value, { req }) => !req.body.username)
        .exists()
        .withMessage("Username or email is required")
        .isEmail()
        .withMessage("Incorrect email format"),
    body("username")
        .optional()
        .matches(/^[a-zA-Z0-9_]{4,32}$/)
        .withMessage(
            "Username must be 4-32 characters long and can only contain letters, numbers, and underscores."
        ),
    body("password")
        .exists()
        .withMessage("Password is required")
        .isLength({ min: 8, max: 32 })
        .withMessage("Password must be 8-32 characters in length"),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendClientSideError(req, res, errors.array()[0].msg);
        }
        next();
    },
];

export const isAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers?.authorization;
        if (!token) return sendClientSideError(req, res, "Auth-token missing");

        if (token.split("Bearer").length !== 2)
            return sendClientSideError(
                req,
                res,
                "Invalid Authentication Token"
            );

        const jwtToken = token.split("Bearer ")[1];
        if (!jwtToken)
            return sendClientSideError(req, res, "Auth-token missing");

        let decodedToken: any;
        try {
            decodedToken = jwt.verify(
                jwtToken,
                process.env.JWT_SECRET_KEY as string
            );
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                return sendClientSideError(
                    req,
                    res,
                    "Token expired, please login again"
                );
            else if (error instanceof jwt.JsonWebTokenError)
                return sendClientSideError(
                    req,
                    res,
                    "Invalid Authentication Token"
                );
            else throw error;
        }

        const { isGuest } = decodedToken;
        if (isGuest === undefined)
            return sendClientSideError(
                req,
                res,
                "Invalid auth-token, user not found"
            );

        if (isGuest) {
            const { guestId } = decodedToken;
            if (guestId === undefined)
                return sendClientSideError(
                    req,
                    res,
                    "Invalid auth-token, user not found"
                );

            const guest = await redisClient.get(`guestId:${guestId}:guest`);
            if (!guest)
                return sendClientSideError(
                    req,
                    res,
                    "Invalid auth-token, user not found"
                );

            (req as any).isGuest = true;
            (req as any).guestId = guestId;

            return next();
        } else {
            const { username, updatePasswordToken } = decodedToken;
            if (username === undefined || updatePasswordToken === undefined)
                return sendClientSideError(
                    req,
                    res,
                    "Invalid auth-token, user not found"
                );

            await transaction(async (client) => {
                const user = await findOneWithCondition(client, "Users", null, {
                    username,
                });
                if (!user) {
                    return sendClientSideError(
                        req,
                        res,
                        "Invalid auth-token, user not found"
                    );
                }

                if (updatePasswordToken !== user.update_password_token)
                    return sendClientSideError(
                        req,
                        res,
                        "Please sign in with your new password"
                    );

                await updateRecords(
                    client,
                    "Users",
                    { last_active: new Date() },
                    { username }
                );

                (req as any).isGuest = false;
                (req as any).username = username;
            });

            return next();
        }
    } catch (err) {
        next(err);
    }
};
