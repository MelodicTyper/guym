import { useState, useEffect, useCallback } from "react";
import {
  Title,
  Button,
  Card,
  Group,
  Text,
  Stack,
  Notification,
  Modal,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import { IconCheck, IconUpload, IconTrash } from "@tabler/icons-react";
import apiClient from "../api/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const clipboard = useClipboard({ timeout: 1000 });
  const [copiedWorkoutId, setCopiedWorkoutId] = useState(null);
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [workoutName, setWorkoutName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
    fetchActiveWorkouts();
  }, []);

  const fetchTemplates = async () => {
    const response = await apiClient.get("/templates");
    const templatesWithDetails = await Promise.all(
      response.data.map((t) => apiClient.get(`/templates/${t.id}`)),
    );
    setTemplates(templatesWithDetails.map((r) => r.data));
  };

  const fetchHistory = async () => {
    const response = await apiClient.get("/workouts/history");
    setHistory(response.data);
  };

  const fetchActiveWorkouts = async () => {
    const response = await apiClient.get("/workouts/active");
    setActiveWorkouts(response.data);
  };

  const openStartWorkoutModal = (templateId) => {
    setSelectedTemplateId(templateId);
    openModal();
  };

  const handleStartWorkout = async () => {
    if (!selectedTemplateId) return;
    const response = await apiClient.post("/workouts", {
      template_id: selectedTemplateId,
      name: workoutName,
    });
    navigate(`/workout/${response.data.id}`);
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      await apiClient.delete(`/workouts/${workoutId}`);
      setHistory(history.filter((workout) => workout.id !== workoutId));
      fetchActiveWorkouts(); // Refetch active workouts in case one was deleted
    }
  };

  const handleExportWorkout = useCallback(
    async (workoutId) => {
      const response = await apiClient.get(`/workouts/${workoutId}`);
      const workout = response.data;

      let exportText = `${workout.name} - ${new Date(
        workout.date_completed,
      ).toLocaleDateString()}\n\n`;

      const groupedEntries = workout.entries.reduce((acc, entry) => {
        const key = entry.superset_group || `single-${entry.id}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(entry);
        return acc;
      }, {});

      let exerciseCounter = 1;
      Object.values(groupedEntries).forEach((group) => {
        if (group.length > 1) {
          group.forEach((entry, index) => {
            exportText += `${exerciseCounter}${String.fromCharCode(
              65 + index,
            )}. ${entry.exercise_name}\n`;
            entry.sets.forEach((set, setIndex) => {
              exportText += `Set ${setIndex + 1}: ${set.weight} lbs x ${
                set.reps
              }\n`;
            });
            exportText += "\n";
          });
        } else {
          const entry = group[0];
          exportText += `${exerciseCounter}. ${entry.exercise_name}\n`;
          entry.sets.forEach((set, setIndex) => {
            exportText += `Set ${setIndex + 1}: ${set.weight} lbs x ${
              set.reps
            }\n`;
          });
          exportText += "\n";
        }
        exerciseCounter++;
      });

      clipboard.copy(exportText);
      setCopiedWorkoutId(workoutId);
    },
    [clipboard],
  );

  return (
    <div>
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Name Your Workout"
        centered
      >
        <TextInput
          label="Workout Name"
          placeholder="e.g., Morning Lift"
          value={workoutName}
          onChange={(event) => setWorkoutName(event.currentTarget.value)}
        />
        <Button onClick={handleStartWorkout} mt="md">
          Start
        </Button>
      </Modal>
      <Stack
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        {clipboard.copied && copiedWorkoutId && (
          <Notification
            icon={<IconCheck size={18} />}
            title="Copied to clipboard!"
            onClose={() => setCopiedWorkoutId(null)}
          >
            Workout details copied to clipboard.
          </Notification>
        )}
      </Stack>

      {activeWorkouts.length > 0 && (
        <div className="active-workouts-container">
          <Title order={2} mt="xl">
            Active Workouts
          </Title>
          <Group mt="md">
            {activeWorkouts.map((workout) => (
              <Card key={workout.id} shadow="sm" p="lg" radius="md" withBorder>
                <Text weight={500}>{workout.workout_name}</Text>
                <Text size="sm">
                  Started: {new Date(workout.start_time).toLocaleString()}
                </Text>
                <Link to={`/workout/${workout.id}`}>
                  <Button
                    variant="light"
                    color="green"
                    fullWidth
                    mt="md"
                    radius="md"
                  >
                    Continue Workout
                  </Button>
                </Link>
                <Button
                  variant="light"
                  color="red"
                  fullWidth
                  mt="md"
                  radius="md"
                  onClick={() => handleDeleteWorkout(workout.id)}
                >
                  Delete Workout
                </Button>
              </Card>
            ))}
          </Group>
        </div>
      )}
      <Group position="apart" mt="xl">
        <Title order={2}>Workouts</Title>
        <Group>
          <Link to="/progress">
            <Button>Progress</Button>
          </Link>
          <Link to="/templates">
            <Button>Workout Builder</Button>
          </Link>
        </Group>
      </Group>
      <Group mt="md">
        {templates.map((template) => (
          <Card key={template.id} shadow="sm" p="lg" radius="md" withBorder>
            <Text weight={500}>{template.name}</Text>
            {template.exercises && template.exercises.length > 0 ? (
              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                radius="md"
                onClick={() => openStartWorkoutModal(template.id)}
              >
                Start Workout
              </Button>
            ) : (
              <Text size="sm" color="dimmed" mt="md">
                Add exercises in the Workout Builder to start this workout.
              </Text>
            )}
          </Card>
        ))}
      </Group>
      <Title order={2} mt="xl">
        Workout History
      </Title>
      {history.map((workout) => (
        <Card
          key={workout.id}
          shadow="sm"
          p="lg"
          radius="md"
          withBorder
          mt="md"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>
              {workout.workout_name} -{" "}
              {new Date(workout.date_completed).toLocaleDateString()}
            </Text>
            <Group>
              <ActionIcon onClick={() => handleExportWorkout(workout.id)}>
                <IconUpload />
              </ActionIcon>
              <ActionIcon
                color="red"
                onClick={() => handleDeleteWorkout(workout.id)}
              >
                <IconTrash />
              </ActionIcon>
            </Group>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default Dashboard;
