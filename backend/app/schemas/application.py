from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    job_id: UUID
    resume_id: UUID | None = None
    cover_note: str | None = Field(default=None, max_length=4000)


class ApplicationRead(BaseModel):
    id: UUID
    candidate_user_id: UUID
    job_id: UUID
    resume_id: UUID | None
    status: ApplicationStatus
    cover_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

