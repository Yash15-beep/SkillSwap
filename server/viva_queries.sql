-- ============================================================
--   SkillSwap DB - VIVA QUERIES FILE
--   Covers ALL rubric components for evaluation
-- ============================================================

USE skillswap_db;


-- ============================================================
-- SECTION 1: DDL - Data Definition Language
-- (CREATE, ALTER, DROP, TRUNCATE)
-- ============================================================

-- Show existing tables
SHOW TABLES;

-- View structure of main tables
DESC users;
DESC user_skills;
DESC swaps;

-- ALTER: Add a 'location' column to users
ALTER TABLE users ADD COLUMN location VARCHAR(255) DEFAULT 'India';

-- ALTER: Modify column size
ALTER TABLE users MODIFY COLUMN location VARCHAR(300);

-- ALTER: Rename a column (MySQL 8.0+)
ALTER TABLE users RENAME COLUMN location TO city;

-- DROP: Remove the column we just added
ALTER TABLE users DROP COLUMN city;


-- ============================================================
-- SECTION 2: DML - Data Manipulation Language
-- (INSERT, UPDATE, DELETE)
-- ============================================================

-- INSERT: Add a new user
INSERT INTO users (id, fullName, email, password, bio, swapCount)
VALUES ('9999', 'Test User', 'test@example.com', 'test123', 'Temporary test user.', 0);

-- UPDATE: Update bio of the test user
UPDATE users SET bio = 'Updated bio for test user.' WHERE id = '9999';

-- UPDATE: Increment swap count for a user
UPDATE users SET swapCount = swapCount + 1 WHERE id = '1001';

-- DELETE: Remove the test user
DELETE FROM users WHERE id = '9999';

-- Restore Aryan's swap count
UPDATE users SET swapCount = 4 WHERE id = '1001';


-- ============================================================
-- SECTION 3: DQL - Data Query Language
-- (SELECT with WHERE, ORDER BY, LIMIT)
-- ============================================================

-- Get all users
SELECT id, fullName, email, swapCount FROM users;

-- Filter: Users with more than 2 completed swaps
SELECT id, fullName, swapCount FROM users WHERE swapCount > 2;

-- Sort: Users by swap count descending
SELECT fullName, swapCount FROM users ORDER BY swapCount DESC;

-- Limit: Top 3 most active users
SELECT fullName, swapCount FROM users ORDER BY swapCount DESC LIMIT 3;

-- Search: Users whose name contains 'a'
SELECT fullName, email FROM users WHERE fullName LIKE '%a%';

-- Get all pending swaps
SELECT id, initiatorId, receiverId, offeredSkill, soughtSkill
FROM swaps WHERE status = 'pending';


-- ============================================================
-- SECTION 4: TCL - Transaction Control Language
-- (COMMIT, ROLLBACK, SAVEPOINT)
-- ============================================================

-- Start a transaction
START TRANSACTION;

-- Insert a swap inside transaction
INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, status)
VALUES ('T001', '1001', '1003', 'React.js', 'Guitar', 'Transaction test swap.', 'pending');

-- Create a savepoint
SAVEPOINT before_update;

-- Update swap status
UPDATE swaps SET status = 'accepted' WHERE id = 'T001';

-- Oops - rollback to savepoint
ROLLBACK TO SAVEPOINT before_update;

-- Verify status is still 'pending'
SELECT id, status FROM swaps WHERE id = 'T001';

-- Commit the transaction (inserts the pending swap)
COMMIT;

-- Clean up
DELETE FROM swaps WHERE id = 'T001';


-- ============================================================
-- SECTION 5: JOINS
-- ============================================================

-- INNER JOIN: Users with their skills
SELECT u.fullName, s.name AS skill, s.type, s.category, s.level
FROM users u
INNER JOIN user_skills s ON u.id = s.user_id
ORDER BY u.fullName;

-- INNER JOIN: Swaps with initiator and receiver names
SELECT
    sw.id,
    u1.fullName AS initiator,
    u2.fullName AS receiver,
    sw.offeredSkill,
    sw.soughtSkill,
    sw.status
FROM swaps sw
INNER JOIN users u1 ON sw.initiatorId = u1.id
INNER JOIN users u2 ON sw.receiverId = u2.id;

