const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const scripts = require("./routes/scripts.js");
const morgan = require("morgan");
const error = require("./middleware/error.js");

//In case of unhandled exceptions or rejections, log them and exit the process.
//We do this at the start of the programm to catch all errors.
process.on("uncaughtException", (ex) => {
  console.log(ex.message, ex);
  process.exit(1);
});

process.on("unhandledRejection", (ex) => {
  throw ex;
});

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

// MongoDB Connection
mongoose
  .connect("mongodb://0.0.0.0:27017/scriptsdb")
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Connection failed..." + err));

// Start
const server = app.listen(3000, () =>
  console.log("Listening on port http://localhost:3000 ...")
);

module.exports = server;
