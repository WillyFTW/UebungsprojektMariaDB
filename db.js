const mariadb = require("mariadb");
require("dotenv").config(); // Load environment variables from .env file

// Dynamically create the pool based on the environment
const pool = mariadb.createPool(
  process.env.NODE_ENV === "production"
    ? {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 5, // Default to 5 if not set
        rejectUnauthorized: true, // Ensure SSL certificate is verified
      }
    : {
        host: "localhost",
        user: "root",
        password: "Wilhelm",
        database: "scriptsdb",
        connectionLimit: 5,
      }
);

module.exports.pool = pool;
