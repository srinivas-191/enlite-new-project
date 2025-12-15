// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet, setAuthToken } from "../lib/api";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); //username OR email
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Try logging in using a username
  async function attemptLoginWithUsername(usernameToTry) {
    try {
      const res = await apiPost("/login/", {
        username: usernameToTry,
        password,
      });
      return res;
    } catch (err) {
      return { error: err?.response?.data?.error || "Login failed" };
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);

    let res = await attemptLoginWithUsername(identifier);

    // If login failed *and* identifier looks like an email → map email to username
    if (res?.error && identifier.includes("@")) {
      try {
        const map = await apiPost("/get-username-by-email/", {
          email: identifier,
        });
        if (map?.username) {
          res = await attemptLoginWithUsername(map.username);
        }
      } catch (err) {
        // Ignore, will fallback to showing error
      }
    }

    if (!res?.token) {
      alert(res?.error || "Invalid login credentials");
      setBusy(false);
      return;
    }

    // Save auth info
    setAuthToken(res.token);
    localStorage.setItem("username", res.username);
    localStorage.setItem("isAdmin", res.is_admin ? "true" : "false");
    localStorage.setItem("token", res.token);

    // OPTIONAL: Load subscription info
    try {
      const sub = await apiGet("/subscription/");
      localStorage.setItem("subscription", JSON.stringify(sub.subscription));
    } catch (e) {
      console.error("Subscription fetch failed", e);
    }

    // Update Navbar (authChange)
    window.dispatchEvent(new Event("authChange"));

    // Redirect Admin
    if (res.is_admin) {
      navigate("/admin-dashboard");
      setBusy(false);
      return;
    }

    // Redirect User
    const redirect = localStorage.getItem("postLoginRedirect");

    if (redirect) {
      localStorage.removeItem("postLoginRedirect");
      navigate(redirect);
    } else {
      navigate("/profile");
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCF5EE]">
      <div className="bg-white p-8 rounded shadow w-full max-w-md mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter Username or Email"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Forgot Password */}
        <p className="text-center mt-3">
          <span
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 cursor-pointer"
          >
            Forgot Password?
          </span>
        </p>

        {/* Register Link */}
        <p className="text-center mt-3">
          Don’t have an account?
          <span
            onClick={() => navigate("/register")}
            className="text-green-600 cursor-pointer ml-1"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
