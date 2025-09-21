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
        port: process.env.DB_PORT || 3306,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 20) || 20, // Default to 5 if not set
        ssl: {
          rejectUnauthorized: true,
        },
        minDelayValidation: 500, // Only validate connections unused for 500ms
        pingTimeout: 1000, // Timeout for ping validation
        leakDetectionTimeout: 10000, // Log connections not returned to the pool within 10 seconds
        acquireTimeout: 15000, // Timeout for acquiring a connection
      }
    : {
        host: "localhost",
        user: "root",
        password: "Wilhelm",
        database: "scriptsdb",
        connectionLimit: 20,
        minDelayValidation: 500, // Only validate connections unused for 500ms
        pingTimeout: 1000, // Timeout for ping validation
        leakDetectionTimeout: 10000, // Log connections not returned to the pool within 10 seconds
        acquireTimeout: 15000, // Timeout for acquiring a connection
      }
);

const configureTimeouts = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    // Set server-side timeouts
    await conn.query("SET GLOBAL wait_timeout = 1800"); // 30 minutes
    await conn.query("SET GLOBAL interactive_timeout = 1800"); // 30 minutes
    console.log("Timeouts configured successfully.");
  } catch (err) {
    console.error("Error configuring timeouts:", err);
  } finally {
    if (conn) conn.release(); // Release the connection back to the pool
  }
};
configureTimeouts(); // Call the function to set timeouts
module.exports.pool = pool;
