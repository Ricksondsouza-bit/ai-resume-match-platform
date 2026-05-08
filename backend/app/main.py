from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.applications import router as applications_router
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.matches import router as matches_router
from app.api.resumes import router as resumes_router
from app.core.config import settings
from app.core.database import create_database_tables


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Resume Match Platform API",
        version="0.1.0",
        description="FastAPI backend for the AI Resume Match Platform.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/api/v1", tags=["Health"])
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(resumes_router, prefix="/api/v1/resumes", tags=["Resumes"])
    app.include_router(jobs_router, prefix="/api/v1/jobs", tags=["Jobs"])
    app.include_router(matches_router, prefix="/api/v1/matches", tags=["Matches"])
    app.include_router(
        applications_router,
        prefix="/api/v1/applications",
        tags=["Applications"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        if settings.auto_create_tables:
            create_database_tables()

    return app


app = create_app()
