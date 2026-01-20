import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../api/api";

function ExerciseVolumeChart({ exerciseName }) {
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
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="volume" stroke="#8884d8" />
        <Line type="monotone" dataKey="top_weight" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ExerciseVolumeChart;
