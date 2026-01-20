const express = require("express");
const router = express.Router();
const { db } = require("../db");

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
