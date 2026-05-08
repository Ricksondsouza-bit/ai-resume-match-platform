# AI Resume Match Platform - System Architecture

## 1. Product Scope

AI Resume Match Platform is a multi-tenant web application for three primary personas:

- Candidates upload resumes, receive parsed profile data, get job recommendations, view match explanations, track applications, and generate interview preparation material.
- Recruiters register companies, post jobs, search candidates, compare applicants, view AI ranking, and analyze hiring pipeline performance.
- Admins manage users, monitor usage, inspect AI token consumption, and view platform health metrics.

The platform is built as a production-grade full-stack system:

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS.
- Backend: FastAPI REST API, Python.
- Database: PostgreSQL.
- Vector database: Pinecone.
- Authentication: JWT access and refresh tokens, Google OAuth.
- AI: resume parsing, skill extraction, embeddings, semantic matching, score explanations, interview questions, and resume improvement suggestions.
- File processing: PDF and DOCX uploads.

## 2. High-Level Architecture

```mermaid
flowchart LR
    Browser["Web Browser"]
    Next["Next.js 15 App"]
    API["FastAPI REST API"]
    Auth["Auth Service"]
    Files["File Storage"]
    Workers["AI Worker Layer"]
    Postgres["PostgreSQL"]
    Pinecone["Pinecone Vector DB"]
    AIProvider["LLM and Embedding Provider"]
    Observability["Logs, Metrics, Traces"]

    Browser --> Next
    Next --> API
    API --> Auth
    API --> Postgres
    API --> Files
    API --> Workers
    Workers --> Files
    Workers --> Postgres
    Workers --> Pinecone
    Workers --> AIProvider
    API --> Pinecone
    API --> Observability
    Workers --> Observability
    Next --> Observability
```

## 3. Application Boundaries

### Frontend Boundary

The Next.js app is responsible for:

- Public marketing and auth pages.
- Candidate portal UI.
- Recruiter portal UI.
- Admin portal UI.
- Route protection by role.
- Client-side form validation.
- Server-side API calls from Next.js route handlers or server actions where appropriate.
- Typed API client shared by frontend features.
- Upload UX, progress states, optimistic UI, loading skeletons, and error states.

The frontend does not directly call PostgreSQL, Pinecone, or AI providers.

### Backend API Boundary

The FastAPI backend is responsible for:

- Authentication and authorization.
- Role-based access control.
- User, candidate, recruiter, company, job, application, analytics, and admin APIs.
- Resume upload orchestration.
- Job posting orchestration.
- Match result retrieval and recalculation triggers.
- Signed file upload or server-mediated upload depending on storage provider.
- Input validation with Pydantic schemas.
- Business rules and audit logging.

### AI Worker Boundary

The AI worker layer is responsible for long-running and expensive AI operations:

- Extract resume text from PDF or DOCX.
- Normalize extracted text.
- Extract candidate skills, experience, education, certifications, and role preferences.
- Generate resume embeddings.
- Generate job embeddings.
- Upsert vectors into Pinecone.
- Calculate candidate-job match scores.
- Produce score explanations.
- Generate missing skill analysis.
- Generate interview questions.
- Generate resume improvement suggestions.

AI work should run asynchronously so resume uploads and job postings do not block HTTP requests.

## 4. Runtime Services

### Next.js Web Service

- Runs the web UI.
- Uses App Router.
- Uses TypeScript for all app, component, API client, and form code.
- Uses Tailwind CSS for styling.
- Uses React Server Components for read-heavy dashboard screens where useful.
- Uses client components for interactive forms, upload progress, tables, filters, charts, and comparisons.

### FastAPI Service

- Exposes REST APIs under `/api/v1`.
- Uses Pydantic for request and response contracts.
- Uses SQLAlchemy 2.x or SQLModel for database access.
- Uses Alembic for migrations.
- Uses JWT access tokens and refresh tokens.
- Uses Google OAuth for federated login.
- Emits structured logs.
- Enforces role permissions for candidate, recruiter, and admin routes.

### Worker Service

- Runs background jobs separately from the API.
- Recommended queue: Celery with Redis, or RQ/Arq if the project prefers simpler async workers.
- Handles retries, backoff, dead-letter states, and idempotency.
- Writes AI processing state back to PostgreSQL.

### PostgreSQL

Stores relational system-of-record data:

- Users and auth identities.
- Candidate profiles.
- Recruiter profiles.
- Companies.
- Jobs.
- Resumes and parsed resume data.
- Applications.
- Match scores and explanations.
- AI usage records.
- Admin analytics snapshots.
- Audit events.

### Pinecone

Stores vector embeddings:

- Candidate resume vectors.
- Candidate skill profile vectors.
- Job description vectors.
- Job requirement vectors.

Pinecone metadata should include stable IDs, tenant boundaries, role, visibility, and status so vector search can be filtered safely.

### File Storage

Production should use object storage such as S3, Cloudflare R2, GCS, or Azure Blob Storage.

Stored files:

- Original resume uploads.
- Optional parsed text artifacts.
- Optional generated PDF reports.

Files must not be stored permanently on the API container filesystem.

## 5. Core Data Flow

### Candidate Resume Upload Flow

```mermaid
sequenceDiagram
    participant C as Candidate
    participant Web as Next.js
    participant API as FastAPI
    participant DB as PostgreSQL
    participant Store as Object Storage
    participant Worker as AI Worker
    participant Vec as Pinecone
    participant AI as AI Provider

    C->>Web: Upload PDF or DOCX
    Web->>API: POST /resumes
    API->>Store: Store original file
    API->>DB: Create resume record with status uploaded
    API->>Worker: Enqueue resume processing job
    API-->>Web: Return resume id and processing status
    Worker->>Store: Read file
    Worker->>Worker: Extract and normalize text
    Worker->>AI: Extract skills and structured profile
    Worker->>AI: Generate embedding
    Worker->>Vec: Upsert candidate vectors
    Worker->>DB: Save parsed profile, skills, score, status processed
    Web->>API: Poll or subscribe to status
    API-->>Web: Parsed resume and recommendations
```

### Recruiter Job Posting Flow

```mermaid
sequenceDiagram
    participant R as Recruiter
    participant Web as Next.js
    participant API as FastAPI
    participant DB as PostgreSQL
    participant Worker as AI Worker
    participant Vec as Pinecone
    participant AI as AI Provider

    R->>Web: Create job post
    Web->>API: POST /jobs
    API->>DB: Save job as draft or active
    API->>Worker: Enqueue job embedding job
    API-->>Web: Return job id
    Worker->>AI: Extract required skills and generate embedding
    Worker->>Vec: Upsert job vectors
    Worker->>DB: Save structured requirements
    Worker->>Vec: Search candidate vectors
    Worker->>DB: Save initial candidate rankings
```

### Job Recommendation Flow

```mermaid
flowchart TD
    Start["Candidate requests recommendations"]
    LoadProfile["Load candidate profile and skills"]
    VectorSearch["Search Pinecone for similar active jobs"]
    SQLFilter["Apply relational filters: location, seniority, visibility, status"]
    Score["Calculate final weighted match score"]
    Explain["Generate or load score explanation"]
    Return["Return ranked jobs"]

    Start --> LoadProfile --> VectorSearch --> SQLFilter --> Score --> Explain --> Return
```

## 6. AI Matching Architecture

The final match score should combine semantic similarity with deterministic business signals.

Recommended score formula:

```text
final_score =
  semantic_similarity * 0.45 +
  required_skill_overlap * 0.25 +
  experience_fit * 0.10 +
  seniority_fit * 0.08 +
  location_or_remote_fit * 0.05 +
  education_or_certification_fit * 0.04 +
  recency_and_profile_quality * 0.03
```

The exact weights should be configurable in backend settings so product experiments do not require code changes.

### AI Pipeline Steps

1. Extract raw text from resume file.
2. Clean headers, footers, repeated whitespace, page artifacts, and broken bullet text.
3. Detect resume sections: summary, skills, experience, education, projects, certifications.
4. Extract normalized skills using a controlled taxonomy plus LLM fallback.
5. Extract years of experience, job titles, industries, education, certifications, tools, and achievements.
6. Generate candidate profile embedding.
7. Generate skill-only embedding for more precise searches.
8. Upsert candidate vectors into Pinecone.
9. Generate job embedding from job title, responsibilities, required skills, preferred skills, seniority, and company domain.
10. Search semantically similar jobs or candidates.
11. Calculate deterministic feature scores.
12. Persist match score and explanation.

### Match Explanation

Every AI score shown to a user should include explainable components:

- Strong matching skills.
- Missing required skills.
- Relevant experience.
- Seniority alignment.
- Location or remote alignment.
- Why the candidate or job was ranked highly.
- How the candidate can improve the match.

