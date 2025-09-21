//gets called after all routes as part of req, res pipeline. So only handles errors that occur in this pipeline.

module.exports = function (err, req, res, next) {
  //500 internal error.
  console.log("Internal Server Error 500: ", err.message, err);
  res
    .status(500)
    .json({ error: "Something failed: 500 Internal Server Error." });
};
//next not used here, as this is the last middleware in the pipeline.
