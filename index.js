const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const scripts = require("./routes/scripts.js");
const customers = require("./routes/customers.js");
const morgan = require("morgan");
const error = require("./middleware/error.js");

const app = express();

// Middleware
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

// Error handling middleware (should be the last middleware)
app.use(error);

// Graceful shutdown logic
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

// Handle termination signals (e.g., Ctrl+C, Docker stop)
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

// Handle uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
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
