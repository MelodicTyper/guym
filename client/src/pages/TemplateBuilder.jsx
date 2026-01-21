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
  Modal,
  Table,
  Tooltip,
} from "@mantine/core";
import {
  IconLink,
  IconTrash,
  IconUnlink,
  IconPencil,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import apiClient from "../api/api";
import "./TemplateBuilder.css";
import { Badge } from "@mantine/core";

function TemplateBuilder() {
  const theme = useMantineTheme();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: 3,
  });
  const [history, setHistory] = useState([]);
  const [
    historyModalOpened,
    { open: openHistoryModal, close: closeHistoryModal },
  ] = useDisclosure(false);

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const response = await apiClient.get("/workouts/history");
    setHistory(response.data);
  };

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
      { ...newExercise, weight: 50, reps: 7 }, // Add default weight and reps
    );
    fetchTemplateDetails(selectedTemplate.id);
    setNewExercise({ name: "", sets: 3 });
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

  const handleUpdateFromHistory = async (workoutId) => {
    if (!selectedTemplate) return;
    await apiClient.put(
      `/templates/${selectedTemplate.id}/from-history/${workoutId}`,
    );
    closeHistoryModal();
    fetchTemplateDetails(selectedTemplate.id);
  };

  const handleUpdateSets = async (exerciseId) => {
    const exercise = selectedTemplate.exercises.find(
      (ex) => ex.id === exerciseId,
    );
    if (!exercise) return;

    const setsToUpdate = Object.entries(editingSets)
      .filter(([setId]) => exercise.sets.some((s) => s.id === parseInt(setId)))
      .map(([setId, values]) => {
        const originalSet = exercise.sets.find((s) => s.id === parseInt(setId));
        return {
          ...originalSet,
          ...values,
        };
      });

    if (setsToUpdate.length === 0) return;

    await apiClient.put(`/exercises/${exerciseId}/sets`, {
      sets: setsToUpdate,
    });

    setEditingSets({});
    fetchTemplateDetails(selectedTemplate.id);
  };

  const [editingSets, setEditingSets] = useState({});

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
            mt="xl"
            sx={{ backgroundColor: theme.colors.dark[8] }}
            className={isSuperset ? "superset-group" : ""}
          >
            {group.map((exercise, exerciseIndex) => (
              <div
                key={exercise.id}
                className={
                  isSuperset && exerciseIndex < group.length - 1
                    ? "exercise-in-superset"
                    : ""
                }
              >
                <Title order={3} sx={{ textTransform: "capitalize" }}>
                  {exercise.name}
                </Title>
                <Table>
                  <thead>
                    <tr>
                      <th
                        style={{
                          fontSize: "0.8em",
                          color: theme.colors.gray[6],
                          fontWeight: "normal",
                        }}
                      >
                        Set
                      </th>
                      <th
                        style={{
                          fontSize: "0.8em",
                          color: theme.colors.gray[6],
                          fontWeight: "normal",
                        }}
                      >
                        Weight (lbs)
                      </th>
                      <th
                        style={{
                          fontSize: "0.8em",
                          color: theme.colors.gray[6],
                          fontWeight: "normal",
                        }}
                      >
                        Reps
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr key={set.id}>
                        <td>
                          <Badge>{set.set_number}</Badge>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <NumberInput
                            value={editingSets[set.id]?.weight ?? set.weight}
                            onChange={(value) =>
                              setEditingSets({
                                ...editingSets,
                                [set.id]: {
                                  ...editingSets[set.id],
                                  weight: value,
                                },
                              })
                            }
                            style={{ width: "120px", margin: "0 auto" }}
                            styles={{
                              input: {
                                textAlign: "center",
                                backgroundColor: theme.colors.dark[6],
                                borderRadius: theme.radius.sm,
                                padding: "0 10px",
                              },
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <NumberInput
                            value={editingSets[set.id]?.reps ?? set.reps}
                            onChange={(value) =>
                              setEditingSets({
                                ...editingSets,
                                [set.id]: {
                                  ...editingSets[set.id],
                                  reps: value,
                                },
                              })
                            }
                            style={{ width: "120px", margin: "0 auto" }}
                            styles={{
                              input: {
                                textAlign: "center",
                                backgroundColor: theme.colors.dark[6],
                                borderRadius: theme.radius.sm,
                                padding: "0 10px",
                              },
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Button
                  onClick={() => handleUpdateSets(exercise.id)}
                  mt="sm"
                  fullWidth
                >
                  Update Sets
                </Button>
              </div>
            ))}
            {isSuperset && (
              <div className="link-button-wrapper">
                <Tooltip label="Remove Superset">
                  <ActionIcon
                    size="sm"
                    variant="default"
                    onClick={() => handleUnsuperset(group[0].superset_group)}
                  >
                    <IconUnlink size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
            )}
          </Paper>
          {!isSuperset &&
            groupIndex < Object.values(groupedExercises).length - 1 && (
              <div className="link-button-wrapper">
                <Tooltip label="Create Superset">
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
                </Tooltip>
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
                  label="Sets"
                  value={newExercise.sets}
                  onChange={(value) =>
                    setNewExercise({ ...newExercise, sets: value })
                  }
                />
              </Group>
              <Button onClick={handleAddExercise} mt="md">
                Add Exercise
              </Button>
              <Button onClick={openHistoryModal} mt="md" ml="md">
                Update From History
              </Button>
            </Paper>

            <Modal
              opened={historyModalOpened}
              onClose={closeHistoryModal}
              title="Update from History"
            >
              <Stack>
                {history.map((workout) => (
                  <Card key={workout.id} withBorder>
                    <Group position="apart">
                      <Text>
                        {workout.workout_name} -{" "}
                        {new Date(workout.date_completed).toLocaleDateString()}
                      </Text>
                      <Button
                        onClick={() => handleUpdateFromHistory(workout.id)}
                      >
                        Update
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Modal>

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
