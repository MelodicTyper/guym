
# Guym - Your Personal Gym Companion

Guym is a full-stack web application designed to help you manage your workout routines. It allows you to create workout templates, start workout sessions, and track your progress.

## Features

*   **Workout Templates:** Create and customize your own workout templates.
*   **Workout Sessions:** Start a workout session based on your templates.
*   **Exercise Tracking:** Track your sets, reps, and weight for each exercise.
*   **Dashboard:** View your workout history and progress.

## Technologies Used

*   **Front-end:**
    *   React
    *   Vite
    *   Axios
*   **Back-end:**
    *   Node.js
    *   Express
    *   SQLite
*   **Containerization:**
    *   Docker

## Setup and Installation

### Prerequisites

*   Node.js
*   npm
*   Docker (optional)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://your-repository-url.com/guym.git
    cd guym
    ```

2.  **Install front-end dependencies:**
    ```bash
    cd client
    npm install
    ```

3.  **Install back-end dependencies:**
    ```bash
    cd ../server
    npm install
    ```

## Available Scripts

### Front-end (in the `/client` directory)

*   `npm run dev`: Starts the front-end development server.
*   `npm run build`: Builds the front-end for production.
*   `npm run lint`: Lints the front-end code.
*   `npm run preview`: Serves the production build locally.

### Back-end (in the `/server` directory)

*   `npm start`: Starts the back-end server.

## API Endpoints

*   **GET /api/exercises:** Get all exercises.
*   **GET /api/templates:** Get all workout templates.
*   **POST /api/templates:** Create a new workout template.
*   **GET /api/workouts:** Get all workouts.
*   **POST /api/workouts:** Create a new workout.
*   **GET /api/workout-entries:** Get all workout entries.
*   **POST /api/workout-entries:** Create a new workout entry.

## Folder Structure

```
/
├── client/
│   ├── src/
│   │   ├── api/        # API calls
│   │   ├── components/ # React components
│   │   └── pages/      # Page components
│   └── ...
└── server/
    ├── database/     # SQLite database
    ├── routes/       # API routes
    └── ...
```
