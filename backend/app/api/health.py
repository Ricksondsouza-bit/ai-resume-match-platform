from fastapi import APIRouter

from app.core.database import check_database_connection

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ai-resume-match-backend",
        "version": "0.1.0",
    }


@router.get("/health/db")
def database_health_check() -> dict[str, str]:
    is_connected = check_database_connection()

    return {
        "status": "ok" if is_connected else "error",
        "database": "connected" if is_connected else "unavailable",
    }

