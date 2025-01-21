import express, { Request, Response } from "express";
import {
    isAuthMiddleware,
    loginValidation,
    signupValidation,
} from "../middlewares/auth";
import { loginHandler, signupHandler } from "../controllers/auth";
import { sendSuccessResponse } from "../utils/responseTemplates";

const router = express.Router();

router.route("/signup").post(signupValidation, signupHandler);

router.route("/login").post(loginValidation, loginHandler);

router
    .route("/is-auth")
    .get(isAuthMiddleware, (req: Request, res: Response) => {
        const user = (req as any).user;
        return sendSuccessResponse(
            req,
            res,
            `User authorized successfully`,
            200,
            {
                user: {
                    id: user?.id,
                    username: user?.username,
                    email: user?.email,
                    createdAt: user?.created_at,
                    lastActive: user?.last_active,
                },
            }
        );
    });

export default router;
