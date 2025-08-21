const router = express.Router();
const { Script } = require("../models/script");

router.get("/", async (req, res) => {
  const scripts = await Script.find();
  res.json(scripts);
});

router.post("/", async (req, res) => {
  const { title, code } = req.body;
  const newScript = new Script({ title, code });
  await newScript.save();
  res.json(newScript);
});

//TODO
const genre = await Genre.findById(req.body.genreId);
if (!genre) return res.status(400).send("Invalid genre.");

const movie = new Movie({
  title: req.body.title,
  genre: {
    _id: genre._id,
    name: genre.name,
  },
  numberInStock: req.body.numberInStock,
  dailyRentalRate: req.body.dailyRentalRate,
});
await movie.save();

res.send(movie);
//TODO END

router.get("/:id", async (req, res) => {
  const script = await Script.findById(req.params.id);
  res.json(script);
});

router.delete("/:id", async (req, res) => {
  const deletedScript = await Script.findByIdAndDelete(req.params.id);
  if (!deletedScript) {
    return res.status(404).json({ message: "Script not found" });
  }
  res.json(deletedScript);
});

router.put("/:id", async (req, res) => {
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
});
