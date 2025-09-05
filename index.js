const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const scripts = require("./routes/scripts.js");
const morgan = require("morgan");
const error = require("./middleware/error.js");
const mariadb = require("mariadb");

//In case of unhandled exceptions or rejections, log them and exit the process.
//We do this at the start of the programm to catch all errors.
process.on("uncaughtException", (ex) => {
  console.log(ex.message, ex);
  process.exit(1);
});

process.on("unhandledRejection", (ex) => {
  throw ex;
});

// Handle Ctrl+C and kill signals eg. from Docker
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const shutdown = async () => {
  console.log("\nShutting down gracefully...");
  try {
    await pool.end(); // closes all active connections
    console.log("Database pool closed.");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

// Handle Ctrl+C and kill signals eg. from Docker
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

//Middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));
console.log("Request logger enabled...");

// Routes
app.use("/api/scripts", scripts);
// Error handling middleware should be the last middleware
app.use(error);

// Database connection
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "Wilhelm",
  database: "uebungsprojekt",
  connectionLimit: 5,
});

// Start
const server = app.listen(3000, () =>
  console.log("Listening on port http://localhost:3000 ...")
);

module.exports.pool = pool;
