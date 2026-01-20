const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDB } = require("./db");

// Initialize the database
initializeDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API routes
const templateRoutes = require("./routes/templates");
app.use("/api/templates", templateRoutes);

const exerciseRoutes = require("./routes/exercises");
app.use("/api/exercises", exerciseRoutes);

const workoutRoutes = require("./routes/workouts");
app.use("/api/workouts", workoutRoutes);

const workoutSetsRoutes = require("./routes/workout-sets");
app.use("/api/workout-sets", workoutSetsRoutes);

// Production-only static file serving
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "public")));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
