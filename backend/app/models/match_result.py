import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, Text, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MatchResult(Base):
    __tablename__ = "match_results"
    __table_args__ = (
        UniqueConstraint("resume_id", "job_id", name="uq_resume_job_match_result"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        index=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        index=True,
    )
    score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    matched_skills: Mapped[dict] = mapped_column(JSON, default=dict)
    missing_skills: Mapped[dict] = mapped_column(JSON, default=dict)
    improvement_suggestions: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    resume = relationship("Resume", back_populates="match_results")
    job = relationship("Job", back_populates="match_results")
