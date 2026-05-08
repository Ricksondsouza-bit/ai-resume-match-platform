from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class MatchCreate(BaseModel):
    resume_id: UUID
    job_id: UUID


class MatchResultRead(BaseModel):
    id: UUID
    resume_id: UUID
    job_id: UUID
    score: Decimal
    explanation: str | None
    matched_skills: dict
    missing_skills: dict
    improvement_suggestions: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

