ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_profile jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS work_experience jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS projects jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS years_of_experience numeric(4, 1);

ALTER TABLE match_results ADD COLUMN IF NOT EXISTS improvement_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb;
