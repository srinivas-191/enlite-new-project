from django.test import TestCase

# Create your tests here.
from django.core.mail import send_mail

send_mail(
    "Railway Email Test",
    "If you receive this, SMTP works 🎉",
    "k68029345@gmail.com",
    ["your_personal_email@gmail.com"],
    fail_silently=False,
)
