//gets called after all routes as part of req, res pipeline. So only handles errors that occur in this pipeline.

module.exports = async function (err, req, res, next) {
  // Log the error details
  console.error("Error:", err.message, err);

  // Send a 500 Internal Server Error response
  res.status(500).send("Something failed: 500 Internal Server Error.");

  // No need to close the database pool or server here
  // as the connection is now managed per request and closed in the route handlers.
};
