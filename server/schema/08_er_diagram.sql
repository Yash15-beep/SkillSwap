-- ER Diagram (text representation)
--
-- [users] ---< [user_skills]
--   id (PK)       id (PK)
--   fullName      user_id (FK -> users.id)
--   email         type (offering/seeking)
--   password      name
--   bio           category
--   avatarUrl     level
--   swapCount
--   createdAt
--
-- [users] ---< [user_portfolio_links]
--   id (PK)       id (PK)
--                 user_id (FK -> users.id)
--                 label
--                 url
--
-- [users] ---< [swaps] >--- [users]
--   id (PK)       id (PK)
--                 initiatorId (FK -> users.id)
--                 receiverId  (FK -> users.id)
--                 offeredSkill
--                 soughtSkill
--                 message
--                 proposedSchedule
--                 status (pending/accepted/rejected/completed)
--                 createdAt
--
-- [contacts]  (standalone, no FK)
--   id (PK)
--   name
--   email
--   subject
--   message
--   createdAt
--
-- Relationships:
--   users        1 ---< user_skills          (one user, many skills)
--   users        1 ---< user_portfolio_links (one user, many links)
--   users        1 ---< swaps (as initiator) (one user, many swaps sent)
--   users        1 ---< swaps (as receiver)  (one user, many swaps received)
--   contacts     standalone entity

USE skillswap_db;

-- verify FK relationships match the ER diagram above
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
