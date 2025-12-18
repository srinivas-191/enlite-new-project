# energy_api/views.py
import os
import traceback
import random
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count
#from django.core.mail import send_mail
from .utils.emails import send_email
from django.utils import timezone
import razorpay
import hmac
import hashlib

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status

import joblib
import pandas as pd

from .models import (
    PredictionHistory,
    
    Subscription,
    PasswordResetOTP,
)

User = get_user_model()

# -------------------------
# Model files / paths
# -------------------------
MODEL_DIR = os.path.join(settings.BASE_DIR, "energy_api", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
LE_PATH = os.path.join(MODEL_DIR, "model1.pkl")
SC_PATH = os.path.join(MODEL_DIR, "model2.pkl")

_loaded = {"model": None, "le": None, "sc": None, "features": None}

FEATURE_RANGES = {
    "Floor_Insulation": (0.15, 1.60),
    "Door_Insulation": (0.81, 5.70),
    "Roof_Insulation": (0.07, 2.28),
    "Window_Insulation": (0.73, 5.75),
    "Wall_Insulation": (0.10, 2.40),
    "Hvac_Efficiency": (0.30, 4.50),
    "Domestic_Hot_Water_Usage": (0.50, 3.50),
    "Lighting_Density": (1, 9),
    "Occupancy_Level": (1, 6),
    "Equipment_Density": (1, 21),
    "Window_To_Wall_Ratio": (0, 70),
    "Total_Building_Area": (85.91, 10000),
}

DEFAULT_VALUES = {
    "Floor_Insulation": 0.20,
            "Door_Insulation": 1.00,
            "Roof_Insulation": 0.15,
            "Window_Insulation": 1.20,
            "Wall_Insulation": 0.25,
            "Hvac_Efficiency": 3.5,
            "Domestic_Hot_Water_Usage": 1.50,
            "Lighting_Density": 3,
            "Occupancy_Level": 3,
            "Equipment_Density": 8,
            "Window_To_Wall_Ratio": 30,
            "Total_Building_Area": 85.91
}

# -------------------------
# Helpers: load model & metadata
# -------------------------
def load_all():
    """Loads model, label encoder and scaler once and caches them."""
    if _loaded["model"] is None:
        _loaded["model"] = joblib.load(MODEL_PATH)
    if _loaded["le"] is None:
        _loaded["le"] = joblib.load(LE_PATH)
    if _loaded["sc"] is None:
        _loaded["sc"] = joblib.load(SC_PATH)
    if _loaded["features"] is None:
        sc = _loaded["sc"]
        if hasattr(sc, "feature_names_in_"):
            _loaded["features"] = list(sc.feature_names_in_)
        else:
            _loaded["features"] = [
                "Building_Type",
                "Floor_Insulation",
                "Door_Insulation",
                "Roof_Insulation",
                "Window_Insulation",
                "Wall_Insulation",
                "Hvac_Efficiency",
                "Domestic_Hot_Water_Usage",
                "Lighting_Density",
                "Occupancy_Level",
                "Equipment_Density",
                "Window_To_Wall_Ratio",
                "Total_Building_Area",
            ]
    return _loaded["model"], _loaded["le"], _loaded["sc"], _loaded["features"]


# -------------------------
# EUI Category (Option A — Script scale)
# -------------------------
def monthly_category(eui):
    if eui is None:
        return "Unknown"
    if eui <= 12.50:
        return "Very Efficient"
    if eui <= 20.83:
        return "Average Efficiency"
    if eui <= 29.17:
        return "Moderately High"
    if eui <= 41.67:
        return "High Energy Consumption"
    return "Very Poor (Inefficient)"


# -------------------------
# Recommendation generator
# -------------------------
def get_recommendations(user_vals):
    issues = []
    recommendations = []

    # Optimal reference values (your standard)
    optimal = {
        "Floor_Insulation": 0.20,
        "Door_Insulation": 1.00,
        "Roof_Insulation": 0.15,
        "Window_Insulation": 1.20,
        "Wall_Insulation": 0.25,
        "Hvac_Efficiency": 3.5,
        "Domestic_Hot_Water_Usage": 1.50,
        "Lighting_Density": 3,
        "Occupancy_Level": 3,
        "Equipment_Density": 8,
        "Window_To_Wall_Ratio": 30
    }

    # Material suggestions for insulation
    insulation_materials = {
        "Floor_Insulation": "rigid PIR/XPS boards, mineral wool, or spray foam",
        "Door_Insulation": "thermally insulated doors with good sealing",
        "Roof_Insulation": "PIR boards, rockwool, cellulose, or spray foam",
        "Window_Insulation": "double-glazed low-E glass with argon filling",
        "Wall_Insulation": "mineral wool, EPS/XPS boards, or external insulated cladding"
    }

    for feature, opt in optimal.items():
        try:
            val = float(user_vals.get(feature, 0))
        except Exception:
            val = 0.0

        # ------------------- INSULATION (Detailed) -------------------
        if feature in [
            "Floor_Insulation", "Door_Insulation", "Roof_Insulation",
            "Window_Insulation", "Wall_Insulation"
        ]:
            if val > opt * 1.5:
                issues.append(f"{feature.replace('_', ' ')} is too high (poor insulation).")
                recommendations.append(
                    f"Improve the {feature.replace('_',' ').lower()} (target: {opt}). "
                    f"Use: {insulation_materials[feature]}."
                )

        # ------------------- HVAC -------------------
        elif feature == "Hvac_Efficiency":
            if val < opt:
                issues.append("Low HVAC efficiency.")
                recommendations.append(
                    f"Upgrade HVAC to COP {opt} or higher for improved performance."
                )

        # ------------------- Hot Water -------------------
        elif feature == "Domestic_Hot_Water_Usage":
            if val > opt * 1.3:
                issues.append("High domestic hot water usage.")
                recommendations.append(
                    f"Use low-flow taps/showers or install a solar water heater (recommended target: {opt})."
                )

        # ------------------- Lighting -------------------
        elif feature == "Lighting_Density":
            if val > opt * 1.4:
                issues.append("Lighting density is high.")
                recommendations.append(
                    f"Switch to LED lights or reduce lighting levels (target: {opt} W/m²)."
                )

        # ------------------- Occupancy -------------------
        elif feature == "Occupancy_Level":
            if val > opt * 1.5:
                issues.append("High occupancy load.")
                recommendations.append(
                    f"Avoid overcrowding and spread activities throughout the day (ideal level: {opt})."
                )

        # ------------------- Equipment -------------------
        elif feature == "Equipment_Density":
            if val > opt * 1.4:
                issues.append("High equipment density.")
                recommendations.append(
                    f"Use energy-efficient appliances (recommended load: {opt} W/m²)."
                )

        # ------------------- WWR -------------------
        elif feature == "Window_To_Wall_Ratio":
            if val > 50:
                issues.append("High window-to-wall ratio.")
                recommendations.append(
                    f"Use external shading or better glazing to reduce heat gain (target: {opt}%)."
                )

    return issues, recommendations


# -------------------------
# Optimized performance calculator
# -------------------------
def compute_optimized_performance(user_vals, model, sc):
    optimal_targets = {
        "Floor_Insulation": 0.20,
        "Door_Insulation": 1.00,
        "Roof_Insulation": 0.15,
        "Window_Insulation": 1.20,
        "Wall_Insulation": 0.25,
        "Hvac_Efficiency": 3.5,
        "Domestic_Hot_Water_Usage": 1.50,
        "Lighting_Density": 3,
        "Occupancy_Level": 3,
        "Equipment_Density": 8,
        "Window_To_Wall_Ratio": 30
    }

    optimized_vals = user_vals.copy()

    # Apply optimal values
    for feature, val in optimal_targets.items():
        optimized_vals[feature] = val

    # ❗ Remove helper keys NOT used during model training
    optimized_vals = {k: v for k, v in optimized_vals.items() if not k.startswith("__")}

    # Convert to DataFrame
    df_opt = pd.DataFrame([optimized_vals])

    # Scale + Predict
    scaled_opt = sc.transform(df_opt)
    yearly_opt = float(model.predict(scaled_opt)[0])
    monthly_opt = yearly_opt / 12.0

    area = float(user_vals.get("Total_Building_Area") or 0)
    optimized_eui = monthly_opt / area if area else None

    current_monthly = user_vals.get("__current_monthly_energy__", None)

    if current_monthly:
        saved_kwh = current_monthly - monthly_opt
        saved_percent = (saved_kwh / current_monthly) * 100 if current_monthly > 0 else 0
    else:
        saved_kwh = None
        saved_percent = None

    return {
        "optimized_energy_month_kwh": round(monthly_opt, 2),
        "energy_savings_kwh": round(saved_kwh, 2) if saved_kwh is not None else None,
        "energy_savings_percent": round(saved_percent, 2) if saved_percent is not None else None,
        "optimized_eui_kwh_m2": round(optimized_eui, 2) if optimized_eui else None,
        "optimized_category": monthly_category(optimized_eui)
    }


# -------------------------
# AUTH: register / login
# -------------------------
@api_view(["POST"])
def register_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email")

    if not username or not password or not email:
        return Response({"error": "username, email and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "User already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    token, _ = Token.objects.get_or_create(user=user)

    Subscription.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "allowed_predictions": 10, "remaining_predictions": 10, "active": False},
    )

    try:
        send_email(
            subject="Welcome — Your account has been created",
            message=(
                f"Hello {username}, Welcome to Enlite! Your account has been successfully created.\n\n"
                f"your account has been created\n\n"
                f"Thank you for choosing us as your partner in building intelligence. With Enlite, you can now leverage advanced analytics to predict building measurements and gain deep insights into energy consumption patterns.\n"
                f"Our platform is designed not only to track your current usage but to provide actionable paths for future efficiency improvements.\n"
                f"We are excited to help you start your journey toward smarter energy management. Best regards,\n\n"
                f"Rajoli Srinivas - The Enlite Team"
            ),
            to_email=email
        )

    except:
        pass

    return Response({
        "message": "User registered successfully",
        "token": token.key,
        "username": user.username,
        "is_admin": user.is_staff
    })


@api_view(["POST"])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "username and password required"}, status=400)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=400)

    token, _ = Token.objects.get_or_create(user=user)

    Subscription.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "allowed_predictions": 10, "remaining_predictions": 10, "active": False},
    )

    return Response({
        "message": "Login successful",
        "token": token.key,
        "username": user.username,
        "is_admin": user.is_staff
    })


