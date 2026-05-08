from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.models.resume import ResumeStatus


class ResumeRead(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    content_type: str
    file_size_bytes: int
    status: ResumeStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ParsedResumeRead(ResumeRead):
    parsed_text: str | None
    parsed_profile: dict
    extracted_skills: list[str]
    education: list[str]
    work_experience: list[str]
    projects: list[str]
    years_of_experience: Decimal | None
