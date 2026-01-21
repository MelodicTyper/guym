import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Title,
  Button,
  Card,
  Group,
  Text,
  NumberInput,
  Stack,
} from "@mantine/core";
import apiClient from "../api/api";
import { useInterval } from "@mantine/hooks";
import "./WorkoutSession.css";

function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [orderedSets, setOrderedSets] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [currentSetId, setCurrentSetId] = useState(null);

  const interval = useInterval(() => {
    if (workout) {
      setElapsed(Date.now() - new Date(workout.start_time).getTime());
    }
  }, 1000);

  const fetchWorkout = async () => {
    const response = await apiClient.get(`/workouts/${id}`);
    const workoutData = response.data;
    setWorkout(workoutData);

    const supersetGroups = Object.values(
      workoutData.entries.reduce((acc, entry) => {
        const key = entry.superset_group || `single-${entry.id}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(entry);
        return acc;
      }, {}),
    );

    const newOrderedSets = [];
    supersetGroups.forEach((group) => {
      if (group.length > 1) {
        const maxSets = Math.max(...group.map((entry) => entry.sets.length));
        for (let i = 0; i < maxSets; i++) {
          for (const entry of group) {
            if (entry.sets[i]) {
              newOrderedSets.push(entry.sets[i]);
            }
          }
        }
      } else {
        newOrderedSets.push(...group[0].sets);
      }
    });

    setOrderedSets(newOrderedSets);
    const firstUncompletedSet = newOrderedSets.find((set) => !set.completed);
    if (firstUncompletedSet) {
      setCurrentSetId(firstUncompletedSet.id);
    } else if (newOrderedSets.length > 0) {
      // All sets are completed, workout is done
      setCurrentSetId(null);
    }
  };

  useEffect(() => {
    fetchWorkout();
    interval.start();
    return interval.stop;
  }, [id]);

  const handleAddSet = async () => {
    const currentEntry = workout.entries.find((entry) =>
      entry.sets.some((set) => set.id === currentSetId),
    );
    const currentSetData = orderedSets.find((set) => set.id === currentSetId);

    await apiClient.post(`/workout-sets`, {
      workout_entry_id: currentEntry.id,
      weight: currentSetData.weight,
      reps: currentSetData.reps,
    });
    fetchWorkout();
  };

  const handleSetDataChange = (field, value) => {
    const newWorkout = { ...workout };
    const entry = newWorkout.entries.find((entry) =>
      entry.sets.some((set) => set.id === currentSetId),
    );
    const set = entry.sets.find((set) => set.id === currentSetId);
    set[field] = value;
    setWorkout(newWorkout);
  };

  const handleNextSet = async () => {
    const currentSetIndex = orderedSets.findIndex(
      (set) => set.id === currentSetId,
    );
    const currentSet = orderedSets[currentSetIndex];

    await apiClient.put(`/workout-sets/${currentSetId}`, {
      ...currentSet,
      completed: 1,
    });

    // Update the local state to reflect the change immediately
    const newWorkout = { ...workout };
    const entry = newWorkout.entries.find((entry) =>
      entry.sets.some((set) => set.id === currentSetId),
    );
    const set = entry.sets.find((set) => set.id === currentSetId);
    set.completed = true;
    setWorkout(newWorkout);

    const nextSet = orderedSets[currentSetIndex + 1];

    if (nextSet) {
      setCurrentSetId(nextSet.id);
    } else {
      await apiClient.put(`/workouts/${workout.id}/finish`);
      navigate("/");
    }
  };

  const formatTime = (timeInMilliseconds) => {
    const totalSeconds = Math.floor(timeInMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!workout || orderedSets.length === 0) {
    return (
      <div className="workout-session-container">
        <Text>Loading...</Text>
      </div>
    );
  }
  if (!currentSetId) {
    return (
      <div className="workout-session-container">
        <Stack align="center">
          <Title>Workout Complete!</Title>
          <Button onClick={() => navigate("/")} mt="md" size="lg">
            Back to Dashboard
          </Button>
        </Stack>
      </div>
    );
  }

  const currentEntry = workout.entries.find((entry) =>
    entry.sets.some((set) => set.id === currentSetId),
  );
  const currentSetData = orderedSets.find((set) => set.id === currentSetId);
  const currentSetIndexInExercise = currentEntry.sets.findIndex(
    (s) => s.id === currentSetId,
  );
  return (
    <div className="workout-session-container">
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <Group position="apart">
          <Title order={2}>{workout.name || workout.template_name}</Title>
          <Title order={4}>{formatTime(elapsed)}</Title>
        </Group>

        <Card withBorder p="lg" radius="md" mt="xl">
          <Stack align="center" spacing="xl">
            <Title order={3}>{currentEntry.exercise_name}</Title>
            <Text size="xl">
              Set {currentSetIndexInExercise + 1} of {currentEntry.sets.length}
            </Text>

            <Group grow>
              <NumberInput
                label="Weight"
                value={currentSetData.weight}
                onChange={(val) => handleSetDataChange("weight", val)}
              />
              <NumberInput
                label="Reps"
                value={currentSetData.reps}
                onChange={(val) => handleSetDataChange("reps", val)}
              />
            </Group>

            <Group>
              <Button onClick={handleNextSet} size="lg">
                Next Set
              </Button>
              <Button onClick={handleAddSet} size="lg" variant="light">
                Add Set
              </Button>
            </Group>
          </Stack>
        </Card>
      </div>
    </div>
  );
}

export default WorkoutSession;
