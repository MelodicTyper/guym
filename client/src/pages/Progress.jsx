import { useState, useEffect } from "react";
import { Title, Grid, Paper, Select } from "@mantine/core";
import VolumeChart from "../components/charts/VolumeChart";
import ExerciseVolumeChart from "../components/charts/ExerciseVolumeChart";
import ExercisePRChart from "../components/charts/ExercisePRChart";
import apiClient from "../api/api";

function Progress() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const response = await apiClient.get("/templates");
      setTemplates(response.data);
    };
    const fetchExercises = async () => {
      const response = await apiClient.get("/exercises/names");
      setExercises(response.data);
    };
    fetchTemplates();
    fetchExercises();
  }, []);

  const templateOptions = [
    { value: "all", label: "All Workouts" },
    ...templates.map((t) => ({ value: t.id.toString(), label: t.name })),
  ];

  return (
    <div>
      <Title order={2} mb="xl">
        Progress
      </Title>
      <Grid>
        <Grid.Col span={12}>
          <Paper withBorder p="md">
            <Select
              label="Select Workout"
              placeholder="Pick one"
              data={templateOptions}
              onChange={setSelectedTemplate}
            />
            <VolumeChart templateId={selectedTemplate} />
          </Paper>
        </Grid.Col>
        <Grid.Col span={12}>
          <Paper withBorder p="md">
            <Select
              label="Select Exercise"
              placeholder="Pick one"
              data={exercises}
              onChange={setSelectedExercise}
            />
            {selectedExercise && (
              <>
                <ExerciseVolumeChart exerciseName={selectedExercise} />
                <ExercisePRChart exerciseName={selectedExercise} />
              </>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}

export default Progress;
