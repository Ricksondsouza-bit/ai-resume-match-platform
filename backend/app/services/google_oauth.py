from urllib.parse import urlencode

import httpx

from app.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_SCOPES = "openid email profile"


class GoogleOAuthNotConfiguredError(RuntimeError):
    pass


class GoogleOAuthError(RuntimeError):
    pass


def ensure_google_oauth_configured() -> None:
    if not settings.google_client_id or not settings.google_client_secret:
        raise GoogleOAuthNotConfiguredError(
            "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.",
        )


def build_google_authorization_url(role: str) -> str:
    ensure_google_oauth_configured()
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": GOOGLE_SCOPES,
            "access_type": "offline",
            "prompt": "select_account",
            "state": role,
        }
    )
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code_for_userinfo(code: str) -> dict:
    ensure_google_oauth_configured()
    async with httpx.AsyncClient(timeout=15) as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )

        if token_response.status_code >= 400:
            raise GoogleOAuthError("Google token exchange failed.")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise GoogleOAuthError("Google did not return an access token.")

        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_response.status_code >= 400:
            raise GoogleOAuthError("Could not fetch Google profile.")

        userinfo = userinfo_response.json()
        if not userinfo.get("email"):
            raise GoogleOAuthError("Google profile did not include an email address.")

        return userinfo
