import axios from "axios";

const fetchData = await axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
});

export default fetchData;
