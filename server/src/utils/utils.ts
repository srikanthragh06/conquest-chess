const crypto = require("crypto");

export const generate16CharUniqueString = () => {
    // Generate 16 random bytes and convert to a hex string
    return crypto.randomBytes(8).toString("hex").slice(0, 16);
};
