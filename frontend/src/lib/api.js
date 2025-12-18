// src/lib/api.js
import axios from "axios";

// -----------------------------------------
// BASE URL
// -----------------------------------------


// export const API_BASE =
//   import.meta.env.VITE_API_BASE ||
//   "https://pleasant-nature-production-b708.up.railway.app/api/";

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://enlite-new-project-1.onrender.com/api/";

//latest
// export const API_BASE =
//   import.meta.env.VITE_API_BASE ||
//   "https://enlite-production-2dce.up.railway.app/api/";


// export const API_BASE =
//   import.meta.env.VITE_API_BASE ||
//   "http://127.0.0.1:8000/api/";

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// -----------------------------------------
// AUTH TOKEN MANAGEMENT
// -----------------------------------------
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Token ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];

  // Clear user-related storage
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("postLoginRedirect");

  sessionStorage.clear();
}

// Load token on refresh
const savedToken = localStorage.getItem("token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Token ${savedToken}`;
}

// -----------------------------------------
// JSON REQUEST HELPERS
// -----------------------------------------
export async function apiGet(path) {
  try {
    const res = await api.get(path);
    return res.data;
  } catch (err) {
    console.error("GET ERROR:", path, err.response?.data || err);
    throw err;
  }
}

export async function apiPost(path, body) {
  try {
    const res = await api.post(path, body);
    return res.data;
  } catch (err) {
    console.error("POST ERROR:", path, err.response?.data || err);
    throw err;
  }
}

export async function apiPut(path, body) {
  try {
    const res = await api.put(path, body);
    return res.data;
  } catch (err) {
    console.error("PUT ERROR:", path, err.response?.data || err);
    throw err;
  }
}

export async function apiDelete(path) {
  try {
    const res = await api.delete(path);
    return res.data;
  } catch (err) {
    console.error("DELETE ERROR:", path, err.response?.data || err);
    throw err;
  }
}

// -----------------------------------------
// FORM-DATA / FILE UPLOAD
// -----------------------------------------
export async function apiPostForm(path, formData) {
  try {
    const res = await api.post(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("FORM POST ERROR:", path, err.response?.data || err);
    throw err;
  }
}
