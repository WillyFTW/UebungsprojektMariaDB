const Joi = require("joi");

//Validates the Script
function validateScript(script) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
  });
  return schema.validate(script);
}

exports.validate = validateScript;
