import { NextFunction, Request, Response } from "express";
import { transaction } from "../db/postgres";
import {
    sendClientSideError,
    sendServerSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { findOneWithCondition, insertRecord } from "../db/queries";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { redisClient } from "../redis/client";
import { guestType } from "../type/state";

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
                    userId: newUser.username,
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
                    userId: user.username,
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
