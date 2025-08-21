const mongoose = require("mongoose");

// Schema and Model
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const Customer = mongoose.model("Customer", customerSchema);

exports.Customer = Customer;
