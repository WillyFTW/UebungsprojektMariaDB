//gets called after all routes as part of req, res pipeline. So only handles errors that occur in this pipeline.

module.exports = function (err, req, res, next) {
  //500 internal error.
  console.log("", err.message, err);
  res.status(500).send("Something failed: 500 Internal Server Error.");
};
