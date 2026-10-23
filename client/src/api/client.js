import axios from "axios";
// One credentialed client keeps cookie authentication consistent across every page.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});
function apiMessage(error) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? "The request failed. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
export {
  api,
  apiMessage
};
