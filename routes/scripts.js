const { validate } = require("../models/script");
const express = require("express");
const router = express.Router();
const { pool } = require("../index"); // Import the pool

// Get all scripts
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM Scripts");
    res.send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching scripts: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

// Create new script
router.post("/", async (req, res) => {
  let conn;
  try {
    const validation = validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }

    const { name, category, description, status } = req.body;

    conn = await pool.getConnection();

    // Check if the script already exists
    const existing = await conn.query("SELECT * FROM Scripts WHERE name = ?", [
      name,
    ]);
    if (existing.length > 0) {
      return res.status(400).send("Script with the same name already exists.");
    }

    // Insert new script
    await conn.query(
      "INSERT INTO Scripts (name, category, description, status) VALUES (?, ?, ?, ?)",
      [name, category, description || null, status || null]
    );

    res.status(201).send({ name, category, description, status });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating script: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

// Get script by name (id = script name)
router.get("/:id", async (req, res) => {
  let conn;
  try {
    const scriptName = req.params.id;
    conn = await pool.getConnection();

    const scriptRows = await conn.query(
      "SELECT * FROM Scripts WHERE name = ?",
      [scriptName]
    );
    if (scriptRows.length === 0) {
      return res.status(404).send("Script not found");
    }

    const script = scriptRows[0];

    // Fetch related customers
    const customers = await conn.query(
      `SELECT c.name 
       FROM Customers c
       JOIN ScriptCustomers sc ON c.name = sc.customer_name
       WHERE sc.script_name = ?`,
      [scriptName]
    );

    script.customers = customers.map((c) => c.name);

    res.send(script);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching script: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

// Delete script by name
router.delete("/:id", async (req, res) => {
  let conn;
  try {
    const scriptName = req.params.id;
    conn = await pool.getConnection();

    const result = await conn.query("DELETE FROM Scripts WHERE name = ?", [
      scriptName,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).send("Script not found");
    }

    res.send({ message: "Script deleted successfully", scriptName });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting script: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

// Update script by name
router.put("/:id", async (req, res) => {
  let conn;
  try {
    const validation = validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }

    const scriptName = req.params.id;
    const { name, category, description, status } = req.body;

    conn = await pool.getConnection();

    const result = await conn.query(
      `UPDATE Scripts 
       SET name = ?, category = ?, description = ?, status = ?
       WHERE name = ?`,
      [name, category, description || null, status || null, scriptName]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Script not found");
    }

    res.send({ name, category, description, status });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating script: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
