// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSendOtp(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await apiPost("/forgot-password/request/", { email });

      if (res?.error) {
        alert(res.error);
      } else {
        alert(res.message || "OTP sent to your email.");
        navigate("/forgot-password/verify", { state: { email } });
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send OTP");
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCF5EE]">
      <div className="bg-white p-8 rounded shadow w-full max-w-md mt-24">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

        <form onSubmit={handleSendOtp} className="space-y-4">

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Registered Email"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {busy ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
