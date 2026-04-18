-- Run once: adds token blacklist table for server-side logout
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT        PRIMARY KEY,
  revoked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup: remove tokens older than 15 days (same as JWT expiry)
-- Optional: run this periodically via a cron job
-- DELETE FROM revoked_tokens WHERE revoked_at < NOW() - INTERVAL '15 days';
