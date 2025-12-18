# energy_api/urls.py
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from .views import (
    get_building_types,
    get_defaults,
    predict_energy,

    register_user,
    login_user,
    get_username_by_email,

    forgot_password_request,
    verify_otp,
    reset_password,

    get_profile,
    update_user,
    get_username_by_email,

    get_my_history,
    delete_all_history,
    delete_history_item,

    admin_all_history,
    admin_list_users,
    admin_user_history,

    my_subscription,
    get_plans,

    create_razorpay_order,
    verify_razorpay_payment,
)

urlpatterns = [
    # Core
    path("building-types/", get_building_types),
    path("defaults/", get_defaults),
    path("predict/", predict_energy),

    # Auth
    path("register/", register_user),
    path("login/", login_user),
    path("get-username-by-email/", get_username_by_email),

    # Password reset
    path("forgot-password/request/", forgot_password_request),
    path("forgot-password/verify/", verify_otp),
    path("forgot-password/reset/", reset_password),

    # Profile
    path("profile/", get_profile),
    path("user/update/", update_user),

    # History
    path("history/", get_my_history),
    path("history/delete-all/", delete_all_history),
    path("history/delete/<int:pk>/", delete_history_item),

    # Subscription
    path("subscription/", my_subscription),

    # Razorpay
    path("create-order/", create_razorpay_order),
    path("verify-payment/", verify_razorpay_payment),

    # Admin
    path("admin/users/", admin_list_users),
    path("admin/user-history/<str:username>/", admin_user_history),
    path("admin/history/", admin_all_history),

    # Plans
    path("plans/", get_plans),
]
