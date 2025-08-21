const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const scripts = require("./routes/scripts");
const customers = require("./routes/customers");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use("/api/customers", customers);
app.use("/api/scripts", scripts);

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/scriptsdb")
  .then(() => console.log("Connected..."))
  .catch((err) => console.error("Connection failed..."));

// Start
const server = app.listen(3000, () =>
  console.log("Listening on port http://localhost:3000 ...")
);

module.exports = server;
