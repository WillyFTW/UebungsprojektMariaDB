const Joi = require("joi");

//Validates the Script
function validateScript(script) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),

    code: Joi.string().min(1).required(),

    category: Joi.string()
      .valid("Safety", "Software", "Configuration", "Command")
      .required(),

    description: Joi.string().max(500).allow("").default(""),

    customers: Joi.array().items(Joi.string().min(1)).default([]),

    statuses: Joi.array()
      .items(Joi.string().valid("Global", "Auto"))
      .default([]),
  });
  return schema.validate(script);
}

exports.validate = validateScript;
