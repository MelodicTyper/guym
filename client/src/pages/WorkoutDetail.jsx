import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Title, Text, Paper } from "@mantine/core";
import apiClient from "../api/api";
import "./WorkoutDetail.css";

function WorkoutDetail() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const response = await apiClient.get(`/workouts/${id}`);
      setWorkout(response.data);
    };
    fetchWorkout();
  }, [id]);

  if (!workout) {
    return <Text>Loading...</Text>;
  }

  const groupedEntries = workout.entries.reduce((acc, entry) => {
    const key = entry.superset_group || `single-${entry.id}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {});

  let exerciseCounter = 1;

  return (
    <Paper withBorder p="md" my="md">
      <Title order={2}>{workout.name}</Title>
      <Text c="dimmed" mb="md">
        {new Date(workout.date_completed).toLocaleDateString()}
      </Text>

      {Object.values(groupedEntries).map((group, groupIndex) => (
        <div key={groupIndex} className="workout-group">
          {group.map((entry, entryIndex) => {
            const exercisePrefix =
              group.length > 1
                ? `${exerciseCounter}${String.fromCharCode(65 + entryIndex)}.`
                : `${exerciseCounter}.`;
            return (
              <div key={entry.id} className="exercise-details">
                <Text fw={500}>
                  {exercisePrefix} {entry.exercise_name}
                </Text>
                {entry.sets.map((set, setIndex) => (
                  <Text key={set.id} ml={20}>
                    Set {setIndex + 1}: {set.weight} lbs x {set.reps} reps
                  </Text>
                ))}
              </div>
            );
          })}
          {(() => {
            if (group.length === 1) exerciseCounter++;
            return null;
          })()}
        </div>
      ))}
      {(() => {
        // This is a bit of a hack to increment the counter for supersets
        const supersetCount = Object.values(groupedEntries).filter(
          (group) => group.length > 1,
        ).length;
        exerciseCounter += supersetCount;
        return null;
      })()}
    </Paper>
  );
}

export default WorkoutDetail;
