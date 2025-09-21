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
    const rows = await conn.query(`
    SELECT
    s.name,
    s.category,
    s.description,
    s.code,
    COALESCE((SELECT JSON_ARRAYAGG(DISTINCT ss.status)
               FROM scriptstatuses ss
               WHERE ss.script_name = s.name AND ss.status IS NOT NULL), JSON_ARRAY()) AS statuses,
    COALESCE((SELECT JSON_ARRAYAGG(DISTINCT sc.customer_name)
               FROM scriptcustomers sc
               WHERE sc.script_name = s.name AND sc.customer_name IS NOT NULL), JSON_ARRAY()) AS customers
    FROM scripts s;
    `);

    // Parse JSON strings into JavaScript arrays
    const parsedRows = rows.map((row) => ({
      ...row,
      statuses: JSON.parse(row.statuses),
      customers: JSON.parse(row.customers),
    }));

    console.log(
      `Pool status: ${pool.activeConnections()}/${pool.totalConnections()} active, ${pool.idleConnections()} idle, ${pool.taskQueueSize()} queued`
    );

    res.json(parsedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching scripts: " + error.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /scripts/:name → one script by name
router.get("/:name", async (req, res) => {
  const { name } = req.params;
  let conn;

  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      `
      SELECT
      s.name,
      s.category,
      s.description,
      s.code,
      COALESCE((SELECT JSON_ARRAYAGG(DISTINCT ss.status)
                 FROM scriptstatuses ss
                 WHERE ss.script_name = s.name AND ss.status IS NOT NULL), JSON_ARRAY()) AS statuses,
      COALESCE((SELECT JSON_ARRAYAGG(DISTINCT sc.customer_name)
                 FROM scriptcustomers sc
                 WHERE sc.script_name = s.name AND sc.customer_name IS NOT NULL), JSON_ARRAY()) AS customers
      FROM scripts s
      WHERE s.name = ?;
      `,
      [name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Script not found" });
    }

    const script = rows[0];
    script.statuses = JSON.parse(script.statuses);
    script.customers = JSON.parse(script.customers);

    res.json(script);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching script: " + error.message });
  } finally {
    if (conn) conn.release();
  }
});

// Create new script
router.post("/", async (req, res) => {
  let conn;

  try {
    // 1. Validate inputs
    const validation = validate(req.body);
    if (validation.error) {
      return res
        .status(400)
        .json({ error: validation.error.details[0].message });
    }

    const { name, code, category, description, customers, statuses } = req.body;

    if (!name || !category || !code) {
      return res
        .status(400)
        .json({ error: "Script name, category, and code are required." });
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

    // 2. Insert script (may throw if name already exists)
    await conn.query(
      "INSERT INTO scripts (name, category, description, code) VALUES (?, ?, ?, ?)",
      [name, category, description || "", code]
    );

    // 3. Handle customers
    if (Array.isArray(customers)) {
      for (const customer of customers) {
        await conn.query("INSERT IGNORE INTO customers (name) VALUES (?)", [
          customer,
        ]);
        await conn.query(
          "INSERT INTO scriptcustomers (script_name, customer_name) VALUES (?, ?)",
          [name, customer]
        );
      }
    }

    // 4. Handle statuses
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
          "INSERT INTO scriptstatuses (script_name, status) VALUES (?, ?)",
          [name, status]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "Script created successfully." });
  } catch (err) {
    if (conn) await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: `Script '${req.body.name}' already exists.` });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /scripts/:name → delete a script by name
router.delete("/:name", async (req, res) => {
  const { name } = req.params;
  let conn;

  try {
    conn = await pool.getConnection();

    const result = await conn.query("DELETE FROM scripts WHERE name = ?", [
      name,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Script not found" });
    }

    res.status(200).json({ message: "Script deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting script: " + error.message });
  } finally {
    if (conn) conn.release();
  }
});

// Update existing script (with optional rename)
router.put("/:name", async (req, res) => {
  let conn;
  const oldName = req.params.name; // current script name in URL

  try {
    // 1. Validate input
    const validation = validate(req.body);
    if (validation.error) {
      console.log(validation.error);
      return res
        .status(400)
        .json({ error: validation.error.details[0].message });
    }

    const {
      name: newName,
      code,
      category,
      description,
      customers,
      statuses,
    } = req.body;

    if (!newName || !code || !category) {
      return res
        .status(400)
        .json({ error: "Script name, category, and code are required." });
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

    // 2. Update script (rename, code, category, description)
    const result = await conn.query(
      "UPDATE scripts SET name = ?, code = ?, category = ?, description = ? WHERE name = ?",
      [newName, code, category, description || "", oldName]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `Script '${oldName}' not found.` });
    }

    // 3. Update customers
    await conn.query("DELETE FROM scriptcustomers WHERE script_name = ?", [
      newName,
    ]);
    if (Array.isArray(customers)) {
      for (const customer of customers) {
        await conn.query("INSERT IGNORE INTO customers (name) VALUES (?)", [
          customer,
        ]);
        await conn.query(
          "INSERT INTO scriptcustomers (script_name, customer_name) VALUES (?, ?)",
          [newName, customer]
        );
      }
    }

    // 4. Update statuses
    await conn.query("DELETE FROM scriptstatuses WHERE script_name = ?", [
      newName,
    ]);
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
          "INSERT INTO scriptstatuses (script_name, status) VALUES (?, ?)",
          [newName, status]
        );
      }
    }

    await conn.commit();
    res.status(200).json({
      message: `Script '${oldName}' updated successfully as '${newName}'.`,
    });
  } catch (err) {
    if (conn) await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: `Script name '${req.body.name}' already exists.` });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