-- LEFT JOIN: All users and their portfolio links (even if they have none)
SELECT u.fullName, p.label, p.url
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
ORDER BY u.fullName;

-- LEFT JOIN: Users who have NO portfolio links
SELECT u.fullName
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
WHERE p.id IS NULL;

-- JOIN with filter: Accepted swaps with full user details
SELECT
    u1.fullName AS initiator,
    u2.fullName AS receiver,
    sw.offeredSkill,
    sw.soughtSkill,
    sw.proposedSchedule,
    sw.status
FROM swaps sw
JOIN users u1 ON sw.initiatorId = u1.id
JOIN users u2 ON sw.receiverId = u2.id
WHERE sw.status = 'accepted';


-- ============================================================
-- SECTION 6: GROUP BY & HAVING
-- ============================================================

-- Count of skills per user
SELECT u.fullName, COUNT(s.id) AS total_skills
FROM users u
JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName
ORDER BY total_skills DESC;

-- Count of skills by category
SELECT category, COUNT(*) AS skill_count
FROM user_skills
GROUP BY category
ORDER BY skill_count DESC;

-- Count of swaps per status
SELECT status, COUNT(*) AS total
FROM swaps
GROUP BY status;

-- HAVING: Users who offer more than 1 skill
SELECT u.fullName, COUNT(s.id) AS offered_skills
FROM users u
JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering'
GROUP BY u.id, u.fullName
HAVING offered_skills > 1;

-- HAVING: Categories with more than 3 skills listed
SELECT category, COUNT(*) AS total
FROM user_skills
GROUP BY category
HAVING total > 3;


-- ============================================================
-- SECTION 7: SUBQUERIES
-- ============================================================

-- Subquery: Users who have initiated at least one swap
SELECT fullName, email
FROM users
WHERE id IN (SELECT DISTINCT initiatorId FROM swaps);

-- Subquery: Users who have NEVER initiated a swap
SELECT fullName, email
FROM users
WHERE id NOT IN (SELECT DISTINCT initiatorId FROM swaps);

-- Subquery: Skills offered by users who have swapCount > 2
SELECT name, category, level
FROM user_skills
WHERE user_id IN (
    SELECT id FROM users WHERE swapCount > 2
)
AND type = 'offering';

-- Correlated Subquery: Users with above-average swap count
SELECT fullName, swapCount
FROM users
WHERE swapCount > (SELECT AVG(swapCount) FROM users);

-- Subquery in FROM (Derived Table): Swap counts per user
SELECT fullName, swap_total
FROM (
    SELECT u.fullName, COUNT(sw.id) AS swap_total
    FROM users u
    LEFT JOIN swaps sw ON u.id = sw.initiatorId
    GROUP BY u.id, u.fullName
) AS swap_summary
ORDER BY swap_total DESC;


-- ============================================================
-- SECTION 8: AGGREGATE FUNCTIONS
-- ============================================================

-- Total number of users
SELECT COUNT(*) AS total_users FROM users;

-- Average swap count
SELECT AVG(swapCount) AS avg_swaps FROM users;

-- Max and Min swap count
SELECT MAX(swapCount) AS most_active, MIN(swapCount) AS least_active FROM users;

-- Total swaps in the system
SELECT COUNT(*) AS total_swaps FROM swaps;

-- Count swaps by status
SELECT status, COUNT(*) AS count FROM swaps GROUP BY status;

-- User with the highest swap count
SELECT fullName, swapCount
FROM users
WHERE swapCount = (SELECT MAX(swapCount) FROM users);


-- ============================================================
-- SECTION 9: SCALAR FUNCTIONS
-- ============================================================

-- String functions
SELECT UPPER(fullName) AS name_upper FROM users;
SELECT LOWER(email) AS email_lower FROM users;
SELECT LENGTH(fullName) AS name_length, fullName FROM users;
SELECT CONCAT(fullName, ' <', email, '>') AS contact_info FROM users;
SELECT SUBSTRING(fullName, 1, 5) AS short_name FROM users;

