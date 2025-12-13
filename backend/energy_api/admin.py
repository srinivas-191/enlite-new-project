# energy_api/admin.py
from django.contrib import admin
from .models import Subscription, PredictionHistory


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "active",
        "remaining_predictions",
        "allowed_predictions",
        "start_date",
    )
    search_fields = ("user__username", "plan")


@admin.register(PredictionHistory)
class PredictionHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "building_type", "created_at")
    search_fields = ("user__username", "building_type")
