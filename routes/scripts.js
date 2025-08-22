const router = express.Router();
const { Script } = require("../models/script");
const express = require("express");

router.get("/", async (req, res) => {
  try {
    const scripts = await Script.find();
    res.json(scripts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching scripts", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, code } = req.body;
    const newScript = new Script({ title, code });
    await newScript.save();
    res.json(newScript);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating script", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }
    res.json(script);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching script", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedScript = await Script.findByIdAndDelete(req.params.id);
    if (!deletedScript) {
      return res.status(404).json({ message: "Script not found" });
    }
    res.json(deletedScript);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting script", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, code } = req.body;
    const updatedScript = await Script.findByIdAndUpdate(
      req.params.id,
      { title, code },
      { new: true, runValidators: true }
    );
    if (!updatedScript) {
      return res.status(404).json({ message: "Script not found" });
    }
    res.json(updatedScript);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating script", error: error.message });
  }
});
