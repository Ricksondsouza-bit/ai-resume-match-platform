from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_recruiter_or_admin
from app.core.database import get_db
from app.models.job import Job, JobStatus
from app.models.user import User
from app.schemas.job import JobCreate, JobRead

router = APIRouter()


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db),
) -> Job:
    job = Job(
        created_by_user_id=current_user.id,
        title=payload.title,
        company_name=payload.company_name,
        location=payload.location,
        employment_type=payload.employment_type,
        seniority_level=payload.seniority_level,
        description=payload.description,
        requirements=payload.requirements,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        status=payload.status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobRead])
def list_jobs(
    status_filter: JobStatus | None = Query(default=JobStatus.active, alias="status"),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Job]:
    statement = select(Job).order_by(Job.created_at.desc()).limit(limit).offset(offset)
    if status_filter is not None:
        statement = statement.where(Job.status == status_filter)
    return list(db.scalars(statement).all())


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: UUID, db: Session = Depends(get_db)) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job
