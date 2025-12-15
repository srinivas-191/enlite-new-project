// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Tally4,
  Eye,
  Settings,
  Mail,
  User,
} from "lucide-react";

/* ---------------- ANIMATIONS ---------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const userCardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

/* ---------------- METRIC CARD ---------------- */

function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <motion.div className={`p-6 bg-white rounded-xl shadow-lg border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-500 uppercase">{title}</p>
        <Icon className="w-6 h-6 text-gray-500" />
      </div>
      <p className="text-4xl font-extrabold text-gray-800 mt-2">{value}</p>
    </motion.div>
  );
}

const PLAN_LIMITS = {
  FREE: 10,
  BASIC: 100,
  SUPER: 300,
  PREMIUM: 500,
};

/* ---------------- ROLE / PLAN BADGE ---------------- */

function RoleBadge({ isAdmin, plan, predictionCount }) {
  if (isAdmin) {
    return (
      <span className="ml-2 px-2 py-1 text-xs font-bold rounded bg-red-600 text-white">
        ADMIN
      </span>
    );
  }

  const PLAN = (plan || "FREE").toUpperCase();
  const limit = PLAN_LIMITS[PLAN] ?? 0;
  const expired = predictionCount >= limit;

  const colors = {
    FREE: "bg-gray-300 text-gray-800",
    BASIC: "bg-blue-200 text-blue-900",
    SUPER: "bg-green-200 text-green-900",
    PREMIUM: "bg-yellow-300 text-yellow-900",
  };

  return (
    <span
      className={`ml-2 px-2 py-1 text-xs font-bold rounded ${
        colors[PLAN] || colors.FREE
      }`}
    >
      {PLAN}
      {expired && (
        <span className="ml-1 text-red-600">(expired)</span>
      )}
    </span>
  );
}


/* ---------------- MAIN COMPONENT ---------------- */

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const totalUsers = users.length;
  const totalPredictions = users.reduce(
    (acc, u) => acc + (u.prediction_count || 0),
    0
  );

  async function load() {
    setLoading(true);
    try {
      // Admin profile
      const profile = await apiGet("/profile/");
      setAdmin(profile);

      // Users list
      const res = await apiGet("/admin/users/");
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto mt-16 lg:mt-24 p-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-blue-900 flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          Admin Dashboard
        </h1>

        {admin && (
          <div className="mt-3 flex flex-wrap gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <User size={18} />
              <span className="font-semibold">{admin.username}</span>
              <span className="px-2 py-1 text-xs font-bold rounded bg-red-600 text-white">
                ADMIN
              </span>
            </div>

            {admin.email && (
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>{admin.email}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- METRICS ---------------- */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="border-blue-500"
        />
        <MetricCard
          title="Total Predictions"
          value={totalPredictions}
          icon={Tally4}
          color="border-green-500"
        />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-gray-700">
        User Management
      </h2>

      {/* ---------------- USERS GRID ---------------- */}
      {loading ? (
        <p className="text-center text-gray-500">Loading users...</p>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {users.map((u) => (
            <motion.div
              key={u.username}
              className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-400"
              variants={userCardVariants}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center flex-wrap">
                {u.username}
                <RoleBadge
                  isAdmin={u.is_admin}
                  plan={u.plan}
                  active={u.active}
                />
              </h3>

              <p className="text-sm text-gray-600 mb-2">
                Predictions:{" "}
                <span className="font-bold">{u.prediction_count || 0}</span>
              </p>

              <p className="text-sm text-gray-600 mb-4">
                Joined: {new Date(u.joined_on).toLocaleDateString()}
              </p>

              <button
                onClick={() => navigate(`/admin/user-history/${u.username}`)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Eye size={18} />
                View History
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
