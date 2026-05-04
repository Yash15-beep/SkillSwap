USE skillswap_db;

-- index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- indexes on user_skills for fast joins and category filtering
CREATE INDEX IF NOT EXISTS idx_skills_user_id  ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON user_skills(category);

-- indexes on swaps for fast filtering by user and status
CREATE INDEX IF NOT EXISTS idx_swaps_initiator ON swaps(initiatorId);
CREATE INDEX IF NOT EXISTS idx_swaps_receiver  ON swaps(receiverId);
CREATE INDEX IF NOT EXISTS idx_swaps_status    ON swaps(status);
