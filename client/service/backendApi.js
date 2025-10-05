import axios from "axios";
import { getApiUrl, getSocketUrl } from "../src/config/environment.js";

// Create axios instance with configuration
const fetchData = axios.create({
  baseURL: getApiUrl("/api"),
  withCredentials: true,
});

// Export the socket URL getter
export { getSocketUrl };

export default fetchData;
