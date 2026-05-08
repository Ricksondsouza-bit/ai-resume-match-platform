from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from docx.opc.exceptions import PackageNotFoundError
from pypdf.errors import PdfReadError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.job import Job
from app.models.match_result import MatchResult
from app.models.resume import Resume, ResumeStatus
from app.models.user import User
from app.schemas.match import MatchCreate, MatchResultRead
from app.services.matching import JobMatchingService
from app.services.resume_ai import ResumeAIService

router = APIRouter()


@router.post("", response_model=MatchResultRead, status_code=status.HTTP_201_CREATED)
def create_match_result(
    payload: MatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MatchResult:
    resume = db.get(Resume, payload.resume_id)
    if resume is None or resume.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    parser_version = (resume.parsed_profile or {}).get("parser")
    if resume.status != ResumeStatus.parsed or parser_version != "placeholder-rule-based-v2":
        try:
            parsed_resume = ResumeAIService().parse_resume(resume)
        except (FileNotFoundError, PdfReadError, PackageNotFoundError, ValueError) as exc:
            resume.status = ResumeStatus.failed
            db.add(resume)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse resume before matching: {exc}",
            )
        resume.parsed_text = parsed_resume.text
        resume.parsed_profile = parsed_resume.profile
        resume.extracted_skills = parsed_resume.skills
        resume.education = parsed_resume.education
        resume.work_experience = parsed_resume.work_experience
        resume.projects = parsed_resume.projects
        resume.years_of_experience = parsed_resume.years_of_experience
        resume.status = ResumeStatus.parsed

    computed = JobMatchingService().compare_resume_to_job(resume, job)

    existing_match = db.scalar(
        select(MatchResult).where(
            MatchResult.resume_id == resume.id,
            MatchResult.job_id == job.id,
        )
    )
    match_result = existing_match or MatchResult(resume_id=resume.id, job_id=job.id)
    match_result.score = computed.score
    match_result.explanation = computed.explanation
    match_result.matched_skills = computed.matched_skills
    match_result.missing_skills = computed.missing_skills
    match_result.improvement_suggestions = computed.improvement_suggestions

    db.add(match_result)
    db.commit()
    db.refresh(match_result)
    return match_result


@router.get("/resumes/{resume_id}/jobs/{job_id}", response_model=MatchResultRead)
def get_match_result(
    resume_id: UUID,
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MatchResult:
    resume = db.get(Resume, resume_id)
    if resume is None or resume.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    match_result = db.scalar(
        select(MatchResult).where(
            MatchResult.resume_id == resume_id,
            MatchResult.job_id == job_id,
        )
    )
    if match_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match result not found",
        )
    return match_result
