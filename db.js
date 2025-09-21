const mariadb = require("mariadb");
import { attachDatabasePool } from "@vercel/functions";

require("dotenv").config(); // Load environment variables from .env file

// Dynamically create the pool based on the environment
const pool = mariadb.createPool(
  process.env.NODE_ENV === "production"
    ? {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 5, // Default to 5 if not set
        ssl: {
          rejectUnauthorized: true,
        },
      }
    : {
        host: "localhost",
        user: "root",
        password: "Wilhelm",
        database: "scriptsdb",
        connectionLimit: 5,
      }
);

if (process.env.NODE_ENV === "production") {
  // Attach the pool to ensure idle connections close before suspension
  attachDatabasePool(pool);
}

module.exports.pool = pool;
