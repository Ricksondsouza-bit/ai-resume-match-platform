import uuid
from pathlib import Path
from pypdf.errors import PdfReadError
from docx.opc.exceptions import PackageNotFoundError
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.resume import Resume, ResumeStatus
from app.models.user import User
from app.schemas.resume import ParsedResumeRead, ResumeRead
from app.services.resume_ai import ResumeAIService

router = APIRouter()

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_RESUME_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Resume:
    original_filename = file.filename or "resume"
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_RESUME_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX resume uploads are supported",
        )

    if file.content_type not in ALLOWED_RESUME_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume content type",
        )

    content = await file.read()
    max_size_bytes = settings.max_resume_upload_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume file must be {settings.max_resume_upload_mb} MB or smaller",
        )

    storage_dir = Path(settings.resume_storage_dir)
    storage_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{current_user.id}_{uuid.uuid4()}{extension}"
    stored_path = storage_dir / stored_filename
    stored_path.write_bytes(content)

    resume = Resume(
        user_id=current_user.id,
        original_filename=original_filename,
        content_type=file.content_type or "application/octet-stream",
        file_path=str(stored_path),
        file_size_bytes=len(content),
        status=ResumeStatus.uploaded,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("", response_model=list[ResumeRead])
def list_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Resume]:
    statement = (
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.post("/{resume_id}/parse", response_model=ParsedResumeRead)
def parse_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Resume:
    resume = db.get(Resume, resume_id)
    if resume is None or resume.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    try:
        parsed_resume = ResumeAIService().parse_resume(resume)
    except (FileNotFoundError, PdfReadError, PackageNotFoundError, ValueError) as exc:
        resume.status = ResumeStatus.failed
        db.add(resume)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse resume: {exc}",
        )
    resume.parsed_text = parsed_resume.text
    resume.parsed_profile = parsed_resume.profile
    resume.extracted_skills = parsed_resume.skills
    resume.education = parsed_resume.education
    resume.work_experience = parsed_resume.work_experience
    resume.projects = parsed_resume.projects
    resume.years_of_experience = parsed_resume.years_of_experience
    resume.status = ResumeStatus.parsed

    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume
