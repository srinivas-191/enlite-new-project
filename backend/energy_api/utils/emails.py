# energy_api/utils/email.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.conf import settings


def send_email(subject, message, to_email):
    try:
        email = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=message,
        )

        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        response = sg.send(email)

        if response.status_code not in [200, 202]:
            raise Exception(f"SendGrid failed: {response.body}")

    except Exception as e:
        raise Exception(f"Email failed: {str(e)}")