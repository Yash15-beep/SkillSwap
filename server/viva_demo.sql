-- ============================================================
--  SkillSwap DB  |  VIVA DEMONSTRATION SCRIPT
--  Run each section individually in MySQL Workbench
--  (select the block → Ctrl+Shift+Enter)
-- ============================================================

USE skillswap_db;


-- ============================================================
-- SECTION 1 : DDL  (Data Definition Language)
-- Silberschatz Ch-3 : CREATE, ALTER, DROP
-- ============================================================

-- 1a. Show all tables in the database
SHOW TABLES;

-- 1b. Describe table structures (schema design)
DESC users;
DESC user_skills;
DESC swaps;
DESC contacts;
DESC user_portfolio_links;

-- 1c. ALTER – add a temporary column
ALTER TABLE users ADD COLUMN demo_col VARCHAR(50) DEFAULT 'test';

-- 1d. Verify it was added
DESC users;

-- 1e. ALTER – drop the temporary column
ALTER TABLE users DROP COLUMN demo_col;

-- 1f. Show final clean structure
DESC users;


-- ============================================================
-- SECTION 2 : DML  (Data Manipulation Language)
-- Silberschatz Ch-3 : INSERT, UPDATE, DELETE
-- ============================================================

-- 2a. INSERT a temporary user
INSERT INTO users (id, fullName, email, password, bio, swapCount)
VALUES ('DEMO01', 'Demo User', 'demo@skillswap.com', 'demo123', 'Temporary demo account.', 0);

-- 2b. Verify insert
SELECT id, fullName, email, swapCount FROM users WHERE id = 'DEMO01';

-- 2c. UPDATE – change the bio
UPDATE users
SET bio = 'Bio updated via DML statement.'
WHERE id = 'DEMO01';

-- 2d. Verify update
SELECT id, fullName, bio FROM users WHERE id = 'DEMO01';

-- 2e. DELETE – remove the demo user
DELETE FROM users WHERE id = 'DEMO01';

-- 2f. Verify deletion
SELECT id FROM users WHERE id = 'DEMO01';   -- should return empty set


-- ============================================================
-- SECTION 3 : DQL  (Data Query Language)
-- Silberschatz Ch-3 : SELECT, WHERE, ORDER BY, LIKE, LIMIT
-- ============================================================

-- 3a. All users
SELECT id, fullName, email, swapCount FROM users;

-- 3b. Filter – users with swapCount > 2
SELECT fullName, swapCount
FROM users
WHERE swapCount > 2
ORDER BY swapCount DESC;

-- 3c. LIKE search – names containing 'a'
SELECT fullName, email
FROM users
WHERE fullName LIKE '%a%';

-- 3d. Top 3 most active users
SELECT fullName, swapCount
FROM users
ORDER BY swapCount DESC
LIMIT 3;

-- 3e. All pending swaps
SELECT id, initiatorId, receiverId, offeredSkill, soughtSkill, status
FROM swaps
WHERE status = 'pending';


-- ============================================================
-- SECTION 4 : TCL  (Transaction Control Language)
-- Silberschatz Ch-17 : ACID, START TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT
-- ============================================================

-- 4a. Start a transaction
START TRANSACTION;

-- 4b. Insert a swap inside the transaction
INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, status)
VALUES ('DEMO_SW', '1001', '1003', 'React.js', 'Guitar', 'TCL demo swap.', 'pending');

-- 4c. Set a savepoint
SAVEPOINT before_status_change;

-- 4d. Update the status
UPDATE swaps SET status = 'accepted' WHERE id = 'DEMO_SW';

-- 4e. Check current state (accepted)
SELECT id, status FROM swaps WHERE id = 'DEMO_SW';

-- 4f. ROLLBACK to savepoint (undo the status change only)
ROLLBACK TO SAVEPOINT before_status_change;

-- 4g. Check again – status is back to 'pending'
SELECT id, status FROM swaps WHERE id = 'DEMO_SW';

-- 4h. COMMIT – saves the insert with 'pending' status
COMMIT;

-- 4i. Confirm it is committed
SELECT id, initiatorId, receiverId, status FROM swaps WHERE id = 'DEMO_SW';

-- 4j. Clean up demo swap
DELETE FROM swaps WHERE id = 'DEMO_SW';


-- ============================================================
-- SECTION 5 : JOINS
-- Silberschatz Ch-4 : INNER JOIN, LEFT JOIN, multi-table JOIN
-- ============================================================

-- 5a. INNER JOIN – users with their skills
SELECT
    u.fullName,
    s.type,
    s.name        AS skill,
    s.category,
    s.level
FROM users u
INNER JOIN user_skills s ON u.id = s.user_id
ORDER BY u.fullName, s.type;

-- 5b. INNER JOIN – swaps with initiator and receiver names
SELECT
    sw.id,
    u1.fullName   AS initiator,
    u2.fullName   AS receiver,
    sw.offeredSkill,
    sw.soughtSkill,
    sw.status
