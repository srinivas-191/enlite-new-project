// src/pages/OtpVerifyPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export default function OtpVerifyPage() {
  const loc = useLocation();
  const navigate = useNavigate();

  const initialEmail = loc.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await apiPost("/forgot-password/verify/", { email, otp });

      if (res?.error) {
        alert(res.error);
      } else {
        alert(res.message || "OTP verified");
        navigate("/forgot-password/reset", {
          state: { email, otp },
        });
      }
    } catch (err) {
      alert(err?.response?.data?.error || "OTP verification failed");
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCF5EE]">
      <div className="bg-white p-8 rounded shadow w-full max-w-md mt-24">

        <h2 className="text-2xl font-bold mb-6 text-center">Enter OTP</h2>

        <form onSubmit={handleVerify} className="space-y-4">

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

          <button
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {busy ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
