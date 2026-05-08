from dataclasses import dataclass
from decimal import Decimal

from app.models.job import Job
from app.models.resume import Resume
from app.services.resume_ai import extract_skills


@dataclass(frozen=True)
class MatchComputation:
    score: Decimal
    explanation: str
    matched_skills: dict
    missing_skills: dict
    improvement_suggestions: list[str]


class JobMatchingService:
    def compare_resume_to_job(self, resume: Resume, job: Job) -> MatchComputation:
        resume_skills = {skill.lower() for skill in (resume.extracted_skills or [])}
        job_text = " ".join(
            part
            for part in [
                job.title,
                job.description,
                job.requirements,
                job.seniority_level or "",
                job.employment_type or "",
            ]
            if part
        )
        job_skills = set(extract_skills(job_text))

        matched = sorted(resume_skills & job_skills)
        missing = sorted(job_skills - resume_skills)

        skill_score = len(matched) / len(job_skills) if job_skills else 0.3
        experience_score = min(float(resume.years_of_experience or 0) / 5.0, 1.0)
        profile_score = profile_completeness_score(resume)
        final_score = round((skill_score * 0.7 + experience_score * 0.2 + profile_score * 0.1) * 100, 2)

        return MatchComputation(
            score=Decimal(str(final_score)),
            explanation=build_explanation(final_score, matched, missing, resume),
            matched_skills={
                "items": matched,
                "count": len(matched),
            },
            missing_skills={
                "items": missing,
                "count": len(missing),
            },
            improvement_suggestions=build_improvement_suggestions(missing, resume),
        )


def profile_completeness_score(resume: Resume) -> float:
    signals = [
        bool(resume.extracted_skills),
        bool(resume.education),
        bool(resume.work_experience),
        bool(resume.projects),
        bool(resume.years_of_experience and resume.years_of_experience > 0),
    ]
    return sum(signals) / len(signals)


def build_explanation(
    score: float,
    matched: list[str],
    missing: list[str],
    resume: Resume,
) -> str:
    if score >= 75:
        fit = "strong"
    elif score >= 50:
        fit = "moderate"
    else:
        fit = "early"

    matched_text = ", ".join(matched[:8]) if matched else "no directly matched skills yet"
    missing_text = ", ".join(missing[:8]) if missing else "no major required skills detected as missing"
    experience_text = format_experience_text(float(resume.years_of_experience or 0))

    return (
        f"This is a {fit} match based on the placeholder scoring model. "
        f"Matched skills: {matched_text}. Missing skills: {missing_text}. "
        f"{experience_text}."
    )


def format_experience_text(years: float) -> str:
    if years <= 0:
        return "Experience duration was not confidently detected"
    return f"Estimated experience: {years:g} years"


def build_improvement_suggestions(missing: list[str], resume: Resume) -> list[str]:
    suggestions = []
    if missing:
        suggestions.append(
            "Add concrete resume bullets showing experience with "
            + ", ".join(missing[:5])
            + "."
        )
    if not resume.projects:
        suggestions.append("Add 1-2 project entries that show measurable business or technical outcomes.")
    if not resume.work_experience:
        suggestions.append("Add recent work experience with role, company, dates, and impact metrics.")
    if not resume.education:
        suggestions.append("Add education, certifications, or relevant training to strengthen the profile.")
    if not suggestions:
        suggestions.append("Quantify achievements with metrics such as latency reduced, revenue influenced, or users served.")
    return suggestions
