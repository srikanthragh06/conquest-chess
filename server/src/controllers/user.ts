import { NextFunction, Request, Response } from "express";
import {
    sendClientSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { transaction } from "../db/postgres";
import { findOneWithCondition } from "../db/queries";

export const getUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username } = req.params;
        if (!username)
            return sendClientSideError(
                req,
                res,
                "username is a required parameter"
            );

        await transaction(async (client) => {
            const user = await findOneWithCondition(client, "Users", null, {
                username,
            });
            return sendSuccessResponse(
                req,
                res,
                "User details retreived successfully",
                200,
                {
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
