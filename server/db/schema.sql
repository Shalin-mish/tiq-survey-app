-- Run this once to set up the database tables

-- Survey responses (all submissions)
CREATE TABLE IF NOT EXISTS survey_responses (
  id           SERIAL       PRIMARY KEY,
  identity     TEXT         NOT NULL,
  pain_1       TEXT         NOT NULL,
  pain_2       TEXT,
  name         TEXT         NOT NULL,
  email        TEXT         NOT NULL,
  phone        TEXT         NOT NULL,
  organisation TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_survey_email ON survey_responses (LOWER(email));
