import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from docx import Document
from pypdf import PdfReader

from app.models.resume import Resume


SKILL_TAXONOMY = {
    "python",
    "fastapi",
    "django",
    "flask",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "terraform",
    "ci/cd",
    "git",
    "rest api",
    "graphql",
    "machine learning",
    "deep learning",
    "nlp",
    "openai",
    "pytorch",
    "tensorflow",
    "pandas",
    "numpy",
    "scikit-learn",
    "pinecone",
    "langchain",
    "html",
    "css",
    "tailwind",
    "figma",
    "product management",
    "agile",
    "testing",
    "pytest",
    "playwright",
}

EDUCATION_KEYWORDS = {
    "bachelor",
    "master",
    "phd",
    "b.tech",
    "m.tech",
    "university",
    "college",
    "degree",
    "computer science",
    "engineering",
}

PROJECT_KEYWORDS = {"project", "built", "developed", "implemented", "created"}
EXPERIENCE_KEYWORDS = {
    "experience",
    "engineer",
    "developer",
    "manager",
    "analyst",
    "intern",
    "consultant",
    "architect",
    "lead",
}


@dataclass(frozen=True)
class ParsedResume:
    text: str
    skills: list[str]
    education: list[str]
    work_experience: list[str]
    projects: list[str]
    years_of_experience: float

    @property
    def profile(self) -> dict:
        return {
            "skills": self.skills,
            "education": self.education,
            "work_experience": self.work_experience,
            "projects": self.projects,
            "years_of_experience": self.years_of_experience,
            "parser": "placeholder-rule-based-v2",
        }


class ResumeAIService:
    def parse_resume(self, resume: Resume) -> ParsedResume:
        text = extract_text_from_file(Path(resume.file_path), resume.content_type)
        normalized_text = normalize_text(text)
        lines = meaningful_lines(normalized_text)

        return ParsedResume(
            text=normalized_text,
            skills=extract_skills(normalized_text),
            education=extract_lines_by_keywords(lines, EDUCATION_KEYWORDS, limit=5),
            work_experience=extract_lines_by_keywords(lines, EXPERIENCE_KEYWORDS, limit=8),
            projects=extract_lines_by_keywords(lines, PROJECT_KEYWORDS, limit=6),
            years_of_experience=extract_years_of_experience(normalized_text),
        )


def extract_text_from_file(path: Path, content_type: str) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found: {path}")

    if content_type == "application/pdf" or path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if (
        content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or path.suffix.lower() == ".docx"
    ):
        document = Document(str(path))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    return path.read_text(encoding="utf-8", errors="ignore")


def normalize_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def meaningful_lines(text: str) -> list[str]:
    return [
        line.strip(" -•\t")
        for line in text.splitlines()
        if len(line.strip(" -•\t")) >= 4
    ]


def extract_skills(text: str) -> list[str]:
    lowered_text = f" {text.lower()} "
    skills = []
    for skill in sorted(SKILL_TAXONOMY):
        pattern = rf"(?<![a-z0-9+#.]){re.escape(skill)}(?![a-z0-9+#.])"
        if re.search(pattern, lowered_text):
            skills.append(skill)
    return skills


def extract_lines_by_keywords(
    lines: list[str],
    keywords: set[str],
    limit: int,
) -> list[str]:
    matches = []
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in keywords):
            matches.append(line[:300])
        if len(matches) >= limit:
            break
    return matches


def extract_years_of_experience(text: str) -> float:
    lowered_text = text.lower()
    explicit_matches = [
        float(match.group(1))
        for match in re.finditer(
            r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience",
            lowered_text,
        )
    ]
    if explicit_matches:
        return max(explicit_matches)

    experience_lines = [
        line
        for line in meaningful_lines(lowered_text)
        if looks_like_work_experience_line(line)
    ]
    ranges = []
    for line in experience_lines:
        ranges.extend(extract_date_ranges(line))

    if ranges:
        merged_ranges = merge_year_ranges(ranges)
        total_years = sum(end - start for start, end in merged_ranges)
        return round(min(total_years, 60.0), 1)

    return 0.0


def looks_like_work_experience_line(line: str) -> bool:
    role_signal = any(keyword in line for keyword in EXPERIENCE_KEYWORDS)
    education_signal = any(keyword in line for keyword in EDUCATION_KEYWORDS)
    return role_signal and not education_signal


def extract_date_ranges(line: str) -> list[tuple[float, float]]:
    ranges = []
    current_year = date.today().year
    current_month = date.today().month
    current_decimal = current_year + (current_month - 1) / 12
    date_token = (
        r"(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)"
        r"[a-z]*\s+)?(?:20\d{2}|19\d{2})"
    )
    range_pattern = re.compile(
        rf"(?P<start>{date_token})\s*(?:-|–|—|to)\s*(?P<end>{date_token}|present|current|now)"
    )

    for match in range_pattern.finditer(line):
        start = parse_year_token(match.group("start"))
        raw_end = match.group("end")
        end = current_decimal if raw_end in {"present", "current", "now"} else parse_year_token(raw_end)
        if start is None or end is None:
            continue
        if end < start:
            continue
        if start < 1980 or end > current_decimal + 1:
            continue
        ranges.append((start, end))

    return ranges


def parse_year_token(token: str) -> float | None:
    year_match = re.search(r"\b(20\d{2}|19\d{2})\b", token)
    if year_match is None:
        return None

    year = int(year_match.group(1))
    month_match = re.search(
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)",
        token,
    )
    if month_match is None:
        return float(year)

    month_lookup = {
        "jan": 1,
        "feb": 2,
        "mar": 3,
        "apr": 4,
        "may": 5,
        "jun": 6,
        "jul": 7,
        "aug": 8,
        "sep": 9,
        "sept": 9,
        "oct": 10,
        "nov": 11,
        "dec": 12,
    }
    month = month_lookup[month_match.group(1)]
    return year + (month - 1) / 12


def merge_year_ranges(ranges: list[tuple[float, float]]) -> list[tuple[float, float]]:
    sorted_ranges = sorted(ranges)
    merged = []
    for start, end in sorted_ranges:
        if not merged or start > merged[-1][1]:
            merged.append((start, end))
            continue
        previous_start, previous_end = merged[-1]
        merged[-1] = (previous_start, max(previous_end, end))
    return merged
