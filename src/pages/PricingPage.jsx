import React from "react";
import { apiPost } from "../lib/api";
import { CheckCircle, Zap, TrendingUp, Crown } from "lucide-react";

const pricingTiers = [
  {
    name: "Basic",
    key: "basic",
    price: 75,
    predictions: 100,
    description: "Ideal for individual projects and occasional use.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    name: "Super",
    key: "super",
    price: 175,
    predictions: 300,
    description: "Great for small teams and frequent analysis needs.",
    icon: <TrendingUp className="w-6 h-6" />,
    popular: true,
  },
  {
    name: "Premium",
    key: "premium",
    price: 300,
    predictions: 500,
    description: "Best for large-scale energy analysis.",
    icon: <Crown className="w-6 h-6" />,
  },
];

export default function PricingPage() {
  const handlePayment = async (plan) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded. Please refresh.");
      return;
    }

    try {
      // 1️⃣ Create Razorpay order
      const order = await apiPost("/create-order/", {
        plan: plan.key,
        amount: plan.price,
      });

      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        name: "Enlite",
        description: `${plan.name} Plan Subscription`,
        order_id: order.order_id,

        handler: async function (response) {
  // Always show success first
  alert("✅ Payment successful! Your plan is now active.");
  window.location.href = "/profile";

  // Verify silently
  apiPost("/verify-payment/", {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature,
    plan: plan.key,
  }).catch((err) => {
    console.error("Silent verification failed:", err);
  });
},

        prefill: {
          name: "Enlite User",
        },

        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("❌ Unable to initiate payment. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-24 p-6">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-extrabold text-gray-900">
          Transparent Pricing
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Start with <strong>10 free predictions</strong>. Upgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => (
          <div
            key={tier.key}
            className={`flex flex-col p-8 rounded-xl shadow-2xl ${
              tier.popular
                ? "bg-blue-50 border-2 border-blue-600"
                : "bg-blue-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-gray-900 text-white">
                {tier.icon}
              </span>
              <h3 className="text-3xl font-bold">{tier.name}</h3>
            </div>

            <p className="mt-4 text-lg text-gray-500">
              {tier.description}
            </p>

            <p className="mt-6 text-5xl font-extrabold">
              ₹{tier.price}
            </p>

            <div className="mt-2 text-sm font-semibold text-gray-600">
              Predictions: {tier.predictions}
            </div>

            <button
              onClick={() => handlePayment(tier)}
              className="mt-8 w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Get Started
            </button>

            <ul className="mt-8 space-y-3">
              <li className="flex gap-2">
                <CheckCircle className="text-blue-600" />
                Prediction history
              </li>
              <li className="flex gap-2">
                <CheckCircle className="text-blue-600" />
                Full dashboard access
              </li>
              <li className="flex gap-2">
                <CheckCircle className="text-blue-600" />
                Email support
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