FROM swaps sw
INNER JOIN users u1 ON sw.initiatorId = u1.id
INNER JOIN users u2 ON sw.receiverId  = u2.id;

-- 5c. LEFT JOIN – all users and their portfolio links (even if none)
SELECT
    u.fullName,
    p.label,
    p.url
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
ORDER BY u.fullName;

-- 5d. LEFT JOIN – users who have NO portfolio links
SELECT u.fullName
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
WHERE p.id IS NULL;


-- ============================================================
-- SECTION 6 : GROUP BY & HAVING
-- Silberschatz Ch-3
-- ============================================================

-- 6a. Number of skills per user
SELECT
    u.fullName,
    COUNT(s.id) AS total_skills
FROM users u
JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName
ORDER BY total_skills DESC;

-- 6b. Skill count by category
SELECT
    category,
    COUNT(*) AS skill_count
FROM user_skills
GROUP BY category
ORDER BY skill_count DESC;

-- 6c. Swap count by status
SELECT
    status,
    COUNT(*) AS total
FROM swaps
GROUP BY status;

-- 6d. HAVING – categories with more than 3 skills
SELECT
    category,
    COUNT(*) AS total
FROM user_skills
GROUP BY category
HAVING total > 3;

-- 6e. HAVING – users who offer more than 1 skill
SELECT
    u.fullName,
    COUNT(s.id) AS offered_count
FROM users u
JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering'
GROUP BY u.id, u.fullName
HAVING offered_count > 1;


-- ============================================================
-- SECTION 7 : SUBQUERIES
-- Silberschatz Ch-3 : nested SELECT, correlated subquery, derived table
-- ============================================================

-- 7a. Users who have initiated at least one swap
SELECT fullName, email
FROM users
WHERE id IN (SELECT DISTINCT initiatorId FROM swaps);

-- 7b. Users who have NEVER initiated a swap
SELECT fullName, email
FROM users
WHERE id NOT IN (SELECT DISTINCT initiatorId FROM swaps);

-- 7c. Skills offered by users with swapCount > 2
SELECT name, category, level
FROM user_skills
WHERE type = 'offering'
  AND user_id IN (SELECT id FROM users WHERE swapCount > 2);

-- 7d. Correlated subquery – users with above-average swap count
SELECT fullName, swapCount
FROM users
WHERE swapCount > (SELECT AVG(swapCount) FROM users);

-- 7e. Derived table – swap totals per user
SELECT fullName, swap_total
FROM (
    SELECT u.fullName, COUNT(sw.id) AS swap_total
    FROM users u
    LEFT JOIN swaps sw ON u.id = sw.initiatorId
    GROUP BY u.id, u.fullName
) AS swap_summary
ORDER BY swap_total DESC;


-- ============================================================
-- SECTION 8 : AGGREGATE FUNCTIONS
-- Silberschatz Ch-3 : COUNT, AVG, MAX, MIN, SUM
-- ============================================================

SELECT COUNT(*)        AS total_users   FROM users;
SELECT AVG(swapCount)  AS avg_swaps     FROM users;
SELECT MAX(swapCount)  AS most_active   FROM users;
SELECT MIN(swapCount)  AS least_active  FROM users;
SELECT COUNT(*)        AS total_swaps   FROM swaps;
SELECT SUM(swapCount)  AS platform_swaps FROM users;

-- User with the highest swap count
SELECT fullName, swapCount
FROM users
WHERE swapCount = (SELECT MAX(swapCount) FROM users);


-- ============================================================
-- SECTION 9 : SCALAR FUNCTIONS
-- Silberschatz Ch-5
-- ============================================================

-- String functions
SELECT
    fullName,
    UPPER(fullName)                        AS upper_name,
    LENGTH(fullName)                       AS name_length,
    CONCAT(fullName, ' <', email, '>')     AS contact_info,
    SUBSTRING(fullName, 1, 5)              AS short_name
FROM users;

-- Date functions
SELECT
    fullName,
    createdAt,
    YEAR(createdAt)                        AS join_year,
    MONTH(createdAt)                       AS join_month,
    DATEDIFF(NOW(), createdAt)             AS days_since_joined
FROM users;


-- ============================================================
-- SECTION 10 : VIEWS
-- Silberschatz Ch-4 : virtual relations
-- ============================================================

-- 10a. Show all views in the database
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 10b. Query view_swap_details (JOIN of swaps + users)
SELECT * FROM view_swap_details;

-- 10c. Filter the view – accepted swaps only
SELECT * FROM view_swap_details WHERE status = 'accepted';

-- 10d. Filter the view – all swaps involving Aryan Mehta
SELECT * FROM view_swap_details
WHERE senderName = 'Aryan Mehta'
   OR recipientName = 'Aryan Mehta';

