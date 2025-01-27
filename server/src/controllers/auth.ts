import { NextFunction, Request, Response } from "express";
import { queryClient, transaction } from "../db/postgres";
import {
    sendClientSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { findOneWithCondition, insertRecord } from "../db/queries";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const signupHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, username, password } = req.body;
        await transaction(async (client) => {
            const userWithThisEmail = await findOneWithCondition(
                client,
                "Users",
                ["username"],
                {
                    email,
                }
            );
            if (userWithThisEmail)
                return sendClientSideError(
                    req,
                    res,
                    "User with this email address already exists"
                );

            const userWithThisUsername = await findOneWithCondition(
                client,
                "Users",
                ["username"],
                {
                    username,
                }
            );
            if (userWithThisUsername)
                return sendClientSideError(
                    req,
                    res,
                    "User with this username already exists"
                );

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const updatePasswordToken = crypto.randomBytes(32).toString("hex");

            const { username: newUsername } = await insertRecord(
                client,
                "Users",
                {
                    username,
                    email,
                    password: hashedPassword,
                    salt,
                    update_password_token: updatePasswordToken,
                },
                "username"
            );

            const newUser = await findOneWithCondition(
                client,
                "Users",
                [
                    "username",
                    "email",
                    "created_at",
                    "last_active",
                    "update_password_token",
                ],
                { username: newUsername }
            );

            const jwtToken = jwt.sign(
                {
                    username: newUser.username,
                    updatePasswordToken: newUser.update_password_token,
                    isGuest: false,
                },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "48h" }
            );

            return sendSuccessResponse(
                req,
                res,
                `${email} has been signed up successfully!`,
                201,
                {
                    jwtToken,
                    user: {
                        username: newUser.username,
                        email: newUser.email,
                        createdAt: newUser.created_at,
                        lastActive: newUser.last_active,
                    },
                }
            );
        });
    } catch (err) {
        next(err);
    }
};

export const loginHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username, email, password } = req.body;

        await transaction(async (client) => {
            let user = null;
            if (username) {
                user = await findOneWithCondition(client, "Users", null, {
                    username,
                });
                if (!user) {
                    return sendClientSideError(req, res, `Invalid Credentials`);
                }
            } else {
                user = await findOneWithCondition(client, "Users", null, {
                    email,
                });
                if (!user) {
                    return sendClientSideError(req, res, `Invalid Credentials`);
                }
            }

            const hashedPassword = await bcrypt.hash(password, user.salt);
            if ((user.password as string) !== hashedPassword) {
                return sendClientSideError(req, res, `Incorrect credentials`);
            }

            const jwtToken = jwt.sign(
                {
                    username: user.username,
                    updatePasswordToken: user.update_password_token,
                    isGuest: false,
                },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "48h" }
            );

            return sendSuccessResponse(
                req,
                res,
                `${user.email} signed in successfully`,
                200,
                {
                    jwtToken,
                    user: {
                        username: user.username,
                        email: user.email,
                        createdAt: user.created_at,
                        lastActive: user.last_active,
                    },
                }
            );
        });
    } catch (err) {
        next(err);
    }
};

export const createGuestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const generateGuestId = () => {
        return crypto.randomBytes(12).toString("base64url").slice(0, 16);
    };

    try {
        await transaction(async (client) => {
            let newGuestId: string;
            let guestIdExists = true;
            do {
                newGuestId = generateGuestId();
                guestIdExists = await findOneWithCondition(
                    client,
                    "Guests",
                    ["guest_id"],
                    { guest_id: newGuestId }
                );
            } while (guestIdExists);

            const { guest_id: guestId } = await insertRecord(
                client,
                "Guests",
                { guest_id: newGuestId },
                "guest_id"
            );

            const jwtToken = jwt.sign(
                {
                    guestId,
                    isGuest: true,
                },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "48h" }
            );

            return sendSuccessResponse(
                req,
                res,
                `Guest: ${guestId} registered successfully`,
                201,

                { jwtToken, user: { guestId: guestId } }
            );
        });
    } catch (err) {
        next(err);
    }
};

export const cleanupGuests = async () => {
    try {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        await transaction(async (client) => {
            await queryClient(
                client,
                `DELETE FROM "Guests" WHERE created_at < $1`,
                [cutoffTime]
            );
        });
    } catch (err) {
        console.error(err);
    }
};
