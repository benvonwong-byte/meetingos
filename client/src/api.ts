import axios from "axios";
import { api } from "./dcSession";

export const instance = axios.create({
  baseURL: api("events/"), // /meeting/api/events/ on beta, forwarded to Firebase
});