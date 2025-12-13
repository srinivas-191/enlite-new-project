// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // Save the attempted URL so we can redirect back after login
    localStorage.setItem("postLoginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}
