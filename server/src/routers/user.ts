import express from "express";
import { getUserHandler } from "../controllers/user";

const router = express.Router();

router.route("/:username").get(getUserHandler);

export default router;
