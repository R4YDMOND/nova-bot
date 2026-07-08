import requests
import os

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Nova Bot <onboarding@resend.dev>")


def send_verification_email(to_email: str, token: str, base_url: str) -> bool:
    if not RESEND_API_KEY:
        print("[Resend] ОШИБКА: переменная RESEND_API_KEY не задана или пуста")
        return False

    verify_link = f"{base_url}/api/auth/verify?token={token}"
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": "Подтвердите e-mail — Nova Bot",
                "html": f"""
                    <h2>Добро пожаловать в Nova Bot!</h2>
                    <p>Подтвердите e-mail, перейдя по ссылке:</p>
                    <a href="{verify_link}">{verify_link}</a>
                    <p>Ссылка действительна 24 часа.</p>
                """,
            },
            timeout=10,
        )
        if response.status_code != 200:
            print(f"[Resend] Ошибка отправки письма: HTTP {response.status_code} — {response.text}")
            return False
        return True
    except Exception as e:
        print(f"[Resend] Исключение при отправке письма: {e}")
        return False