const mariadb = require("mariadb");

require("dotenv").config(); // Load environment variables from .env file

// Function to create a new connection dynamically
const createConnection = () =>
  mariadb.createConnection(
    process.env.NODE_ENV === "production"
      ? {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          port: process.env.DB_PORT || 3306,
          ssl: {
            rejectUnauthorized: true,
          },
          connectTimeout: 10000, // 10 seconds
        }
      : {
          host: "localhost",
          user: "root",
          password: "Wilhelm",
          database: "scriptsdb",
        }
  );

module.exports.createConnection = createConnection;
