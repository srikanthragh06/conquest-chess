import express from "express";
import { loginValidation, signupValidation } from "../middlewares/auth";
import { loginHandler, signupHandler } from "../controllers/auth";

const router = express.Router();

router.route("/signup").post(signupValidation, signupHandler);

router.route("/login").post(loginValidation, loginHandler);

export default router;
