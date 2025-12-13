// src/pages/ResetPasswordPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export default function ResetPasswordPage() {
  const loc = useLocation();
  const navigate = useNavigate();

  const initialEmail = loc.state?.email || "";
  const initialOtp = loc.state?.otp || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await apiPost("/forgot-password/reset/", {
        email,
        otp,
        new_password: newPassword,
      });

      if (res?.error) {
        alert(res.error);
      } else {
        alert(res.message || "Password reset successful");
        navigate("/login");
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to reset password");
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCF5EE]">
      <div className="bg-white p-8 rounded shadow w-full max-w-md mt-24">

        <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>

        <form onSubmit={handleReset} className="space-y-4">

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="OTP"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            type="password"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {busy ? "Resetting..." : "Reset Password"}
          </button>
        </form>

      </div>
    </div>
  );
}