# -------------------------
# FORGOT PASSWORD (OTP Flow)
# -------------------------
@api_view(["POST"])
def forgot_password_request(request):
    username = request.data.get("username")
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email required"}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Email not found"}, status=404)

    otp = str(random.randint(100000, 999999))
    PasswordResetOTP.objects.create(user=user, otp=otp)

    try:
        send_email(
            subject="Your Password Reset OTP",
            message=(
                f"Hello {username}, We received a request to reset the password for your Enlite account. To proceed, please use the verification code provided below:\n\n"
                f"------------------------\n"
                f"    OTP CODE: {otp}      \n"
                f"------------------------\n\n"
                f"This code is required to verify your identity and ensure your account remains secure. Please enter this code on the reset page within the application.\n"
                f"Security Note: This code is valid for a limited time. If you did not request a password reset, please ignore this email or contact our support team immediately.\n"
                f"Best regards,\n\n"
                f"The Enlite Team"
            ),
            to_email=email
        )
    except Exception as e:
        print("❌ OTP EMAIL FAILED:", repr(e))
        raise e   # ⬅️ VERY IMPORTANT

    except:
        return Response({"error": "Failed to send OTP"}, status=500)

    return Response({"message": "OTP sent"})


@api_view(["POST"])
def verify_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")

    if not email or not otp:
        return Response({"error": "email and otp required"}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Invalid email"}, status=404)

    record = PasswordResetOTP.objects.filter(user=user, otp=otp).order_by("-created_at").first()
    if not record or record.is_expired():
        return Response({"error": "Invalid or expired OTP"}, status=400)

    return Response({"message": "OTP verified"})


@api_view(["POST"])
def reset_password(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    new_password = request.data.get("new_password")

    if not email or not otp or not new_password:
        return Response({"error": "email, otp and new_password required"}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Invalid email"}, status=404)

    record = PasswordResetOTP.objects.filter(user=user, otp=otp).order_by("-created_at").first()
    if not record or record.is_expired():
        return Response({"error": "Invalid or expired OTP"}, status=400)

    user.set_password(new_password)
    user.save()

    PasswordResetOTP.objects.filter(user=user).delete()

    return Response({"message": "Password reset successful"})


# -------------------------
# BASIC: building types / defaults
# -------------------------
@api_view(["GET"])
def get_building_types(request):
    _, le, _, _ = load_all()
    try:
        classes = [bt.title() for bt in le.classes_]
    except:
        classes = []
    return Response({"building_types": classes})


@api_view(["GET"])
def get_defaults(request):
    _, _, _, features = load_all()
    return Response({
        "features": features,
        "feature_ranges": FEATURE_RANGES,
        "defaults": DEFAULT_VALUES
    })


# -------------------------
# PREDICT WITH RECOMMENDATIONS + OPTIMIZED PERFORMANCE
# -------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_energy(request):
    user = request.user

    sub, _ = Subscription.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "allowed_predictions": 10, "remaining_predictions": 10, "active": False},
    )

    if sub.remaining_predictions is not None and sub.remaining_predictions <= 0:
        return Response({"error": "TRIAL_EXPIRED"}, status=403)

    try:
        model, le, sc, features = load_all()
    except Exception as e:
        return Response({"error": "Model loading failed", "details": str(e)}, status=500)

    try:
        data = request.data
        row = []

        for feat in features:
            if feat == "Building_Type":
                val = data.get("Building_Type")
                if not val:
                    return Response({"error": "Missing Building_Type"}, status=400)
                try:
                    encoded = int(le.transform([val.lower()])[0])
                except:
                    try:
                        encoded = int(le.transform([val])[0])
                    except:
                        return Response({"error": f"Invalid Building_Type: {val}"}, status=400)
                row.append(encoded)
            else:
                if feat not in data:
                    return Response({"error": f"Missing feature: {feat}"}, status=400)
                row.append(float(data[feat]))

        df = pd.DataFrame([row], columns=features)
        scaled = sc.transform(df)

        yearly = float(model.predict(scaled)[0])
        monthly = yearly / 12.0
        area = float(data.get("Total_Building_Area") or 0)
        eui = monthly / area if area else None

        user_vals = df.iloc[0].to_dict()
        user_vals["__current_monthly_energy__"] = monthly

        issues, recs = get_recommendations(user_vals)
        impacting = issues if issues else ["No major issues detected."]

        already_optimized = is_already_optimized(user_vals)

        optimized = None
        if not already_optimized:
            optimized = compute_optimized_performance(user_vals, model, sc)

        record = PredictionHistory.objects.create(
            user=user,
            building_type=data.get("Building_Type"),
            total_energy_month_kwh=round(monthly, 2),
            eui_month_kwh_m2=round(eui, 2) if eui else None,
            performance_category=monthly_category(eui),
            inputs=data,
        )
    
        if not user.is_staff:
            sub.remaining_predictions -= 1
            sub.save()

        return Response({
            "record_id": record.id,
            "total_energy_month_kwh": record.total_energy_month_kwh,
            "eui_month_kwh_m2": record.eui_month_kwh_m2,
            "performance_category": record.performance_category,
            "impacting_factors": impacting,
            "recommendations": recs,

            # -------- NEW OPTIMIZED PERFORMANCE --------
            "optimized_energy_month_kwh": optimized["optimized_energy_month_kwh"] if optimized else None,
"energy_savings_kwh": optimized["energy_savings_kwh"] if optimized else None,
"energy_savings_percent": optimized["energy_savings_percent"] if optimized else None,
"optimized_eui_kwh_m2": optimized["optimized_eui_kwh_m2"] if optimized else None,
"optimized_category": optimized["optimized_category"] if optimized else None,

        })

    except Exception as e:
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=500)


