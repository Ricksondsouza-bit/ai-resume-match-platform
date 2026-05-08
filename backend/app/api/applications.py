from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead

router = APIRouter()


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if payload.resume_id is not None:
        resume = db.get(Resume, payload.resume_id)
        if resume is None or resume.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found",
            )

    application = Application(
        candidate_user_id=current_user.id,
        job_id=payload.job_id,
        resume_id=payload.resume_id,
        cover_note=payload.cover_note,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job",
        )
    db.refresh(application)
    return application


@router.get("/me", response_model=list[ApplicationRead])
def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    statement = (
        select(Application)
        .where(Application.candidate_user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    return list(db.scalars(statement).all())