-- Date functions
SELECT fullName, createdAt,
       YEAR(createdAt) AS join_year,
       MONTH(createdAt) AS join_month,
       DATEDIFF(NOW(), createdAt) AS days_since_joined
FROM users;

-- Numeric functions
SELECT fullName, swapCount,
       ROUND(swapCount * 1.5, 0) AS projected_swaps
FROM users;


-- ============================================================
-- SECTION 10: VIEWS
-- ============================================================

-- View 1: Active users with their offered skills
CREATE OR REPLACE VIEW view_user_skills AS
SELECT
    u.id,
    u.fullName,
    u.email,
    u.swapCount,
    s.name AS skill_name,
    s.category,
    s.level,
    s.type
FROM users u
JOIN user_skills s ON u.id = s.user_id;

-- Query the view
SELECT * FROM view_user_skills WHERE type = 'offering';
SELECT * FROM view_user_skills WHERE category = 'Coding';

-- View 2: Full swap details with user names
CREATE OR REPLACE VIEW view_swap_details AS
SELECT
    sw.id AS swap_id,
    u1.fullName AS initiator_name,
    u2.fullName AS receiver_name,
    sw.offeredSkill,
    sw.soughtSkill,
    sw.status,
    sw.proposedSchedule,
    sw.createdAt
FROM swaps sw
JOIN users u1 ON sw.initiatorId = u1.id
JOIN users u2 ON sw.receiverId = u2.id;

-- Query the view
SELECT * FROM view_swap_details;
SELECT * FROM view_swap_details WHERE status = 'accepted';
SELECT * FROM view_swap_details WHERE initiator_name = 'Aryan Mehta';

-- View 3: Summary of users
CREATE OR REPLACE VIEW view_user_summary AS
SELECT
    u.fullName,
    u.email,
    u.swapCount,
    COUNT(DISTINCT s.id) AS total_skills,
    COUNT(DISTINCT p.id) AS portfolio_links
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
GROUP BY u.id, u.fullName, u.email, u.swapCount;

SELECT * FROM view_user_summary ORDER BY swapCount DESC;

-- Show all views
SHOW FULL TABLES WHERE Table_type = 'VIEW';


-- ============================================================
-- SECTION 11: STORED PROCEDURES
-- ============================================================

-- Procedure 1: Get all skills for a given user
DROP PROCEDURE IF EXISTS GetUserSkills;
DELIMITER $$
CREATE PROCEDURE GetUserSkills(IN userId VARCHAR(255))
BEGIN
    SELECT name, type, category, level
    FROM user_skills
    WHERE user_id = userId
    ORDER BY type, category;
END$$
DELIMITER ;

-- Call it
CALL GetUserSkills('1001');
CALL GetUserSkills('1006');

-- Procedure 2: Get all swaps for a user (sent + received)
DROP PROCEDURE IF EXISTS GetUserSwaps;
DELIMITER $$
CREATE PROCEDURE GetUserSwaps(IN userId VARCHAR(255))
BEGIN
    SELECT 'SENT' AS direction, sw.id, u.fullName AS other_user,
           sw.offeredSkill, sw.soughtSkill, sw.status
    FROM swaps sw
    JOIN users u ON sw.receiverId = u.id
    WHERE sw.initiatorId = userId

    UNION ALL

    SELECT 'RECEIVED' AS direction, sw.id, u.fullName AS other_user,
           sw.offeredSkill, sw.soughtSkill, sw.status
    FROM swaps sw
    JOIN users u ON sw.initiatorId = u.id
    WHERE sw.receiverId = userId;
END$$
DELIMITER ;

-- Call it
CALL GetUserSwaps('1001');

-- Procedure 3: Update swap status and increment swapCount if accepted
DROP PROCEDURE IF EXISTS UpdateSwapStatus;
DELIMITER $$
CREATE PROCEDURE UpdateSwapStatus(IN swapId VARCHAR(255), IN newStatus VARCHAR(50))
BEGIN
    DECLARE v_initiatorId VARCHAR(255);
    DECLARE v_receiverId  VARCHAR(255);

    -- Update the swap status
    UPDATE swaps SET status = newStatus WHERE id = swapId;

    -- If accepted, increment both users' swap counts
    IF newStatus = 'accepted' THEN
        SELECT initiatorId, receiverId INTO v_initiatorId, v_receiverId
        FROM swaps WHERE id = swapId;

        UPDATE users SET swapCount = swapCount + 1
        WHERE id IN (v_initiatorId, v_receiverId);
    END IF;

    -- Return updated swap
    SELECT * FROM swaps WHERE id = swapId;
