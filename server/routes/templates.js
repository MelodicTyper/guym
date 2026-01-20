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

  if (!name || !weight || !sets || !reps) {
    return res.status(400).json({ error: "Missing required exercise fields" });
  }

  const stmt = db.prepare(
    "INSERT INTO exercises (template_id, name, weight, sets, reps) VALUES (?, ?, ?, ?, ?)",
  );
  const info = stmt.run(id, name, weight, sets, reps);

  res.status(201).json({
    id: info.lastInsertRowid,
    template_id: id,
    name,
    weight,
    sets,
    reps,
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

module.exports = router;