# -------------------------
# HISTORY endpoints
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_history(request):
    history = PredictionHistory.objects.filter(user=request.user, is_deleted_by_user=False).order_by("-created_at")
    data = [{
        "id": h.id,
        "building_type": h.building_type,
        "energy": h.total_energy_month_kwh,
        "eui": h.eui_month_kwh_m2,
        "category": h.performance_category,
        "inputs": h.inputs,
        "date": h.created_at,
    } for h in history]
    return Response({"history": data})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_all_history(request):
    count = PredictionHistory.objects.filter(user=request.user).update(is_deleted_by_user=True)
    return Response({"message": f"Hidden {count} items from your history"})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_history_item(request, pk):
    item = get_object_or_404(PredictionHistory, pk=pk)
    if item.user != request.user and not request.user.is_staff:
        return Response({"error": "Not allowed"}, status=403)
    item.is_deleted_by_user = True
    item.save()
    return Response({"message": "Deleted successfully"})


# -------------------------
# PROFILE
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user

    total_predictions = PredictionHistory.objects.filter(user=user).count()
    last = PredictionHistory.objects.filter(user=user).order_by("-created_at").first()

    last_data = None
    if last:
        last_data = {
            "id": last.id,
            "building_type": last.building_type,
            "energy": last.total_energy_month_kwh,
            "eui": last.eui_month_kwh_m2,
            "category": last.performance_category,
            "inputs": last.inputs,
            "date": last.created_at,
        }

    try:
        sub = Subscription.objects.get(user=user)
        subscription_data = {
            "plan": sub.plan,
            "allowed_predictions": sub.allowed_predictions,
            "remaining_predictions": sub.remaining_predictions,
            "active": sub.active,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
        }
    except:
        subscription_data = None

    return Response({
    "username": user.username,
    "email": user.email,          # ✅ ADD THIS LINE
    "is_admin": user.is_staff,
    "joined_on": user.date_joined,
    "total_predictions": total_predictions,
    "last_prediction": last_data,
    "subscription": subscription_data
})



