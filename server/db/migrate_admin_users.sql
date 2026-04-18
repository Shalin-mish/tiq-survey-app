-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin (password: Admin@567 hashed with bcrypt)
-- Run: node db/seed_admin.js  to insert via script instead
