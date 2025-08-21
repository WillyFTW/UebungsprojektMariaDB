const mongoose = require("mongoose");

// Schema and Model
const scriptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  customer: { type: String, required: false },
  category: {
    type: String,
    enum: ["security", "software", "configuration", "command"],
    required: true,
  },
  status: { type: String, enum: ["global", "auto"], required: true },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Script = mongoose.model("Script", scriptSchema);

exports.Script = Script;
