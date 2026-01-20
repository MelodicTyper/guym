import { useState, useEffect } from "react";
import {
  Title,
  TextInput,
  Button,
  Paper,
  SimpleGrid,
  NumberInput,
  Group,
  NavLink,
  Text,
  ActionIcon,
  Card,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconLink,
  IconTrash,
  IconUnlink,
  IconPencil,
} from "@tabler/icons-react";
import apiClient from "../api/api";
import "./TemplateBuilder.css";

function TemplateBuilder() {
  const theme = useMantineTheme();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    weight: 50,
    sets: 3,
    reps: 7,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const response = await apiClient.get("/templates");
    setTemplates(response.data);
  };

  const fetchTemplateDetails = async (templateId) => {
    const response = await apiClient.get(`/templates/${templateId}`);
    setSelectedTemplate(response.data);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName) return;
    const response = await apiClient.post("/templates", {
      name: newTemplateName,
    });
    setTemplates([...templates, response.data]);
    setNewTemplateName("");
  };

  const handleUpdateTemplateName = async (templateId) => {
    if (!editingTemplateName) return;
    await apiClient.put(`/templates/${templateId}`, {
      name: editingTemplateName,
    });
    setEditingTemplateId(null);
    setEditingTemplateName("");
    fetchTemplates();
    if (selectedTemplate?.id === templateId) {
      fetchTemplateDetails(templateId);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      await apiClient.delete(`/templates/${templateId}`);
      setTemplates(templates.filter((template) => template.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleAddExercise = async () => {
    if (!selectedTemplate || !newExercise.name) return;
    await apiClient.post(
      `/templates/${selectedTemplate.id}/exercises`,
      newExercise,
    );
    fetchTemplateDetails(selectedTemplate.id);
    setNewExercise({ name: "", weight: 50, sets: 3, reps: 7 });
  };

  const handleSuperset = async (index) => {
    const exercises = [...selectedTemplate.exercises];
    const exercise1 = exercises[index];
    const exercise2 = exercises[index + 1];

    if (!exercise2) return;

    let exercisesToUpdate = [];
    const supersetId =
      exercise1.superset_group || exercise2.superset_group || Date.now();

    const group1 = exercise1.superset_group
      ? exercises.filter((e) => e.superset_group === exercise1.superset_group)
      : [exercise1];
    const group2 = exercise2.superset_group
      ? exercises.filter((e) => e.superset_group === exercise2.superset_group)
      : [exercise2];

    const combinedGroup = [...group1, ...group2];

    combinedGroup.forEach((e) => {
      if (e.superset_group !== supersetId) {
        e.superset_group = supersetId;
        exercisesToUpdate.push(e);
      }
    });

    for (const exercise of exercisesToUpdate) {
      await apiClient.put(`/exercises/${exercise.id}`, exercise);
    }

    fetchTemplateDetails(selectedTemplate.id);
  };

  const handleUnsuperset = async (supersetGroupId) => {
    const exercisesToUpdate = selectedTemplate.exercises.filter(
      (e) => e.superset_group === supersetGroupId,
    );

    for (const exercise of exercisesToUpdate) {
      exercise.superset_group = null;
      await apiClient.put(`/exercises/${exercise.id}`, exercise);
    }

    fetchTemplateDetails(selectedTemplate.id);
  };

  const renderExercises = () => {
    if (!selectedTemplate) return null;

    const exercises = selectedTemplate.exercises;
    const groupedExercises = exercises.reduce((acc, exercise) => {
      const key = exercise.superset_group || `single-${exercise.id}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(exercise);
      return acc;
    }, {});

    return Object.values(groupedExercises).map((group, groupIndex) => {
      const isSuperset = group.length > 1;
      return (
        <div key={group[0].id}>
          <Paper
            withBorder={isSuperset}
            p="md"
            mt="md"
            className={isSuperset ? "superset-group" : ""}
          >
            {group.map((exercise) => (
              <Text key={exercise.id}>
                {exercise.name} - {exercise.weight}lbs, {exercise.sets}x
                {exercise.reps}
              </Text>
            ))}
            {isSuperset && (
              <div className="link-button-wrapper">
                <ActionIcon
                  size="sm"
                  variant="default"
                  onClick={() => handleUnsuperset(group[0].superset_group)}
                >
                  <IconUnlink size={14} />
                </ActionIcon>
              </div>
            )}
          </Paper>
          {!isSuperset &&
            groupIndex < Object.values(groupedExercises).length - 1 && (
              <div className="link-button-wrapper">
                <ActionIcon
                  size="sm"
                  variant="default"
                  onClick={() =>
                    handleSuperset(
                      exercises.findIndex((e) => e.id === group[0].id),
                    )
                  }
                >
                  <IconLink size={14} />
                </ActionIcon>
              </div>
            )}
        </div>
      );
    });
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      {/* Templates Column */}
      <Stack>
        <Title order={2}>Workouts</Title>
        <Paper withBorder p="md">
          <Group>
            <TextInput
              label="New Workout"
              placeholder="Workout Name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={handleCreateTemplate} mt="xl">
              Create
            </Button>
          </Group>
        </Paper>
        <Card withBorder p="md">
          <Stack>
            {templates.map((template) => (
              <Group key={template.id} position="apart">
                {editingTemplateId === template.id ? (
                  <>
                    <TextInput
                      value={editingTemplateName}
                      onChange={(e) =>
                        setEditingTemplateName(e.currentTarget.value)
                      }
                      style={{ flex: 1 }}
                    />
                    <Button
                      onClick={() => handleUpdateTemplateName(template.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingTemplateId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <NavLink
                      label={template.name}
                      onClick={() => fetchTemplateDetails(template.id)}
                      active={selectedTemplate?.id === template.id}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      onClick={() => {
                        setEditingTemplateId(template.id);
                        setEditingTemplateName(template.name);
                      }}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </>
                )}
              </Group>
            ))}
          </Stack>
        </Card>
      </Stack>

      {/* Exercises Column */}
      <Stack>
        {selectedTemplate ? (
          <>
            <Title order={2}>{selectedTemplate.name}</Title>
            <Paper withBorder p="md">
              <Title order={4}>Add Exercise</Title>
              <TextInput
                label="Exercise Name"
                placeholder="e.g., Bench Press"
                value={newExercise.name}
                onChange={(e) =>
                  setNewExercise({
                    ...newExercise,
                    name: e.currentTarget.value,
                  })
                }
                mt="sm"
              />
              <Group grow mt="sm">
                <NumberInput
                  label="Weight (lbs)"
                  value={newExercise.weight}
                  onChange={(value) =>
                    setNewExercise({ ...newExercise, weight: value })
                  }
                />
                <NumberInput
                  label="Sets"
                  value={newExercise.sets}
                  onChange={(value) =>
                    setNewExercise({ ...newExercise, sets: value })
                  }
                />
                <NumberInput
                  label="Reps"
                  value={newExercise.reps}
                  onChange={(value) =>
                    setNewExercise({ ...newExercise, reps: value })
                  }
                />
              </Group>
              <Button onClick={handleAddExercise} mt="md">
                Add Exercise
              </Button>
            </Paper>

            <Paper withBorder p="md" mt="md">
              <Title order={4}>Exercises</Title>
              {renderExercises()}
            </Paper>
          </>
        ) : (
          <Text mt="md">Select a workout to see its exercises.</Text>
        )}
      </Stack>
    </SimpleGrid>
  );
}

export default TemplateBuilder;
