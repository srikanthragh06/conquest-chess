import { ChainableCommander, Redis } from "ioredis";
import dotenv from "dotenv";
import {
    consoleLogCyan,
    consoleLogRed,
    consoleLogYellow,
} from "../utils/colorConsoleLogging";
import { onSubscribePMessage } from "./pubsub";

dotenv.config();

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

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

redisSubscriber.psubscribe("chess-app:lobby-update:*");
redisSubscriber.psubscribe("chess-app:match-select:*");
redisSubscriber.psubscribe("chess-app:started-game:*");
redisSubscriber.psubscribe("chess-app:game-update:*");
redisSubscriber.psubscribe("chess-app:game-over:*");
redisSubscriber.psubscribe("chess-app:request-draw:*");

redisSubscriber.on("pmessage", onSubscribePMessage);

/**
 * Tests the connection to the Redis server.
 * Pings the Redis server to check if the connection is successful.
 * If the connection is successful, a success message is logged to the console.
 * If the connection is not successful, an error message is logged to the console.
 */
export const testRedisConnection = async (retries = MAX_RETRIES) => {
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
        // try the connection again and again until retries are over
        if (retries > 0) {
            consoleLogYellow(
                `Redis connection failed. Retrying in ${
                    RETRY_DELAY_MS / 1000
                }s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`
            );
            setTimeout(() => testRedisConnection(retries - 1), RETRY_DELAY_MS);
        } else {
            consoleLogRed("Redis connection failed after multiple attempts.");
        }
        consoleLogRed(
            "Connection to Redis Server failed, ping response not received :("
        );
        console.error(err);
    }
};

export const executeWithRetry = async <T>(
    redisClient: Redis,
    keys: string[],
    transactionFn: (tx: ChainableCommander) => Promise<T | null>,
    maxRetries: number = 10,
    retryDelay: number = 50
): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await redisClient.watch(...keys);
            const tx = redisClient.multi();

            const result = await transactionFn(tx);
            if (result === null) {
                await redisClient.unwatch();
                return null;
            }

            const txResult = await tx.exec();
            if (txResult !== null) return result;

            console.log(`Retrying transaction (${attempt}/${maxRetries})...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } finally {
            await redisClient.unwatch();
        }
    }

    return null;
};
