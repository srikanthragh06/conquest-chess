import { NextFunction, Request, Response } from "express";
import { transaction } from "../db/postgres";
import {
    sendClientSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { findOneWithCondition, insertRecord } from "../db/queries";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

/**
 * Handles the request to sign up a new user.
 * @param req The Request object.
 * @param res The Response object.
 */
export const signupHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, username, password } = req.body;
        // Start a new transaction
        await transaction(async (client) => {
            // Check if a user with the given email address already exists
            const userWithThisEmail = await findOneWithCondition(
                client,
                "Users",
                ["id"],
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

            // Check if a user with the given username already exists
            const userWithThisUsername = await findOneWithCondition(
                client,
                "Users",
                ["id"],
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

            // Generate a new salt and hashed password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Generate a new update password token
            const updatePasswordToken = crypto.randomBytes(32).toString("hex");

            // Insert the new user into the database
            const { id: newUserId } = await insertRecord(client, "Users", {
                username,
                email,
                password: hashedPassword,
                salt,
                update_password_token: updatePasswordToken,
            });

            // Retrieve the new user from the database
            const newUser = await findOneWithCondition(
                client,
                "Users",
                [
                    "id",
                    "username",
                    "email",
                    "created_at",
                    "last_active",
                    "update_password_token",
                ],
                { id: newUserId }
            );

            // Generate a JWT token for the new user
            const jwtToken = jwt.sign(
                {
                    id: newUser.id,
                    email: newUser.email,
                    updatePasswordToken: newUser.update_password_token,
                },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "48h" }
            );

            // Send the success response with the JWT token and the new user's details
            return sendSuccessResponse(
                req,
                res,
                `${email} has been signed up successfully!`,
                201,
                {
                    jwtToken,
                    user: {
                        id: newUser.id,
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

/**
 * Handles the user login request.
 * @param req The request.
 * @param res The response.
 * @param next The next middleware function.
 */
export const loginHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username, email, password } = req.body;

        // Start a transaction to ensure that all operations are atomic
        await transaction(async (client) => {
            let user = null;
            if (username) {
                // Retrieve the user with the specified username
                user = await findOneWithCondition(client, "Users", null, {
                    username,
                });
                if (!user) {
                    // If the user does not exist, return a 400 Bad Request error
                    return sendClientSideError(req, res, `Invalid Credentials`);
                }
            } else {
                // Retrieve the user with the specified email address
                user = await findOneWithCondition(client, "Users", null, {
                    email,
                });
                if (!user) {
                    // If the user does not exist, return a 400 Bad Request error
                    return sendClientSideError(req, res, `Invalid Credentials`);
                }
            }

            // Hash the provided password with the user's salt
            const hashedPassword = await bcrypt.hash(password, user.salt);
            if ((user.password as string) !== hashedPassword) {
                // If the password does not match, return a 400 Bad Request error
                return sendClientSideError(req, res, `Incorrect credentials`);
            }

            // Generate a JWT token for the user
            const jwtToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    updatePasswordToken: user.update_password_token,
                },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "48h" }
            );

            // Send a success response with the JWT token and the user's details
            return sendSuccessResponse(
                req,
                res,
                `${user.email} signed in successfully`,
                200,
                {
                    jwtToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        createdAt: user.createdAt,
                        lastActive: user.lastActive,
                    },
                }
            );
        });
    } catch (err) {
        next(err);
    }
};
