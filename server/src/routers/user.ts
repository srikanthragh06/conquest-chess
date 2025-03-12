import express from "express";
import { getUserHandler, userGamesHandler } from "../controllers/user";

const router = express.Router();

router.route("/:username").get(getUserHandler);

router.route("/user-games/:username").get(userGamesHandler);

export default router;
