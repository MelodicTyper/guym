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

function VolumeChart({ templateId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchVolumeData = async () => {
      let url = "/workouts/progress/volume";
      if (templateId && templateId !== "all") {
        url = `/workouts/progress/volume/${templateId}`;
      }
      const response = await apiClient.get(url);
      const formattedData = response.data.map((item) => ({
        ...item,
        date: new Date(item.date_completed).toLocaleDateString(),
      }));
      setData(formattedData);
    };
    fetchVolumeData();
  }, [templateId]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total_volume" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default VolumeChart;
