const mongoose = require("mongoose");
const Joi = require("joi");

// Schema and Model
const scriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
  },
  code: { type: String, required: true },
  customer: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
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

//Validates the Script
function validateScript(script) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    code: Joi.string().required(),
    customer: Joi.string().required(),
    category: Joi.string()
      .valid("security", "software", "configuration", "command")
      .required(),
    status: Joi.string().valid("global", "auto").required(),
    description: Joi.string().allow(""),
    createdAt: Joi.date(),
  });
  return schema.validate(script);
}

exports.validate = validateScript;
exports.Script = Script;
