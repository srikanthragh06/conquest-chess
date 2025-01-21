import colors from "colors";

/**
 * Logs the given message to the console with a red color.
 * @param msg The message to log.
 */
export const consoleLogRed = (msg: string): void => {
    console.log(colors.red(msg));
};

/**
 * Logs the given message to the console with a blue color.
 * @param msg The message to log.
 */
export const consoleLogBlue = (msg: string): void => {
    console.log(colors.blue(msg));
};

/**
 * Logs the given message to the console with a green color.
 * @param msg The message to log.
 * @remarks This is often used for logging successful events.
 */
export const consoleLogGreen = (msg: string): void => {
    console.log(colors.green(msg));
};

/**
 * Logs the given message to the console with a cyan color.
 * @param msg The message to log.
 */
export const consoleLogCyan = (msg: string): void => {
    console.log(colors.cyan(msg));
};

/**
 * Logs the given message to the console with a yellow color.
 * @param msg The message to log.
 * @remarks This can be used for logging warnings or cautionary messages.
 */
export const consoleLogYellow = (msg: string): void => {
    console.log(colors.yellow(msg));
};