# -------------------------
# Update user account
# -------------------------
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_user(request):
    user = request.user
    data = request.data
    changes = {}

    new_username = data.get("username")
    if new_username and new_username != user.username:
        if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
            return Response({"error": "Username already taken"}, status=400)
        user.username = new_username
        changes["username"] = new_username

    current_password = data.get("password")
    new_password = data.get("new_password")

    if new_password:
        if not current_password:
            return Response({"error": "Current password required"}, status=400)
        if not user.check_password(current_password):
            return Response({"error": "Current password incorrect"}, status=400)
        user.set_password(new_password)
        changes["password_changed"] = True

    if changes:
        user.save()
        return Response({"message": "Updated successfully", "changes": changes})

    return Response({"message": "No changes"})




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_subscription(request):
    try:
        sub = Subscription.objects.get(user=request.user)
    except Subscription.DoesNotExist:
        sub = Subscription.objects.create(
            user=request.user,
            plan="free",
            allowed_predictions=10,
            remaining_predictions=10,
            active=False
        )

    return Response({
        "subscription": {
            "plan": sub.plan,
            "allowed_predictions": sub.allowed_predictions,
            "remaining_predictions": sub.remaining_predictions,
            "active": sub.active,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
        }
    })


# -------------------------
# ADMIN endpoints
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=403)

    users = User.objects.annotate(
        prediction_count=Count("predictionhistory")
    ).order_by("-date_joined")

    data = []
    for u in users:
        try:
            sub = Subscription.objects.get(user=u)
            plan = sub.plan.upper()
            active = sub.active
        except Subscription.DoesNotExist:
            plan = "FREE"
            active = False

        data.append({
            "username": u.username,
            "joined_on": u.date_joined,
            "is_admin": u.is_staff,
            "prediction_count": u.prediction_count,
            "plan": plan,
            "active": active,
        })

    return Response({"users": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_user_history(request, username):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=403)

    user = get_object_or_404(User, username=username)
    history = PredictionHistory.objects.filter(user=user).order_by("-created_at")

    data = [{
        "id": h.id,
        "building_type": h.building_type,
        "energy": h.total_energy_month_kwh,
        "eui": h.eui_month_kwh_m2,
        "category": h.performance_category,
        "inputs": h.inputs,
        "date": h.created_at,
    } for h in history]

    return Response({"username": user.username, "history": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_all_history(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=403)

    records = PredictionHistory.objects.all().order_by("-created_at")

    data = [{
        "id": h.id,
        "user": h.user.username,
        "building_type": h.building_type,
        "energy": h.total_energy_month_kwh,
        "eui": h.eui_month_kwh_m2,
        "category": h.performance_category,
        "inputs": h.inputs,
        "date": h.created_at,
    } for h in records]

    return Response({"all_history": data})








# -------------------------
# Plans (static)
# -------------------------
@api_view(["GET"])
def get_plans(request):
    return Response({
        "plans": {
            "basic": {"price": 75, "predictions": 100},
            "super": {"price": 175, "predictions": 300},
            "premium": {"price": 300, "predictions": 500},
        }
    })


# -------------------------
# Lookup username by email
# -------------------------
@api_view(["POST"])
def get_username_by_email(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "email required"}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Not found"}, status=404)

    return Response({"username": user.username})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    plan = request.data.get("plan")
    amount = request.data.get("amount")  # frontend will send price in rupees

    if not plan or not amount:
        return Response({"error": "plan and amount required"}, status=400)

    try:
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        order_data = {
            "amount": int(float(amount) * 100),   # convert to paise
            "currency": "INR",
            "payment_capture": 1
        }

        order = client.order.create(order_data)

        return Response({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": settings.RAZORPAY_KEY_ID,
            "plan": plan
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_razorpay_payment(request):
    razorpay_order_id = request.data.get("razorpay_order_id")
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_signature = request.data.get("razorpay_signature")
    plan = request.data.get("plan")

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, plan]):
        return Response({"error": "Missing payment fields"}, status=400)

    # 🔐 Verify Razorpay signature (OFFICIAL METHOD)
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != razorpay_signature:
        return Response({"error": "Payment verification failed"}, status=400)

    # ✅ Activate subscription
    sub, _ = Subscription.objects.get_or_create(user=request.user)
    sub.grant_plan(plan)

    PLAN_PRICES = {
        "basic": 75,
        "super": 175,
        "premium": 300,
    }

    amount_paid = PLAN_PRICES.get(plan.lower(), 0)

    # 📧 Email (non-blocking)
    try:
        send_email(
            subject="✅ Your Enlite Subscription is Active",
            message=(
                f"Hello {request.user.username},\n\n"
                f"Your payment was successful.\n\n"
                f"Plan: {sub.plan.upper()}\n"
                f"Amount Paid: ₹{amount_paid}\n"
                f"Predictions Allowed: {sub.allowed_predictions}\n\n"
                f"Thank you for choosing Enlite!"
            ),
            to_email=request.user.email
        )
    except Exception as e:
        print("Email failed:", e)

    return Response({
        "message": "Payment verified and plan activated",
        "plan": sub.plan,
        "remaining_predictions": sub.remaining_predictions,
    })

def is_already_optimized(user_vals):
    optimal = {
        "Floor_Insulation": 0.20,
        "Door_Insulation": 1.00,
        "Roof_Insulation": 0.15,
        "Window_Insulation": 1.20,
        "Wall_Insulation": 0.25,
        "Hvac_Efficiency": 3.5,
        "Domestic_Hot_Water_Usage": 1.50,
        "Lighting_Density": 3,
        "Occupancy_Level": 3,
        "Equipment_Density": 8,
        "Window_To_Wall_Ratio": 30
    }

    for k, opt in optimal.items():
        try:
            if abs(float(user_vals.get(k, 0)) - opt) > 0.01:
                return False
        except:
            return False
    return True
