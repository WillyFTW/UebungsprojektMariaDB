const { validate } = require("../models/script");
const express = require("express");
const router = express.Router();
const { pool } = require("../db"); // Import the pool

// Allowed statuses
const ALLOWED_CATEGORIES = ["Safety", "Software", "Configuration", "Command"];
const ALLOWED_STATUSES = ["Global", "Auto"];

// Get all scripts
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT s.*, ss.status, sc.customer_name AS customer FROM Scripts s LEFT JOIN ScriptStatuses ss ON s.name = ss.script_name LEFT JOIN ScriptCustomers sc ON s.name = sc.script_name"
    );
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
  // 1. Validate inputs
  try {
    const validation = validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }

    const { name, code, category, description, customers, statuses } = req.body;

    if (!name || !category || !code) {
      return res
        .status(400)
        .json({ error: "Script name, category and code are required." });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category '${category}'. Allowed: ${ALLOWED_CATEGORIES.join(
          ", "
        )}`,
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 2. Check if script already exists
    const [existing] = await conn.query(
      "SELECT name FROM Scripts WHERE name = ?",
      [name]
    );
    if (existing) {
      await conn.rollback();
      return res
        .status(409)
        .json({ error: `Script '${name}' already exists.` });
    }

    // 3. Insert script
    await conn.query(
      "INSERT INTO Scripts (name, code, description) VALUES (?, ?, ?)",
      [name, code, description || ""]
    );

    // 4. Handle customers
    if (Array.isArray(customers)) {
      for (const customer of customers) {
        await conn.query("INSERT IGNORE INTO Customers (name) VALUES (?)", [
          customer,
        ]);
        await conn.query(
          "INSERT INTO ScriptCustomers (script_name, customer_name) VALUES (?, ?)",
          [name, customer]
        );
      }
    }

    // 5. Handle statuses
    if (Array.isArray(statuses)) {
      for (const status of statuses) {
        if (!ALLOWED_STATUSES.includes(status)) {
          await conn.rollback();
          return res.status(400).json({
            error: `Invalid status '${status}'. Allowed: ${ALLOWED_STATUSES.join(
              ", "
            )}`,
          });
        }

        await conn.query(
          "INSERT INTO ScriptStatuses (script_name, status) VALUES (?, ?)",
          [name, status]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "Script created successfully." });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

// Get script by name
router.get("/:name", async (req, res) => {
  let conn;
  try {
    const scriptName = req.params.name;
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
