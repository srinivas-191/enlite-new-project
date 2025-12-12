// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function ProfilePage() {
 const [profile, setProfile] = useState(null);
 const [subscription, setSubscription] = useState(null);
 const [history, setHistory] = useState([]);

 useEffect(() => {
  load();
 }, []);

 async function load() {
  try {
   const p = await apiGet("/profile/");
   const h = await apiGet("/history/");
   const sub = await apiGet("/subscription/"); // ✅ FIXED ROUTE

   setProfile(p);
   setHistory(h.history.slice(0, 5));
   setSubscription(sub.subscription);

   // Save subscription for global use
   localStorage.setItem("subscription", JSON.stringify(sub.subscription));
  } catch (err) {
   console.error(err);
   alert("Failed to load profile");
  }
 }

 if (!profile) return <h1 className="mt-28 text-center">Loading...</h1>;

 return (
  <div className="max-w-6xl mx-auto mt-24 p-6"> {/* Increased width and top margin */}
   <h1 className="text-4xl font-extrabold mb-8 text-blue-700">User Profile Dashboard</h1>

   <div className="grid md:grid-cols-3 gap-8">
    {/* 1. PROFILE INFO CARD */}
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 md:col-span-1">
     <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Account Details</h2>
     <div className="mt-14">
      <p className="text-lg">
       <strong className="text-gray-600">Username:</strong> <span className="text-blue-600 font-semibold">{profile.username}</span>
      </p>
      <p>
       <strong className="text-gray-600">Role:</strong> 
       <span className={`font-medium ${profile.is_admin ? "text-red-500" : "text-green-500"}`}>
        {profile.is_admin ? "Admin" : "User"}
       </span>
      </p>
      <p>
       <strong className="text-gray-600">Joined:</strong> {new Date(profile.joined_on).toLocaleString()}
      </p>
      <p>
       <strong className="text-gray-600">Total Predictions:</strong> 
       <span className="text-2xl font-bold text-blue-800 ml-1">{profile.total_predictions}</span>
      </p>
     </div>
    </div>

    {/* 2. SUBSCRIPTION CARD (Takes 2 columns on medium screens and up) */}
    {subscription && (
     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 md:col-span-2">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Subscription Management</h2>
      <div className="grid sm:grid-cols-2 gap-4">
       {/* Plan */}
       <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm uppercase text-gray-500 font-medium">Plan</p>
        <p className="text-3xl font-extrabold text-blue-700">{subscription.plan.toUpperCase()}</p>
       </div>
       {/* Status */}
       <div className="p-3 bg-green-50 rounded-lg">
        <p className="text-sm uppercase text-gray-500 font-medium">Status</p>
        <p className={`text-3xl font-extrabold ${subscription.active ? "text-green-700" : "text-red-700"}`}>
         {subscription.active ? "Active" : "Inactive"}
        </p>
       </div>
       {/* Remaining Predictions */}
       <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm uppercase text-gray-500 font-medium">Remaining Predictions</p>
        <p className="text-2xl font-bold text-gray-700">{subscription.remaining_predictions}</p>
       </div>
       {/* Allowed Predictions */}
       <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm uppercase text-gray-500 font-medium">Allowed Predictions</p>
        <p className="text-2xl font-bold text-gray-700">{subscription.allowed_predictions}</p>
       </div>
      </div>
     </div>
    )}
   </div>


   {/* 3. LAST PREDICTION CARD (Full width below the grid) */}
   <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Last Prediction Overview</h2>
    {profile.last_prediction ? (
     <div className="grid md:grid-cols-4 gap-4 text-center">
      {/* Building Type */}
      <div className="p-4 bg-yellow-50 rounded-lg">
       <p className="text-sm uppercase text-gray-500">Building Type</p>
       <p className="text-xl font-bold text-yellow-700">{profile.last_prediction.building_type}</p>
      </div>
      {/* Energy */}
      <div className="p-4 bg-yellow-50 rounded-lg">
       <p className="text-sm uppercase text-gray-500">Energy (kWh/month)</p>
       <p className="text-xl font-bold text-yellow-700">{profile.last_prediction.energy}</p>
      </div>
      {/* EUI */}
      <div className="p-4 bg-yellow-50 rounded-lg">
       <p className="text-sm uppercase text-gray-500">EUI</p>
       <p className="text-xl font-bold text-yellow-700">{profile.last_prediction.eui}</p>
      </div>
      {/* Date */}
      <div className="p-4 bg-yellow-50 rounded-lg">
       <p className="text-sm uppercase text-gray-500">Predicted On</p>
       <p className="text-lg font-bold text-yellow-700">{new Date(profile.last_prediction.date).toLocaleDateString()}</p>
      </div>
     </div>
    ) : (
     <p className="text-gray-500">No predictions yet.</p>
    )}
   </div>
  </div>
 );
}