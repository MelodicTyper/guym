const express = require("express");
const router = express.Router();
const { db } = require("../db");

// GET /api/templates
router.get("/", (req, res) => {
  const stmt = db.prepare("SELECT * FROM templates");
  const templates = stmt.all();
  res.json(templates);
});

// GET /api/templates/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const templateStmt = db.prepare("SELECT * FROM templates WHERE id = ?");
  const template = templateStmt.get(id);

  if (!template) {
    return res.status(404).json({ error: "Template not found" });
  }

  const exercisesStmt = db.prepare(
    "SELECT * FROM exercises WHERE template_id = ? ORDER BY superset_group, id",
  );
  const exercises = exercisesStmt.all(id);

  const setsStmt = db.prepare(
    "SELECT * FROM template_sets WHERE exercise_id = ? ORDER BY set_number",
  );
  for (const exercise of exercises) {
    exercise.sets = setsStmt.all(exercise.id);
  }

  template.exercises = exercises;

  res.json(template);
});

// POST /api/templates
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Template name is required" });
  }
  const stmt = db.prepare("INSERT INTO templates (name) VALUES (?)");
  const info = stmt.run(name);
  res.status(201).json({ id: info.lastInsertRowid, name });
});

// Add an exercise to a template
router.post("/:id/exercises", (req, res) => {
  const { id } = req.params;
  const { name, weight, sets, reps } = req.body;

  if (
    !name ||
    weight === undefined ||
    sets === undefined ||
    reps === undefined
  ) {
    return res.status(400).json({ error: "Missing required exercise fields" });
  }

  const exerciseStmt = db.prepare(
    "INSERT INTO exercises (template_id, name, sets) VALUES (?, ?, ?)",
  );
  const exerciseInfo = exerciseStmt.run(id, name, sets);
  const exerciseId = exerciseInfo.lastInsertRowid;

  const setStmt = db.prepare(
    "INSERT INTO template_sets (exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?)",
  );
  for (let i = 1; i <= sets; i++) {
    setStmt.run(exerciseId, i, weight, reps);
  }

  res.status(201).json({
    id: exerciseId,
    template_id: id,
    name,
    sets,
  });
});

// DELETE /api/templates/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM templates WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Template not found" });
  }

  res.status(204).send();
});

// PUT /api/templates/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Template name is required" });
  }

  const stmt = db.prepare("UPDATE templates SET name = ? WHERE id = ?");
  const info = stmt.run(name, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Template not found" });
  }

  res.json({ id, name });
});

// Update a template from a historical workout
router.put("/:templateId/from-history/:workoutId", (req, res) => {
  const { templateId, workoutId } = req.params;

  db.transaction(() => {
    // Delete all existing exercises and sets from the template
    const existingExercisesStmt = db.prepare(
      "SELECT id FROM exercises WHERE template_id = ?",
    );
    const existingExercises = existingExercisesStmt.all(templateId);
    const deleteSetsStmt = db.prepare(
      "DELETE FROM template_sets WHERE exercise_id = ?",
    );
    for (const exercise of existingExercises) {
      deleteSetsStmt.run(exercise.id);
    }
    const deleteExercisesStmt = db.prepare(
      "DELETE FROM exercises WHERE template_id = ?",
    );
    deleteExercisesStmt.run(templateId);

    // Get historical entries
    const entriesStmt = db.prepare(
      "SELECT * FROM workout_entries WHERE workout_id = ? ORDER BY superset_group, id",
    );
    const historyEntries = entriesStmt.all(workoutId);

    const historySetsStmt = db.prepare(
      "SELECT * FROM workout_sets WHERE workout_entry_id = ? ORDER BY set_number",
    );
    const insertExerciseStmt = db.prepare(
      "INSERT INTO exercises (template_id, name, sets, superset_group) VALUES (?, ?, ?, ?)",
    );
    const insertTemplateSetStmt = db.prepare(
      "INSERT INTO template_sets (exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?)",
    );

    for (const historyEntry of historyEntries) {
      const sets = historySetsStmt.all(historyEntry.id);
      if (sets.length === 0) continue;

      const exerciseInfo = insertExerciseStmt.run(
        templateId,
        historyEntry.exercise_name,
        sets.length,
        historyEntry.superset_group,
      );
      const newExerciseId = exerciseInfo.lastInsertRowid;

      for (const set of sets) {
        insertTemplateSetStmt.run(
          newExerciseId,
          set.set_number,
          set.weight,
          set.reps,
        );
      }
    }
  })();

  res.status(200).send();
});

module.exports = router;
