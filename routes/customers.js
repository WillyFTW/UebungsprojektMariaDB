const { validate } = require("../models/customer");
const express = require("express");
const router = express.Router();
const { pool } = require("../db"); // Import the pool

// Get all customers
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
        SELECT
        c.name
        FROM customers c
    `);

    res.send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching scripts: " + error.message);
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
