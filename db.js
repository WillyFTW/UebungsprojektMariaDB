const mariadb = require("mariadb");

// Create a connection pool
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "Wilhelm",
  database: "scriptsdb",
  connectionLimit: 5,
});

module.exports.pool = pool;
