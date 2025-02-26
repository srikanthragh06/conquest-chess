import {
    consoleLogCyan,
    consoleLogRed,
    consoleLogYellow,
} from "../utils/colorConsoleLogging";
import dotenv from "dotenv";
import { Pool, PoolClient, QueryResult } from "pg";

dotenv.config();

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

export const pool = new Pool({
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DBNAME,
});

/**
 * Tests the database connection to the Postgres Database.
 * This function attempts to connect to the database, run a simple query and
 * then close the connection. If the connection is successful, a success message
 * is logged to the console. If the connection is not successful, an error message
 * is logged to the console and the error is logged as well.
 */
export const testDatabaseConnection = async (retries = MAX_RETRIES) => {
    try {
        const client = await pool.connect();

        try {
            // Run a simple query to check if the connection is successful
            await client.query("SELECT 1");

            // Log a success message if the connection was successful
            consoleLogCyan(
                "Database connection to Postgres Database successful :)"
            );
        } finally {
            // Release the connection
            client.release();
        }
    } catch (error) {
        // try the connection again and again until retries are over
        if (retries > 0) {
            consoleLogYellow(
                `Database connection failed. Retrying in ${
                    RETRY_DELAY_MS / 1000
                }s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`
            );
            setTimeout(
                () => testDatabaseConnection(retries - 1),
                RETRY_DELAY_MS
            );
        } else {
            consoleLogRed(
                "Database connection failed after multiple attempts."
            );
        }
    }
};

/**
 * Executes a SQL query using the provided database client.
 * @param client The database client to use for executing the query.
 * @param query The SQL query string to execute.
 * @param params Optional parameters for the SQL query. Defaults to null.
 * @returns A promise that resolves to the result of the query.
 */
export const queryClient = async (
    client: PoolClient,
    query: string,
    params: any[] | null = null
): Promise<QueryResult> => {
    // Determine whether to execute the query with or without parameters
    const result = params
        ? await client.query(query, params) // Execute query with parameters
        : await client.query(query); // Execute query without parameters
    return result;
};

/**
 * Executes a sequence of database operations as a single transaction.
 * @param operations A function that takes a database client and returns a
 * promise that resolves when all operations are complete. The function should
 * not release the client.
 * @returns A promise that resolves when all operations are complete and the
 * transaction is committed, or throws an error if the transaction fails.
 */
export const transaction = async (
    operations: (client: PoolClient) => Promise<any>
): Promise<void> => {
    try {
        const client: PoolClient = await pool.connect();
        try {
            // Start a new transaction, execute operations and commit transaction
            await queryClient(client, "BEGIN");
            await operations(client);
            await queryClient(client, "COMMIT");
            client.release();
        } catch (err) {
            // Rollback the transaction and throw error if an error occurs
            await client.query("ROLLBACK");
            client.release();
            throw err;
        }
    } catch (err) {
        // Throw any error that occurs
        throw err;
    }
};
