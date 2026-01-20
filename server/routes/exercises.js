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
  const { name, weight, sets, reps, superset_group } = req.body;

  const stmt = db.prepare(
    "UPDATE exercises SET name = ?, weight = ?, sets = ?, reps = ?, superset_group = ? WHERE id = ?",
  );
  const info = stmt.run(name, weight, sets, reps, superset_group, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  res.json({ id, name, weight, sets, reps, superset_group });
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

module.exports = router;
