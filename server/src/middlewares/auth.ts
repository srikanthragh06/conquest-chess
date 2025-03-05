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
