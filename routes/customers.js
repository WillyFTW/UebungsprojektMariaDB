const { validate } = require("../models/customer");
const express = require("express");
const router = express.Router();
const { createConnection } = require("../db"); // Import the createConnection function

// Get all customers
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await createConnection(); // Create a new connection
    const rows = await conn.query(`
        SELECT
        c.name
        FROM customers c
    `);

    res.send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching customers: " + error.message);
  } finally {
    if (conn) await conn.end(); // Close the connection
  }
});

module.exports = router;
