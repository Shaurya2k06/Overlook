import axios from "axios";

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return 'https://overlook-6yrs.onrender.com/api';
  }
  return 'http://localhost:3001/api';
};

// Determine the Socket URL based on environment
export const getSocketUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return 'https://overlook-6yrs.onrender.com';
  }
  return 'http://localhost:3001';
};

const fetchData = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export default fetchData;