## 7. Role-Based Access Control

Roles:

- `candidate`
- `recruiter`
- `company_admin`
- `platform_admin`

Permission rules:

- Candidates can only access their own profile, resumes, recommendations, applications, and AI suggestions.
- Recruiters can access jobs and candidate pipelines for companies they belong to.
- Company admins can manage company members, jobs, and analytics for their company.
- Platform admins can access user management, usage analytics, token monitoring, and audit events.

All backend routes must enforce authorization. Frontend route protection is for user experience only and is not a security boundary.

## 8. Authentication Architecture

### Email and Password Login

- Passwords are hashed with Argon2id or bcrypt.
- On login, backend issues:
  - Short-lived JWT access token.
  - Long-lived refresh token stored as an HttpOnly secure cookie or in a server-side refresh token table.
- Refresh tokens are rotatable and revocable.

### Google OAuth

- Frontend redirects user to Google OAuth.
- Backend validates OAuth callback.
- Backend creates or links an auth identity.
- Backend issues platform JWT tokens.

### Token Claims

Access token should include:

- `sub`: user id.
- `role`: active role.
- `company_id`: only for recruiter and company admin contexts.
- `token_version`: supports global logout and forced invalidation.
- `exp`: short expiry.

## 9. API Surface Overview

Primary REST groups:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/candidates`
- `/api/v1/resumes`
- `/api/v1/jobs`
- `/api/v1/matches`
- `/api/v1/applications`
- `/api/v1/recruiters`
- `/api/v1/companies`
- `/api/v1/analytics`
- `/api/v1/admin`
- `/api/v1/ai`
- `/api/v1/uploads`

Detailed endpoint contracts will be generated in deliverable 4.

## 10. Frontend Page Architecture

### Public

- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/google/callback`

### Candidate Portal

- `/candidate/dashboard`
- `/candidate/resume`
- `/candidate/resume/upload`
- `/candidate/jobs`
- `/candidate/jobs/[jobId]`
- `/candidate/applications`
- `/candidate/interview-prep`
- `/candidate/profile`

### Recruiter Portal

- `/recruiter/dashboard`
- `/recruiter/company`
- `/recruiter/jobs`
- `/recruiter/jobs/new`
- `/recruiter/jobs/[jobId]`
- `/recruiter/jobs/[jobId]/candidates`
- `/recruiter/candidates/search`
- `/recruiter/candidates/compare`
- `/recruiter/analytics`

### Admin Portal

- `/admin/dashboard`
- `/admin/users`
- `/admin/usage`
- `/admin/ai-tokens`
- `/admin/audit-logs`

## 11. Reliability and Scalability

### Asynchronous Processing

Resume parsing, embedding generation, matching, interview question generation, and resume suggestions must run in workers.

Job states should be tracked:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `retrying`

### Idempotency

AI jobs should be idempotent by using stable keys:

- Resume processing key: `resume:{resume_id}:version:{file_hash}`.
- Job embedding key: `job:{job_id}:version:{content_hash}`.
- Match calculation key: `candidate:{candidate_id}:job:{job_id}:version:{matching_model_version}`.

### Caching

Use Redis for:

- Rate limiting.
- Worker queue backend.
- Short-lived API response caching.
- OAuth state.
- Optional server-side session metadata.

### Pagination

All list APIs must support cursor or page-based pagination. Candidate search and matching lists should prefer cursor pagination for stable ranking views.

## 12. Security Architecture

Security controls:

- Validate uploaded file type by MIME type and extension.
- Enforce file size limits.
- Virus scanning hook for production storage pipeline.
- Store files in private buckets.
- Use signed URLs for temporary file access.
- Strip or escape resume text before rendering.
- Never expose raw provider prompts or secrets to the browser.
- Use rate limits on auth, upload, AI generation, and search endpoints.
- Enforce tenant filters in SQL and Pinecone metadata.
- Keep audit logs for admin actions, role changes, company membership changes, and sensitive recruiter activity.
- Use HTTPS in all deployed environments.
- Store secrets in environment-specific secret managers.

## 13. Observability

Required telemetry:

- API request logs with request id.
- Worker job logs with job id.
- AI provider latency, token usage, and error rates.
- Resume processing duration.
- Job matching duration.
- Pinecone query latency.
- Database query latency.
- Auth failure metrics.
- Upload failure metrics.

Recommended stack:

