const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const scripts = require("./routes/scripts.js");
const customers = require("./routes/customers.js");
const morgan = require("morgan");
const error = require("./middleware/error.js");
const { pool } = require("./db");

// Middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));
console.log("Request logger enabled...");

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Scripts API!");
});

// Routes
app.use("/api/scripts", scripts);
app.use("/api/customers", customers);

// Error handling middleware should be the last middleware
app.use(error);

// Graceful shutdown logic
const shutdown = async () => {
  console.log("\nShutting down gracefully...");
  try {
    if (pool) {
      await pool.end(); // Close all active database connections
      console.log("Database pool closed.");
    }
    if (server) {
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    }
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

// Handle process signals for graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Handle uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown();
});

// Start the server (only for local development)
let server;
if (process.env.NODE_ENV !== "production") {
  server = app.listen(3000, () =>
    console.log("Listening on port http://localhost:3000 ...")
  );
}

// Export the app for Vercel
module.exports = app;
