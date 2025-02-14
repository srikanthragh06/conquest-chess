import { Redis } from "ioredis";
import dotenv from "dotenv";
import { consoleLogCyan, consoleLogRed } from "../utils/colorConsoleLogging";
import { onSubscribePMessage } from "./pubsub";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

export const redisClient = new Redis({
    host: REDIS_HOST as string,
    port: Number(REDIS_PORT as string),
});

export const redisSubscriber = new Redis({
    host: REDIS_HOST as string,
    port: Number(REDIS_PORT as string),
});

redisSubscriber.psubscribe("lobby-update:*");
redisSubscriber.psubscribe("started-game:*");
redisSubscriber.psubscribe("game-update:*");
redisSubscriber.psubscribe("game-over:*");

redisSubscriber.on("pmessage", onSubscribePMessage);

/**
 * Tests the connection to the Redis server.
 * Pings the Redis server to check if the connection is successful.
 * If the connection is successful, a success message is logged to the console.
 * If the connection is not successful, an error message is logged to the console.
 */
export const testRedisConnection = async () => {
    try {
        await redisClient.ping();
        consoleLogCyan(
            "Redis Client connected successfully, ping response received :)"
        );

        await redisSubscriber.ping();
        consoleLogCyan(
            "Redis Subscriber connected successfully, ping response received :)"
        );
    } catch (err) {
        consoleLogRed(
            "Connection to Redis Server failed, ping response not received :("
        );
        console.error(err);
    }
};
