import axios from "axios";

const BASE_URL = import.meta.env.DEV ? "http://localhost:3000/api" : "/"; // or '/api' if all your routes start with /api

const apiClient = axios.create({
  baseURL: "/api",
});
export default apiClient;
