# energy_api/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

# If you previously imported User directly, that's fine too:
# from django.contrib.auth.models import User
# but using settings.AUTH_USER_MODEL is more flexible.

class PredictionHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    building_type = models.CharField(max_length=200)
    total_energy_month_kwh = models.FloatField()
    eui_month_kwh_m2 = models.FloatField(null=True)
    performance_category = models.CharField(max_length=200)
    inputs = models.JSONField()
    is_deleted_by_user = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.building_type}"


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free"),
        ("basic", "Basic"),
        ("super", "Super"),
        ("premium", "Premium"),
    ]

    plan = models.CharField(max_length=30, choices=PLAN_CHOICES, default="free")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription")
    allowed_predictions = models.IntegerField(default=10)
    remaining_predictions = models.IntegerField(default=10)
    active = models.BooleanField(default=False)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def grant_plan(self, plan_name):
        mapping = {
            "basic": 100,
            "super": 300,
            "premium": 500,
        }
        allowed = mapping.get(plan_name.lower(), 10)
        self.plan = plan_name.lower()
        self.allowed_predictions = allowed
        self.remaining_predictions = allowed
        self.active = True
        self.start_date = timezone.now()
        self.end_date = None
        self.save()

    def consume_prediction(self, n=1):
        if self.remaining_predictions is None:
            return
        self.remaining_predictions = max(0, self.remaining_predictions - n)
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.plan} ({self.remaining_predictions}/{self.allowed_predictions})"



class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_otps")
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self, expiry_seconds=300):
        """
        Default expiry: 300 seconds (5 minutes).
        """
        return (timezone.now() - self.created_at).total_seconds() > expiry_seconds

    def __str__(self):
        return f"{self.user.username} - OTP {self.otp} at {self.created_at}"
