const express = require("express");
const router = express.Router();
const { db } = require("../db");

// Start a new workout from a template
router.post("/", (req, res) => {
  console.log("POST /api/workouts hit");
  const { template_id, name } = req.body;

  if (!template_id) {
    return res.status(400).json({ error: "Template ID is required" });
  }

  const startTime = new Date().toISOString();

  const stmt = db.prepare(
    "INSERT INTO workouts (template_id, name, start_time) VALUES (?, ?, ?)",
  );
  const info = stmt.run(template_id, name, startTime);

  const workoutId = info.lastInsertRowid;
  console.log("Created workout with id:", workoutId);

  // Get exercises from template and create workout_entries
  const exercisesStmt = db.prepare(
    "SELECT * FROM exercises WHERE template_id = ? ORDER BY superset_group, id",
  );
  const exercises = exercisesStmt.all(template_id);

  const insertEntryStmt = db.prepare(
    "INSERT INTO workout_entries (workout_id, exercise_id, exercise_name, superset_group) VALUES (?, ?, ?, ?)",
  );
  const insertSetStmt = db.prepare(
    "INSERT INTO workout_sets (workout_entry_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)",
  );

  const entries = [];
  for (const exercise of exercises) {
    const entryInfo = insertEntryStmt.run(
      workoutId,
      exercise.id,
      exercise.name,
      exercise.superset_group,
    );
    const workoutEntryId = entryInfo.lastInsertRowid;
    const sets = [];
    for (let i = 1; i <= exercise.sets; i++) {
      const setInfo = insertSetStmt.run(
        workoutEntryId,
        i,
        exercise.weight,
        exercise.reps,
        0,
      );
      sets.push({
        id: setInfo.lastInsertRowid,
        workout_entry_id: workoutEntryId,
        set_number: i,
        weight: exercise.weight,
        reps: exercise.reps,
        completed: false,
      });
    }

    entries.push({
      id: workoutEntryId,
      workout_id: workoutId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      superset_group: exercise.superset_group,
      sets: sets,
    });
  }
  console.log("Created entries:", entries);

  res.status(201).json({
    id: workoutId,
    template_id,
    name,
    start_time: startTime,
    entries,
  });
});

// End a workout session
router.put("/:id/finish", (req, res) => {
  const { id } = req.params;
  const endTime = new Date();
  const dateCompleted = endTime.toISOString().split("T")[0];

  const getWorkoutStmt = db.prepare(
    "SELECT start_time FROM workouts WHERE id = ?",
  );
  const workout = getWorkoutStmt.get(id);

  if (!workout) {
    return res.status(404).json({ error: "Workout not found" });
  }

  const startTime = new Date(workout.start_time);
  const duration = Math.round((endTime - startTime) / 1000); // Duration in seconds

  const stmt = db.prepare(
    "UPDATE workouts SET end_time = ?, date_completed = ?, duration = ? WHERE id = ?",
  );
  const info = stmt.run(endTime.toISOString(), dateCompleted, duration, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Workout not found" });
  }

  res.json({
    id,
    end_time: endTime.toISOString(),
    date_completed: dateCompleted,
    duration,
  });
});

// Get workout history for the dashboard graphs
router.get("/history", (req, res) => {
  const stmt = db.prepare(`
        SELECT
            w.id,
            w.date_completed,
            w.name AS workout_name,
            t.name AS template_name
        FROM workouts w
        JOIN templates t ON w.template_id = t.id
        WHERE w.date_completed IS NOT NULL
        ORDER BY w.date_completed DESC, w.start_time DESC
    `);
  const history = stmt.all();
  res.json(history);
});

// DELETE /api/workouts/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM workouts WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Workout not found" });
  }

  res.status(204).send();
});

// GET /api/workouts/active
router.get("/active", (req, res) => {
  const stmt = db.prepare(`
        SELECT
            w.id,
            w.start_time,
            w.name as workout_name,
            t.name AS template_name
        FROM workouts w
        JOIN templates t ON w.template_id = t.id
        WHERE w.end_time IS NULL
        ORDER BY w.start_time DESC
    `);
  const activeWorkouts = stmt.all();
  res.json(activeWorkouts);
});

router.get("/progress/exercise/:exerciseName", (req, res) => {
  const { exerciseName } = req.params;
  const stmt = db.prepare(`
    SELECT
      w.date_completed,
      we.volume,
      MAX(ws.weight) as top_weight,
      MAX(ws.reps) as max_reps
    FROM workouts w
    JOIN workout_entries we ON w.id = we.workout_id
    JOIN workout_sets ws ON we.id = ws.workout_entry_id
    WHERE we.exercise_name = ?
    GROUP BY w.id
    ORDER BY w.date_completed
  `);
  const exerciseData = stmt.all(exerciseName);
  res.json(exerciseData);
});

router.get("/progress/volume/:templateId", (req, res) => {
  const { templateId } = req.params;
  const stmt = db.prepare(`
    SELECT
      w.date_completed,
      SUM(we.volume) AS total_volume
    FROM workouts w
    JOIN workout_entries we ON w.id = we.workout_id
    WHERE w.date_completed IS NOT NULL AND w.template_id = ?
    GROUP BY w.id
    ORDER BY w.date_completed
  `);
  const volumeData = stmt.all(templateId);
  res.json(volumeData);
});

// GET /api/workouts/progress/volume
router.get("/progress/volume", (req, res) => {
  const stmt = db.prepare(`
    SELECT
      w.date_completed,
      SUM(we.volume) AS total_volume
    FROM workouts w
    JOIN workout_entries we ON w.id = we.workout_id
    WHERE w.date_completed IS NOT NULL
    GROUP BY w.id
    ORDER BY w.date_completed
  `);
  const volumeData = stmt.all();
  res.json(volumeData);
});

// GET /api/workouts/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  console.log("Fetching workout with id:", id);
  const workoutStmt = db.prepare(
    "SELECT w.*, w.name as workout_name, t.name as template_name FROM workouts w JOIN templates t ON w.template_id = t.id WHERE w.id = ?",
  );
  const workout = workoutStmt.get(id);

  if (!workout) {
    return res.status(404).json({ error: "Workout not found" });
  }

  const entriesStmt = db.prepare(
    "SELECT * FROM workout_entries WHERE workout_id = ? ORDER BY superset_group, id",
  );
  const entries = entriesStmt.all(id);

  const setsStmt = db.prepare(
    "SELECT * FROM workout_sets WHERE workout_entry_id = ?",
  );
  for (const entry of entries) {
    const sets = setsStmt.all(entry.id);
    entry.sets = sets;
  }
  console.log("Fetched entries:", entries);
  workout.entries = entries;

  res.json(workout);
});

module.exports = router;