- OpenTelemetry instrumentation.
- Structured JSON logs.
- Sentry for frontend and backend errors.
- Prometheus and Grafana for metrics.

## 14. Deployment Architecture

```mermaid
flowchart TD
    GitHub["GitHub Repository"]
    CI["CI/CD Pipeline"]
    Registry["Container Registry"]
    Web["Next.js Container"]
    API["FastAPI Container"]
    Worker["Worker Container"]
    Redis["Redis"]
    DB["Managed PostgreSQL"]
    Storage["Object Storage"]
    Pinecone["Pinecone"]
    AI["AI Provider"]

    GitHub --> CI
    CI --> Registry
    Registry --> Web
    Registry --> API
    Registry --> Worker
    Web --> API
    API --> Redis
    Worker --> Redis
    API --> DB
    Worker --> DB
    API --> Storage
    Worker --> Storage
    Worker --> Pinecone
    API --> Pinecone
    Worker --> AI
```

Production should deploy each service independently:

- `web`: Next.js app.
- `api`: FastAPI app.
- `worker`: AI background worker.
- `postgres`: managed PostgreSQL.
- `redis`: managed Redis.
- `object-storage`: managed private bucket.
- `pinecone`: managed vector index.

For local development, Docker Compose will run:

- Next.js frontend.
- FastAPI backend.
- PostgreSQL.
- Redis.
- Worker.
- Optional local object storage such as MinIO.

## 15. Environment Configuration

Core environment variables:

```text
APP_ENV=development
WEB_URL=http://localhost:3000
API_URL=http://localhost:8000

DATABASE_URL=postgresql+psycopg://user:password@postgres:5432/resume_match
REDIS_URL=redis://redis:6379/0

JWT_SECRET_KEY=replace-me
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

PINECONE_API_KEY=replace-me
PINECONE_INDEX_NAME=resume-match
PINECONE_NAMESPACE=development

AI_PROVIDER_API_KEY=replace-me
EMBEDDING_MODEL=text-embedding-model
CHAT_MODEL=chat-model

STORAGE_PROVIDER=s3
STORAGE_BUCKET=resume-match-dev
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=replace-me
STORAGE_SECRET_ACCESS_KEY=replace-me
```

## 16. Initial Implementation Sequence

The application should be built in modules in this order:

1. Monorepo foundation, Docker Compose, linting, formatting, shared conventions.
2. Backend app shell, settings, health checks, database connection, migrations.
3. Database schema and Alembic migrations.
4. Auth module with JWT and Google OAuth.
5. User, role, company, candidate, and recruiter modules.
6. Resume upload and file processing module.
7. AI parsing, skill extraction, and embedding pipeline.
8. Job posting module and job embedding pipeline.
9. Matching and recommendation APIs.
10. Candidate portal UI.
11. Recruiter portal UI.
12. Admin portal UI.
13. Analytics and AI token monitoring.
14. CI/CD, Docker production builds, and deployment manifests.
15. Test coverage and production hardening.

## 17. Architecture Decisions

### ADR-001: Keep AI Work Outside HTTP Requests

Resume parsing, embeddings, and AI generation are expensive and can fail due to provider limits. The API should enqueue work and return processing status. This keeps the UI responsive and makes retries reliable.

### ADR-002: PostgreSQL Is the System of Record

Pinecone stores searchable vectors, not authoritative product data. Every vector should map back to PostgreSQL records through stable IDs.

### ADR-003: Match Scores Are Hybrid

Semantic similarity alone is not enough for hiring workflows. The platform combines vector similarity with structured skills, seniority, experience, location, and profile quality.

### ADR-004: Tenant Filters Must Exist in SQL and Pinecone

Recruiter and company data must be isolated. SQL queries must filter by company membership, and Pinecone queries must include metadata filters where applicable.

### ADR-005: AI Outputs Must Be Persisted With Version Metadata

AI results should store model name, prompt version, parser version, embedding model, token usage, and created timestamp. This supports debugging, analytics, audits, and future reprocessing.

## 18. Success Criteria

The architecture is ready for implementation when:

- Each persona has clear capabilities.
- Frontend, backend, worker, database, vector store, and storage boundaries are explicit.
- Long-running AI workflows are asynchronous.
- Match scores are explainable.
- Authentication and authorization are enforceable server-side.
- Production deployment has independently scalable services.
- Observability, security, and AI usage monitoring are first-class concerns.

