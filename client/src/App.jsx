import { AppShell, Group, Title } from "@mantine/core";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TemplateBuilder from "./pages/TemplateBuilder";
import WorkoutSession from "./pages/WorkoutSession";
import Progress from "./pages/Progress";

function App() {
  return (
    <Router>
      <AppShell header={{ height: 60 }} padding="md">
        <AppShell.Header>
          <Group h="100%" px="md">
            <Title order={3}>
              <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                guym
              </Link>
            </Title>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={<TemplateBuilder />} />
            <Route path="/workout/:id" element={<WorkoutSession />} />
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </Router>
  );
}

export default App;