-- 10e. Query view_user_summary (aggregate view)
SELECT * FROM view_user_summary ORDER BY swapCount DESC;


-- ============================================================
-- SECTION 11 : STORED PROCEDURES
-- Silberschatz Ch-5 : procedural SQL
-- ============================================================

-- 11a. Show all stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'skillswap_db';

-- 11b. Call sp_search_users – search by name keyword
CALL sp_search_users('Aryan', '');

-- 11c. Call sp_search_users – filter by category
CALL sp_search_users('', 'Coding');

-- 11d. Call sp_search_users – combined search
CALL sp_search_users('a', 'Design');

-- 11e. Call sp_update_swap_status – accept a pending swap (uses TRANSACTION inside)
--      S002 is currently pending
CALL sp_update_swap_status('S002', 'accepted');

-- 11f. Verify the status changed and swapCount incremented
SELECT id, fullName, swapCount FROM users WHERE id IN ('1002', '1006');
SELECT id, status FROM swaps WHERE id = 'S002';

-- 11g. Call sp_register_user – register a new user via procedure
CALL sp_register_user('PROC01', 'Procedure User', 'proc@test.com', 'test123', 'Created via stored procedure.', NULL);

-- 11h. Verify
SELECT id, fullName, email FROM users WHERE id = 'PROC01';

-- 11i. Clean up
DELETE FROM users WHERE id = 'PROC01';


-- ============================================================
-- SECTION 12 : INDEXING
-- Silberschatz Ch-14 : B+ tree indexes, search key
-- ============================================================

-- 12a. Show all indexes on each table
SHOW INDEX FROM users;
SHOW INDEX FROM user_skills;
SHOW INDEX FROM swaps;

-- 12b. EXPLAIN – show that email lookup uses the index (type = 'const')
EXPLAIN SELECT * FROM users WHERE email = 'aryan@example.com';

-- 12c. EXPLAIN – show that status filter uses idx_swaps_status
EXPLAIN SELECT * FROM swaps WHERE status = 'pending';

-- 12d. EXPLAIN – show that skill lookup uses idx_skills_user_id
EXPLAIN SELECT * FROM user_skills WHERE user_id = '1001';


-- ============================================================
-- SECTION 13 : NORMALIZATION
-- Silberschatz Ch-8 : 1NF, 2NF, 3NF
-- ============================================================

-- 13a. 1NF – all values are atomic; skills are NOT stored as a comma list in users
--      Each skill is its own row in user_skills
SELECT * FROM user_skills WHERE user_id = '1001';

-- 13b. 2NF – user_skills has its own PK (id); every non-key column
--      depends on the FULL primary key, not just part of it
DESC user_skills;

-- 13c. 3NF – no transitive dependency; portfolio links are in a
--      separate table, not derived from any non-key column in users
SELECT u.fullName, p.label, p.url
FROM users u
JOIN user_portfolio_links p ON u.id = p.user_id;


-- ============================================================
-- SECTION 14 : KEYS
-- Silberschatz Ch-2 : Primary Key, Foreign Key, Candidate Key
-- ============================================================

-- 14a. Primary keys across all tables
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND CONSTRAINT_NAME = 'PRIMARY';

-- 14b. Foreign key relationships
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 14c. Candidate key – email is UNIQUE, so it qualifies as a candidate key
SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';


-- ============================================================
-- SECTION 15 : PROJECT-SPECIFIC QUERIES  (Output Explanation)
-- These are the real queries the application uses
-- ============================================================

-- Q1. Discover page – all users with their offering skills (GROUP_CONCAT)
SELECT
    u.fullName,
    u.bio,
    u.swapCount,
    GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills_offering
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id AND s.type = 'offering'
GROUP BY u.id, u.fullName, u.bio, u.swapCount
ORDER BY u.swapCount DESC;

-- Q2. Find who can teach Python
SELECT DISTINCT u.fullName, u.email, u.swapCount
FROM users u
JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering' AND s.name = 'Python';

-- Q3. Perfect match – user who offers Figma AND wants React.js
SELECT DISTINCT u.fullName, u.email
FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type = 'offering' AND name = 'Figma')
  AND u.id IN (SELECT user_id FROM user_skills WHERE type = 'seeking'  AND name = 'React.js');

-- Q4. Category popularity – how many teach vs want each skill
SELECT
    category,
    SUM(CASE WHEN type = 'offering' THEN 1 ELSE 0 END) AS being_taught,
    SUM(CASE WHEN type = 'seeking'  THEN 1 ELSE 0 END) AS being_sought
FROM user_skills
GROUP BY category
ORDER BY being_taught DESC;

-- Q5. Leaderboard – top users by swap count
SELECT
    u.fullName,
    u.swapCount,
    COUNT(DISTINCT s.id) AS total_skills
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName, u.swapCount
ORDER BY u.swapCount DESC;
