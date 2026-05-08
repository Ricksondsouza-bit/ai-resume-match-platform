from secrets import token_urlsafe
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserRead
from app.services.google_oauth import (
    GoogleOAuthError,
    GoogleOAuthNotConfiguredError,
    build_google_authorization_url,
    exchange_code_for_userinfo,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=access_token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=access_token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/google/login")
def google_login(
    role: UserRole = Query(default=UserRole.candidate),
) -> RedirectResponse:
    try:
        return RedirectResponse(build_google_authorization_url(role.value))
    except GoogleOAuthNotConfiguredError as exc:
        query = urlencode({"error": str(exc)})
        return RedirectResponse(f"{settings.web_url}/auth/google/callback?{query}")


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: UserRole = Query(default=UserRole.candidate),
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if error:
        query = urlencode({"error": error})
        return RedirectResponse(f"{settings.web_url}/auth/google/callback?{query}")

    if not code:
        query = urlencode({"error": "Missing Google authorization code."})
        return RedirectResponse(f"{settings.web_url}/auth/google/callback?{query}")

    try:
        google_user = await exchange_code_for_userinfo(code)
    except (GoogleOAuthError, GoogleOAuthNotConfiguredError) as exc:
        query = urlencode({"error": str(exc)})
        return RedirectResponse(f"{settings.web_url}/auth/google/callback?{query}")

    email = google_user["email"].lower()
    full_name = google_user.get("name") or email.split("@")[0]

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(token_urlsafe(32)),
            role=state,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id, user.role.value)
    query = urlencode({"access_token": access_token})
    return RedirectResponse(f"{settings.web_url}/auth/google/callback?{query}")
