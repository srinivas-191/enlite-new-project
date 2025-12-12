// src/lib/api.js
import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://beneficial-quietude-production.up.railway.app/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/* --------------------------------------------
   Set Auth Token Globally (axios + LocalStorage)
---------------------------------------------- */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Token ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

/* --------------------------------------------
   Clear Token + User Data on Logout
---------------------------------------------- */
export function clearAuthToken() {
  // remove token header
  delete api.defaults.headers.common["Authorization"];

  // clear stored user info
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("postLoginRedirect");

  // clear prediction sessions
  sessionStorage.clear();
}

/* --------------------------------------------
   Load Token Automatically on Page Refresh
---------------------------------------------- */
const savedToken = localStorage.getItem("token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Token ${savedToken}`;
}

/* --------------------------------------------
   Wrapper Methods
---------------------------------------------- */
export async function apiGet(path) {
  const res = await api.get(path);
  return res.data;
}

export async function apiPost(path, body) {
  const res = await api.post(path, body);
  return res.data;
}

export async function apiPut(path, body) {
  const res = await api.put(path, body);
  return res.data;
}

export async function apiDelete(path) {
  const res = await api.delete(path);
  return res.data;
}
