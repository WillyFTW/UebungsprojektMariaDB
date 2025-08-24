const { Script, validate } = require("../models/script");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const scripts = await Script.find();
    res.send(scripts);
  } catch (error) {
    res.status(500).send("Error fetching scripts", error.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const validation = validate(req.body);
    if (validation.error) {
      res.status(400).send(validation.error.details[0].message);
      return;
    }

    // Check if the script with the same name already exists
    const existingScript = await Script.findOne({ name: req.body.name });
    if (existingScript) {
      return res.status(400).send("Script with the same name already exists.");
    }

    const newScript = new Script(req.body);
    await newScript.save();
    return res.status(201).send(newScript);
  } catch (error) {
    res.status(500).send("Error creating script", error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const script = await Script.findById(req.params.id).populate(
      "customer",
      "name -_id"
    );
    if (!script) {
      return res.status(404).send("Script not found");
    }
    res.send(script);
  } catch (error) {
    res.status(500).send("Error fetching script", error.message);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedScript = await Script.findByIdAndDelete(req.params.id);
    if (!deletedScript) {
      return res.status(404).send("Script not found");
    }
    res.send(deletedScript);
  } catch (error) {
    res.status(500).send("Error deleting script", error.message);
  }
});

router.put("/:id", async (req, res) => {
  try {
    //Check if the request body is valid
    const validation = validate(req.body);
    if (validation.error) {
      res.status(400).send(validation.error.details[0].message);
      return;
    }

    //Find the script by ID and update it
    const updatedScript = await Script.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedScript) {
      return res.status(404).send("Script not found");
    }
    return res.send(updatedScript);
  } catch (error) {
    res.status(500).send("Error updating script", error.message);
  }
});

module.exports = router;
