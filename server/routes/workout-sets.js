const express = require("express");
const router = express.Router();
const { db } = require("../db");

// Create a new workout set
router.post("/", (req, res) => {
  const { workout_entry_id, weight, reps } = req.body;

  if (
    workout_entry_id === undefined ||
    weight === undefined ||
    reps === undefined
  ) {
    return res
      .status(400)
      .json({ error: "workout_entry_id, weight, and reps are required" });
  }

  const getMaxSetNumberStmt = db.prepare(
    "SELECT MAX(set_number) as max_set_number FROM workout_sets WHERE workout_entry_id = ?",
  );
  const { max_set_number } = getMaxSetNumberStmt.get(workout_entry_id) || {
    max_set_number: 0,
  };
  const set_number = (max_set_number || 0) + 1;

  const stmt = db.prepare(
    "INSERT INTO workout_sets (workout_entry_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)",
  );
  const info = stmt.run(workout_entry_id, set_number, weight, reps, 0);

  res.status(201).json({
    id: info.lastInsertRowid,
    workout_entry_id,
    set_number,
    weight,
    reps,
    completed: 0,
  });
});

// Update a workout set
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { reps, weight, completed } = req.body;

  if (reps === undefined || weight === undefined || completed === undefined) {
    return res
      .status(400)
      .json({ error: "Reps, weight, and completed status are required" });
  }

  const stmt = db.prepare(
    "UPDATE workout_sets SET reps = ?, weight = ?, completed = ? WHERE id = ?",
  );
  const info = stmt.run(reps, weight, completed ? 1 : 0, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Workout set not found" });
  }

  // Get workout_entry_id from the set
  const getSetStmt = db.prepare(
    "SELECT workout_entry_id FROM workout_sets WHERE id = ?",
  );
  const set = getSetStmt.get(id);
  const { workout_entry_id } = set;

  // Get all completed sets for the workout entry
  const getSetsStmt = db.prepare(
    "SELECT * FROM workout_sets WHERE workout_entry_id = ? AND completed = 1",
  );
  const sets = getSetsStmt.all(workout_entry_id);

  // Calculate the total volume
  const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

  // Update the volume in the workout_entries table
  const updateVolumeStmt = db.prepare(
    "UPDATE workout_entries SET volume = ? WHERE id = ?",
  );
  updateVolumeStmt.run(totalVolume, workout_entry_id);

  res.json({ id, reps, weight, completed });
});

module.exports = router;
