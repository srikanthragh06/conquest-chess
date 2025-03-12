import { NextFunction, Request, Response } from "express";
import {
    sendClientSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { queryClient, transaction } from "../db/postgres";
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

            if (!user) {
                return sendClientSideError(
                    req,
                    res,
                    `User with username ${username} does not exist`
                );
            }

            const userData = {
                username: user.username,
                email: user.email,
                createdAt: user.created_at,
                lastActive: user.last_active,
                games: user.games,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws,
            };

            return sendSuccessResponse(
                req,
                res,
                "User details retreived successfully",
                200,
                {
                    user: userData,
                }
            );
        });
    } catch (err) {
        next(err);
    }
};

export const userGamesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username } = req.params;
        if (!username) {
            return sendClientSideError(
                req,
                res,
                "username is a required parameter"
            );
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        await transaction(async (client) => {
            const user = await findOneWithCondition(client, "Users", null, {
                username,
            });

            if (!user) {
                return sendClientSideError(
                    req,
                    res,
                    `User with username ${username} does not exist`
                );
            }
            const query = `
                    SELECT * 
                    FROM "Games" 
                    WHERE white_id = $1 OR black_id = $1
                    ORDER BY start_time DESC
                    LIMIT $2 OFFSET $3;
                `;

            const { rows } = await queryClient(client, query, [
                username,
                limit,
                offset,
            ]);

            const games = rows.map((row) => {
                return {
                    gameId: row.game_id,
                    fen: row.fen,
                    gameStatus: row.game_status,
                    startTime: row.start_time,
                    whiteId: row.white_id,
                    blackId: row.black_id,
                    type: row.type,
                    winner: row.winner,
                };
            });

            return sendSuccessResponse(
                req,
                res,
                "Games retreived successfully",
                200,
                {
                    games,
                }
            );
        });
    } catch (err) {
        next(err);
    }
};
