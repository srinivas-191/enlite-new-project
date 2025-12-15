// src/pages/AdminUserHistory.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiDelete, API_BASE } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Zap,
  LayoutGrid,
  Thermometer
} from "lucide-react";
import { motion } from "framer-motion";

// --- Utility for formatting decimals ---
const fmt2 = (n) => {
  if (n === null || n === undefined) return "N/A";
  const num = Number(n);
  return isNaN(num) ? "N/A" : num.toFixed(2);
};

// --- Animation Variants ---
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

/* ======================================================
   COMPONENT: Full Prediction Details View
====================================================== */
export function PredictionDetails({ item, onBack }) {
  const { building_type, energy, eui, category, inputs, date } = item;

  let categoryColor = "text-gray-600";
  let categoryMessage = "";
  let categoryIcon = <LayoutGrid size={24} />;

  switch (category) {
    case "Excellent":
      categoryColor = "text-green-600";
      categoryMessage =
        "Excellent performance. No immediate improvements needed.";
      categoryIcon = <Zap size={24} />;
      break;
    case "Good":
      categoryColor = "text-blue-600";
      categoryMessage =
        "Good performance. Minor improvements may help further.";
      categoryIcon = <Zap size={24} />;
      break;
    case "Average":
      categoryColor = "text-yellow-600";
      categoryMessage =
        "Average performance. Consider improving envelope or HVAC.";
      categoryIcon = <Zap size={24} />;
      break;
    case "Poor":
      categoryColor = "text-red-600";
      categoryMessage =
        "Poor performance. Strongly recommended to improve building efficiency.";
      categoryIcon = <Zap size={24} />;
      break;
    default:
      break;
  }

  // Grouped Input Summary
  const groupedInputs = {
    "Building Info": {
      "Building Type": building_type,
      "Predicted On": new Date(date).toLocaleString()
    },
    Envelope: {},
    "HVAC & Internal Loads": {}
  };

  for (const [key, value] of Object.entries(inputs || {})) {
    if (key.includes("Insulation") || key.includes("Wall_Ratio")) {
      groupedInputs["Envelope"][key] = value;
    } else if (
      key.includes("Hvac") ||
      key.includes("Density") ||
      key.includes("Occupancy") ||
      key.includes("Hot_Water")
    ) {
      groupedInputs["HVAC & Internal Loads"][key] = value;
    } else if (key.includes("Area")) {
      groupedInputs["Building Info"]["Total Building Area"] = value;
    }
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-2 font-medium"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* TOP RESULT SUMMARY */}
      <div className="p-8 border border-blue-200 rounded-2xl bg-white shadow-xl">
        <h2 className="text-3xl text-center font-extrabold text-blue-800 mb-6">
          Energy Prediction Summary
        </h2>

        <div className="grid lg:grid-cols-3 gap-6 text-center">
          {/* ENERGY */}
          <div className="p-6 bg-blue-50 rounded-xl shadow hover:scale-[1.02] transition">
            <Zap className="text-blue-500 mx-auto mb-2" size={28} />
            <p className="text-sm text-gray-600 uppercase font-semibold">
              Energy / Month (kWh)
            </p>
            <p className="text-4xl font-black text-blue-700">{fmt2(energy)}</p>
          </div>

          {/* EUI */}
          <div className="p-6 bg-blue-50 rounded-xl shadow hover:scale-[1.02] transition">
            <Thermometer className="text-blue-500 mx-auto mb-2" size={28} />
            <p className="text-sm text-gray-600 uppercase font-semibold">
              EUI / Month (kWh/m²)
            </p>
            <p className="text-4xl font-black text-blue-700">{fmt2(eui)}</p>
          </div>

          {/* CATEGORY */}
          <div
            className={`p-6 rounded-xl shadow hover:scale-[1.02] transition ${categoryColor.replace(
              "text",
              "bg"
            ).replace("-600", "-100")}`}
          >
            <div className={`mb-2 flex justify-center ${categoryColor}`}>
              {categoryIcon}
            </div>
            <p className="text-sm text-gray-600 uppercase font-semibold">
              Performance Category
            </p>
            <p className={`text-3xl font-extrabold ${categoryColor}`}>
              {category}
            </p>
          </div>
        </div>

        <p className={`mt-6 text-center italic text-lg ${categoryColor}`}>
          {categoryMessage}
        </p>
      </div>

      {/* INPUT DETAILS */}
      <div className="p-8 border bg-white rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">
          Detailed Input Summary
        </h2>

        <div className="space-y-6">
          {Object.entries(groupedInputs).map(([section, fields]) => (
            <div
              key={section}
              className="bg-gray-50 p-5 rounded-xl border shadow-inner"
            >
              <h3 className="text-xl font-bold mb-3 text-gray-700 border-b pb-2">
                {section}
              </h3>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(fields).map(([label, value]) => (
                  <p key={label} className="flex justify-between">
                    <span className="font-medium text-gray-600">
                      {label.replace(/_/g, " ")}:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {typeof value === "number" ? fmt2(value) : value}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ======================================================
   MAIN PAGE: Admin User History List + View Details
====================================================== */
export default function AdminUserHistory() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await apiGet(`/admin/user-history/${username}/`);
      setData(res);
    } catch (err) {
      console.error(err);
      alert("Failed to load user history.");
      navigate("/admin-dashboard");
    }
  }

  async function deleteOne(id) {
    if (
      !window.confirm("Permanently delete this prediction record?")
    )
      return;

    try {
      // FIXED ENDPOINT
      await apiDelete(`/admin/user-history/${id}/delete/`);
      load();
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete prediction entry.");
    }
  }

  if (!data)
    return (
      <h1 className="text-center text-blue-600 mt-32 text-2xl font-semibold">
        Loading User History...
      </h1>
    );

  // Detail View
  if (selectedItem) {
    return (
      <div className="max-w-6xl mx-auto mt-16 lg:mt-24 p-8">
        <PredictionDetails
          item={selectedItem}
          onBack={() => {
            setSelectedItem(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-6xl mx-auto mt-16 lg:mt-24 p-8 rounded-2xl shadow-xl">
      <h1 className="text-4xl font-extrabold mb-8">
        History for <span className="text-blue-700">{data.username}</span>
      </h1>

      {data.history.length === 0 ? (
        <div className="text-center p-10 rounded-lg">
          <p className="text-xl text-gray-600">
            No predictions found for this user.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {data.history.map((item, i) => {
            const count = data.history.length - i;

            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                className="border p-5 bg-gray-50 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl hover:bg-blue-50/40 transition"
                onClick={() => {
                  setSelectedItem(item);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-blue-700">
                    {item.building_type}
                  </h2>
                  <div className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full shadow">
                    #{count}
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Predicted: {new Date(item.date).toLocaleDateString()}
                </p>

                <div className="mt-3 space-y-2 text-base">
                  <p className="flex justify-between">
                    <strong className="text-gray-600">Energy:</strong>
                    <span>{fmt2(item.energy)}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-600">EUI:</strong>
                    <span>{fmt2(item.eui)}</span>
                  </p>

                  <p className="flex justify-between">
                    <strong className="text-gray-600">Category:</strong>
                    <span
                      className={`font-extrabold ${
                        item.category === "Poor"
                          ? "text-red-600"
                          : item.category === "Excellent"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {item.category}
                    </span>
                  </p>
                </div>

                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOne(item.id);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200"
                >
                  <Trash2 size={18} /> Delete Entry
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
