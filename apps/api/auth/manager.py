from __future__ import annotations
import os
import uuid
import logging
import resend
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from db.base import get_user_db
from db.models import User

logger = logging.getLogger(__name__)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = os.environ.get("JWT_SECRET", "")
    verification_token_secret = os.environ.get("JWT_SECRET", "")

    async def on_after_register(self, user: User, request: Request | None = None):
        logger.info("User %s registered, sending verification email", user.email)
        await self.request_verify(user, request)

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None):
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        verify_url = f"{frontend_url}/verify-email?token={token}"
        resend.api_key = os.environ["RESEND_API_KEY"]
        try:
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": user.email,
                "subject": "Verify your CV Forge account",
                "html": (
                    f"<p>Thanks for signing up for CV Forge!</p>"
                    f"<p>Click <a href='{verify_url}'>here</a> to verify your email address.</p>"
                    f"<p>Or copy this link: {verify_url}</p>"
                ),
            })
        except Exception:
            logger.exception("Failed to send verification email to %s", user.email)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