END$$
DELIMITER ;

-- Call it
CALL UpdateSwapStatus('S002', 'accepted');

-- Show all procedures
SHOW PROCEDURE STATUS WHERE Db = 'skillswap_db';


-- ============================================================
-- SECTION 12: INDEXING
-- ============================================================

-- Primary index already exists on users.id, swaps.id

-- Create index on email for faster login lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on swaps status for faster filtering
CREATE INDEX idx_swaps_status ON swaps(status);

-- Create index on user_skills for faster skill lookups
CREATE INDEX idx_skills_user ON user_skills(user_id);
CREATE INDEX idx_skills_category ON user_skills(category);

-- Show all indexes on users table
SHOW INDEX FROM users;
SHOW INDEX FROM swaps;
SHOW INDEX FROM user_skills;

-- Use EXPLAIN to show index usage
EXPLAIN SELECT * FROM users WHERE email = 'aryan@example.com';
EXPLAIN SELECT * FROM swaps WHERE status = 'pending';


-- ============================================================
-- SECTION 13: NORMALIZATION DEMONSTRATION
-- ============================================================

-- 1NF: All columns are atomic (no multi-valued attributes)
-- Skills are stored in a separate table (user_skills), not as a comma-separated list in users
SELECT * FROM user_skills WHERE user_id = '1001';

-- 2NF: No partial dependencies
-- user_skills has its own PK (id), and all non-key columns depend on the full key
DESC user_skills;

-- 3NF: No transitive dependencies
-- user portfolio links are in a separate table, not stored in users
SELECT u.fullName, p.label, p.url
FROM users u JOIN user_portfolio_links p ON u.id = p.user_id;


-- ============================================================
-- SECTION 14: KEYS DEMONSTRATION
-- ============================================================

-- Primary Keys
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND CONSTRAINT_NAME = 'PRIMARY';

-- Foreign Keys
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Candidate Key: email is unique (could be a PK)
SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';


-- ============================================================
-- SECTION 15: USEFUL PROJECT QUERIES (Output Explanation)
-- ============================================================

-- Q1: Discover page query - all users with their offering skills
SELECT u.fullName, u.bio, u.swapCount,
       GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills_offering
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id AND s.type = 'offering'
GROUP BY u.id, u.fullName, u.bio, u.swapCount;

-- Q2: Find users who can teach what I want to learn (e.g., Python)
SELECT DISTINCT u.fullName, u.email, u.swapCount
FROM users u
JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering' AND s.name = 'Python';

-- Q3: Find a perfect match - user who offers what I seek AND seeks what I offer
-- (e.g., I offer React.js and want Figma)
SELECT DISTINCT u.fullName, u.email
FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type='offering' AND name='Figma')
  AND u.id IN (SELECT user_id FROM user_skills WHERE type='seeking'  AND name='React.js');

-- Q4: Swap dashboard - all swaps involving user Aryan Mehta (1001)
SELECT * FROM view_swap_details
WHERE initiator_name = 'Aryan Mehta' OR receiver_name = 'Aryan Mehta';

-- Q5: Leaderboard - top users by swap count with skill count
SELECT u.fullName, u.swapCount,
       COUNT(DISTINCT s.id) AS total_skills
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName, u.swapCount
ORDER BY u.swapCount DESC;

-- Q6: Category popularity on the platform
SELECT category,
       SUM(CASE WHEN type='offering' THEN 1 ELSE 0 END) AS being_taught,
       SUM(CASE WHEN type='seeking'  THEN 1 ELSE 0 END) AS being_sought
FROM user_skills
GROUP BY category
ORDER BY being_taught DESC;

-- Q7: Contact messages received this year
SELECT name, email, subject, createdAt
FROM contacts
WHERE YEAR(createdAt) = 2025
ORDER BY createdAt DESC;
