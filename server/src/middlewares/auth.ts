import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { sendClientSideError } from "../utils/responseTemplates";
import jwt from "jsonwebtoken";
import { transaction } from "../db/postgres";
import { findOneWithCondition, updateRecords } from "../db/queries";

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

/**
 * Middleware to check if the user is authenticated.
 * @param req The Request object.
 * @param res The Response object.
 * @param next The NextFunction to pass control to the next middleware.
 */
export const isAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract the authorization token from request headers
        const token = req.headers?.authorization;
        if (!token) return sendClientSideError(req, res, "Auth-token missing");

        // Check if the token follows the Bearer scheme
        if (token.split("Bearer").length !== 2)
            return sendClientSideError(
                req,
                res,
                "Invalid Authentication Token"
            );

        // Extract the JWT token from the authorization header
        const jwtToken = token.split("Bearer ")[1];
        if (!jwtToken)
            return sendClientSideError(req, res, "Auth-token missing");

        type decodedTokenType = {
            id: number;
            email: string;
            updatePasswordToken: string;
        };

        let decodedToken: decodedTokenType;
        try {
            // Verify and decode the JWT token
            decodedToken = jwt.verify(
                jwtToken,
                process.env.JWT_SECRET_KEY as string
            ) as decodedTokenType;
        } catch (error) {
            // Handle token verification errors
            if (error instanceof jwt.TokenExpiredError) {
                return sendClientSideError(
                    req,
                    res,
                    "Token expired, please login again"
                );
            } else if (error instanceof jwt.JsonWebTokenError) {
                return sendClientSideError(
                    req,
                    res,
                    "Invalid Authentication Token"
                );
            } else {
                throw error;
            }
        }
        console.log(decodedToken);
        // check if id,email, updatePasswordToken exist in the jwt
        const { id, email, updatePasswordToken } = decodedToken;
        if (!id || !email || !updatePasswordToken) {
            return sendClientSideError(
                req,
                res,
                "Invalid auth-token, user not found"
            );
        }

        await transaction(async (client) => {
            // Retrieve user from database using id and
            const user = await findOneWithCondition(client, "Users", null, {
                id,
                email,
            });
            if (!user) {
                return sendClientSideError(
                    req,
                    res,
                    "Invalid auth-token, user not found"
                );
            }

            // Check if the updatePasswordToken matches
            if (updatePasswordToken !== user.update_password_token)
                return sendClientSideError(
                    req,
                    res,
                    "Please sign in with your new password"
                );

            // Update the user's last active timestamp
            await updateRecords(
                client,
                "Users",
                { last_active: new Date() },
                { id }
            );

            // Attach the user object to the request
            (req as any).user = user;
        });

        // Pass control to the next middleware
        return next();
    } catch (err) {
        // Pass any error to the global error handler
        next(err);
    }
};
