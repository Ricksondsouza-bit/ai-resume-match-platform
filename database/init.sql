CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS app_health_checks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name text NOT NULL,
    checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_health_checks (service_name)
VALUES ('database')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE resume_status AS ENUM ('uploaded', 'parsing_pending', 'parsed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE application_status AS ENUM (
        'submitted',
        'reviewing',
        'shortlisted',
        'rejected',
        'hired',
        'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) NOT NULL UNIQUE,
    full_name varchar(255) NOT NULL,
    hashed_password varchar(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_role ON users (role);

CREATE TABLE IF NOT EXISTS resumes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename varchar(255) NOT NULL,
    content_type varchar(150) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size_bytes integer NOT NULL,
    status resume_status NOT NULL DEFAULT 'uploaded',
    parsed_text text,
    parsed_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
    extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    education jsonb NOT NULL DEFAULT '[]'::jsonb,
    work_experience jsonb NOT NULL DEFAULT '[]'::jsonb,
    projects jsonb NOT NULL DEFAULT '[]'::jsonb,
    years_of_experience numeric(4, 1),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_profile jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS work_experience jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS projects jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS years_of_experience numeric(4, 1);

CREATE INDEX IF NOT EXISTS ix_resumes_user_id ON resumes (user_id);
CREATE INDEX IF NOT EXISTS ix_resumes_status ON resumes (status);

CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title varchar(255) NOT NULL,
    company_name varchar(255) NOT NULL,
    location varchar(255),
    employment_type varchar(80),
    seniority_level varchar(80),
    description text NOT NULL,
    requirements text NOT NULL,
    salary_min integer,
    salary_max integer,
    status job_status NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_jobs_salary_range CHECK (
        salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max
    )
);

CREATE INDEX IF NOT EXISTS ix_jobs_created_by_user_id ON jobs (created_by_user_id);
CREATE INDEX IF NOT EXISTS ix_jobs_title ON jobs (title);
CREATE INDEX IF NOT EXISTS ix_jobs_company_name ON jobs (company_name);
CREATE INDEX IF NOT EXISTS ix_jobs_status ON jobs (status);

CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
    status application_status NOT NULL DEFAULT 'submitted',
    cover_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_candidate_job_application UNIQUE (candidate_user_id, job_id)
);

CREATE INDEX IF NOT EXISTS ix_applications_candidate_user_id ON applications (candidate_user_id);
CREATE INDEX IF NOT EXISTS ix_applications_job_id ON applications (job_id);
CREATE INDEX IF NOT EXISTS ix_applications_resume_id ON applications (resume_id);
CREATE INDEX IF NOT EXISTS ix_applications_status ON applications (status);

CREATE TABLE IF NOT EXISTS match_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    score numeric(5, 2) NOT NULL,
    explanation text,
    matched_skills jsonb NOT NULL DEFAULT '{}'::jsonb,
    missing_skills jsonb NOT NULL DEFAULT '{}'::jsonb,
    improvement_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_resume_job_match_result UNIQUE (resume_id, job_id)
);

ALTER TABLE match_results ADD COLUMN IF NOT EXISTS improvement_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS ix_match_results_resume_id ON match_results (resume_id);
CREATE INDEX IF NOT EXISTS ix_match_results_job_id ON match_results (job_id);
