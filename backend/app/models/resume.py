import enum
import uuid
from datetime import datetime

from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResumeStatus(str, enum.Enum):
    uploaded = "uploaded"
    parsing_pending = "parsing_pending"
    parsed = "parsed"
    failed = "failed"


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(150))
    file_path: Mapped[str] = mapped_column(String(500))
    file_size_bytes: Mapped[int] = mapped_column(Integer)
    status: Mapped[ResumeStatus] = mapped_column(
        Enum(ResumeStatus, name="resume_status"),
        default=ResumeStatus.uploaded,
        index=True,
    )
    parsed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_profile: Mapped[dict] = mapped_column(JSON, default=dict)
    extracted_skills: Mapped[list] = mapped_column(JSON, default=list)
    education: Mapped[list] = mapped_column(JSON, default=list)
    work_experience: Mapped[list] = mapped_column(JSON, default=list)
    projects: Mapped[list] = mapped_column(JSON, default=list)
    years_of_experience: Mapped[Decimal | None] = mapped_column(
        Numeric(4, 1),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="resumes")
    match_results = relationship("MatchResult", back_populates="resume")
