import { PoolClient, QueryResult } from "pg";
import { queryClient } from "./postgres";

interface RecordValues {
    [key: string]: any;
}

interface Conditions {
    [key: string]: any;
}

/**
 * Inserts a new record into a specified table.
 * @param client The database client used to perform the query.
 * @param table The name of the table where the record should be inserted.
 * @param values An object containing column-value pairs to insert into the table.
 * @param returning The column to return after the insert operation, defaults to "id".
 * @returns A promise that resolves to the first row of the result containing the returning column.
 */
export const insertRecord = async (
    client: PoolClient,
    table: string,
    values: RecordValues,
    returning: string = "id"
): Promise<any> => {
    // Construct the column names and placeholders for the insert statement
    const columns = Object.keys(values)
        .map((col) => `"${col}"`)
        .join(", ");
    const placeholders = Object.values(values)
        .map((_, index) => `$${index + 1}`)
        .join(", ");

    // Extract the values to be inserted
    const conditionValues = Object.values(values);

    // Construct the SQL query for inserting the record
    const query = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING ${returning}`;

    // Execute the query and return the result
    const result = await queryClient(client, query, conditionValues);
    return result.rows[0];
};

/**
 * Updates records in a specified table based on given conditions.
 * @param client The database client used to perform the query.
 * @param table The name of the table where records need to be updated.
 * @param updates An object containing column-value pairs to update in the table.
 * @param conditions An object containing column-value pairs to specify which records to update.
 * @returns A promise that resolves to the result of the update query.
 */
export const updateRecords = async (
    client: PoolClient,
    table: string,
    updates: RecordValues,
    conditions: Conditions
): Promise<QueryResult> => {
    // Construct SET clause for update statement
    let setClause = "";
    const updateValues = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
        setClause += `"${key}" = $${index}, `;
        updateValues.push(value);
        index++;
    }
    // Remove trailing comma and space from SET clause
    setClause = setClause.slice(0, -2);

    // Construct WHERE clause for update statement
    let whereClause = "";
    const conditionValues = [];

    for (const [key, value] of Object.entries(conditions)) {
        whereClause += `"${key}" = $${index} AND `;
        conditionValues.push(value);
        index++;
    }
    // Remove trailing " AND " from WHERE clause
    whereClause = whereClause.slice(0, -5);

    // Construct final query
    const query = `
        UPDATE "${table}"
        SET ${setClause}
        WHERE ${whereClause};
    `;

    // Combine update and condition values for the query
    const values = [...updateValues, ...conditionValues];

    // Execute the query and return the result
    return await queryClient(client, query, values);
};

/**
 * Deletes records from a table based on a condition.
 * @param client The database client to use for executing the query.
 * @param table The name of the table from which records should be deleted.
 * @param condition An optional object containing column-value pairs to filter which records to delete.
 * @returns A promise that resolves to the result of the query.
 */
export const deleteRecords = async (
    client: PoolClient,
    table: string,
    condition?: Conditions
): Promise<QueryResult> => {
    let query = `DELETE FROM "${table}"`;

    const values: any[] = [];

    if (condition && Object.keys(condition).length > 0) {
        query += " WHERE ";

        const conditions = Object.entries(condition).map(
            ([key, value], index) => {
                values.push(value);
                return `"${key}" = $${index + 1}`;
            }
        );

        query += conditions.join(" AND ");
    }

    return await queryClient(client, query, values);
};

/**
 * Retrieves all records from a specified table that match the given condition.
 * @param client The database client used to perform the query.
 * @param table The name of the table to query.
 * @param columns Optional array of column names to select. Defaults to all columns.
 * @param condition An object containing column-value pairs to filter the records.
 * @returns A promise that resolves to an array of records matching the condition.
 */
export const findAllWithCondition = async (
    client: PoolClient,
    table: string,
    columns?: string[],
    condition: Conditions = {}
): Promise<any[]> => {
    // Start constructing the SQL SELECT query
    let query = `SELECT ${
        columns ? columns.map((col) => `"${col}"`).join(", ") : "*"
    } FROM "${table}"`;

    const values = [];
    const conditions = [];

    // Build the WHERE clause based on the condition object
    for (const [key, value] of Object.entries(condition)) {
        conditions.push(`"${key}" = $${values.length + 1}`);
        values.push(value);
    }

    // Append the WHERE clause to the query if there are any conditions
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Execute the query using the queryClient function and return the results
    const result = await queryClient(client, query, values);
    return result.rows;
};

/**
 * Retrieves a single record from a specified table that matches the given condition.
 * @param client The database client used to perform the query.
 * @param table The name of the table to query.
 * @param columns Optional array of column names to select. Defaults to all columns.
 * @param condition An object containing column-value pairs to filter the record.
 * @returns A promise that resolves to the first record matching the condition, or undefined if no match is found.
 */
export const findOneWithCondition = async (
    client: PoolClient,
    table: string,
    columns?: string[] | null,
    condition: Conditions = {}
): Promise<any> => {
    // Construct the SQL SELECT query, including specified columns or all columns
    let query = `SELECT ${
        columns ? columns.map((col) => `"${col}"`).join(", ") : "*"
    } FROM "${table}"`;

    const values = []; // Array to hold the values for parameterized query
    const conditions = []; // Array to hold the conditions for the WHERE clause

    // Build the WHERE clause based on the condition object
    for (const [key, value] of Object.entries(condition)) {
        conditions.push(`"${key}" = $${values.length + 1}`);
        values.push(value);
    }

    // Append the WHERE clause to the query if there are any conditions
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Execute the query using the queryClient function and return the first row of the result
    const result = await queryClient(client, query, values);
    return result.rows[0];
};
