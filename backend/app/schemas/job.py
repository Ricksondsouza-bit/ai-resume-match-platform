from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.job import JobStatus


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    company_name: str = Field(min_length=2, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=80)
    seniority_level: str | None = Field(default=None, max_length=80)
    description: str = Field(min_length=20)
    requirements: str = Field(min_length=10)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    status: JobStatus = JobStatus.active

    @model_validator(mode="after")
    def validate_salary_range(self) -> "JobCreate":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")
        return self


class JobRead(BaseModel):
    id: UUID
    created_by_user_id: UUID | None
    title: str
    company_name: str
    location: str | None
    employment_type: str | None
    seniority_level: str | None
    description: str
    requirements: str
    salary_min: int | None
    salary_max: int | None
    status: JobStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

