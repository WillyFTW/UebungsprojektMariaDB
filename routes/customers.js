const router = express.Router();
const { Customer } = require("../models/customer");

// GET all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.send(customers);
  } catch (err) {
    res.status(500).send("Error retrieving customers");
  }
});

// GET a single customer by ID
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).send("Customer not found");
    res.send(customer);
  } catch (err) {
    res.status(500).send("Error retrieving customer");
  }
});

// POST a new customer
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).send(customer);
  } catch (err) {
    res.status(400).send("Error creating customer");
  }
});

// PUT to update an existing customer
router.put("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).send("Customer not found");
    res.send(customer);
  } catch (err) {
    res.status(400).send("Error updating customer");
  }
});

// DELETE a customer
router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).send("Customer not found");
    res.send(customer);
  } catch (err) {
    res.status(500).send("Error deleting customer");
  }
});

module.exports = router;
