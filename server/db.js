const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.resolve(__dirname, "database/guym.db"), {
  fileMustExist: false,
});

function initializeDB() {
  const createTemplatesTable = `
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `;

  const createExercisesTable = `
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      superset_group INTEGER,
      FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
    );
  `;

  const createTemplateSetsTable = `
    CREATE TABLE IF NOT EXISTS template_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    );
  `;

  const createWorkoutsTable = `
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      name TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      date_completed DATE,
      duration INTEGER,
      FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
    );
  `;

  const createWorkoutEntriesTable = `
    CREATE TABLE IF NOT EXISTS workout_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER,
      exercise_name TEXT NOT NULL,
      superset_group INTEGER,
      volume REAL,
      FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE SET NULL
    );
  `;

  const createWorkoutSetsTable = `
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_entry_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_entry_id) REFERENCES workout_entries (id) ON DELETE CASCADE
    );
  `;

  try {
    db.exec(createTemplatesTable);
    db.exec(createExercisesTable);
    db.exec(createTemplateSetsTable);
    db.exec(createWorkoutsTable);
    db.exec(createWorkoutEntriesTable);
    db.exec(createWorkoutSetsTable);
    console.log("Database initialized.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

module.exports = { db, initializeDB };
