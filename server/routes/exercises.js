const express = require("express");
const router = express.Router();
const { db } = require("../db");

// Get all unique exercise names
router.get("/names", (req, res) => {
  const stmt = db.prepare("SELECT DISTINCT name FROM exercises");
  const names = stmt.all().map((item) => item.name);
  res.json(names);
});

// Update an exercise
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, superset_group } = req.body;

  const stmt = db.prepare(
    "UPDATE exercises SET name = ?, superset_group = ? WHERE id = ?",
  );
  const info = stmt.run(name, superset_group, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  res.json({ id, name, superset_group });
});

// Delete an exercise
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare("DELETE FROM exercises WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  res.status(204).send();
});

// Update an exercise's sets
router.put("/:id/sets", (req, res) => {
  const { id } = req.params;
  const { sets } = req.body;

  if (!sets || !Array.isArray(sets)) {
    return res.status(400).json({ error: "Missing required sets field" });
  }

  const stmt = db.prepare(
    "UPDATE template_sets SET weight = ?, reps = ? WHERE id = ?",
  );
  for (const set of sets) {
    stmt.run(set.weight, set.reps, set.id);
  }

  res.status(200).send();
});

module.exports = router;
