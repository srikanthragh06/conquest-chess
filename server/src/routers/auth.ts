import express, { Request, Response } from "express";
import {
    isAuthMiddleware,
    loginValidation,
    signupValidation,
} from "../middlewares/auth";
import {
    createGuestHandler,
    loginHandler,
    signupHandler,
} from "../controllers/auth";
import { sendSuccessResponse } from "../utils/responseTemplates";

const router = express.Router();

router.route("/signup").post(signupValidation, signupHandler);

router.route("/login").post(loginValidation, loginHandler);

router
    .route("/is-auth")
    .get(isAuthMiddleware, (req: Request, res: Response) => {
        const isGuest = (req as any).isGuest;

        if (isGuest)
            return sendSuccessResponse(
                req,
                res,
                `User authorized successfully`,
                200,
                {
                    user: {
                        guestId: (req as any).guestId,
                        isGuest,
                    },
                }
            );
        else
            return sendSuccessResponse(
                req,
                res,
                `User authorized successfully`,
                200,
                {
                    user: {
                        username: (req as any).username,
                        isGuest,
                    },
                }
            );
    });

router.route("/create-guest").post(createGuestHandler);

export default router;
