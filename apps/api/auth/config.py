from __future__ import annotations
import os
import uuid
from fastapi import Depends
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import AuthenticationBackend, CookieTransport, JWTStrategy
from httpx_oauth.clients.google import GoogleOAuth2
from db.models import User
from auth.manager import get_user_manager

cookie_transport = CookieTransport(
    cookie_name="auth",
    cookie_max_age=604800,
    cookie_httponly=True,
    cookie_secure=False,
    cookie_samesite="lax",
)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=os.environ["JWT_SECRET"], lifetime_seconds=604800)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

google_oauth_client = GoogleOAuth2(
    os.environ.get("GOOGLE_CLIENT_ID", ""),
    os.environ.get("GOOGLE_CLIENT_SECRET", ""),
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_verified_user = fastapi_users.current_user(active=True, verified=True)
