import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../api/api";

function ExercisePRChart({ exerciseName }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!exerciseName) return;
    const fetchExerciseData = async () => {
      const response = await apiClient.get(
        `/workouts/progress/exercise/${exerciseName}`
      );
      const formattedData = response.data.map((item) => ({
        ...item,
        date: new Date(item.date_completed).toLocaleDateString(),
      }));
      setData(formattedData);
    };
    fetchExerciseData();
  }, [exerciseName]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="max_reps" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ExercisePRChart;
