USE skillswap_db;

-- ============================================================
-- DML: INSERT, UPDATE, DELETE
-- ============================================================

-- register a new user
INSERT INTO users (id, fullName, email, password, bio, swapCount)
VALUES ('USR01', 'Sample User', 'sample@skillswap.com', 'pass123', 'New user bio.', 0);

-- add skills for the user
INSERT INTO user_skills (user_id, type, name, category, level) VALUES ('USR01', 'offering', 'Python', 'Coding', 'Intermediate');
INSERT INTO user_skills (user_id, type, name, category, level) VALUES ('USR01', 'seeking',  'Figma',  'Design', 'Beginner');

-- add a portfolio link
INSERT INTO user_portfolio_links (user_id, label, url) VALUES ('USR01', 'GitHub', 'https://github.com/sampleuser');

-- update bio
UPDATE users SET bio = 'Updated bio for sample user.' WHERE id = 'USR01';

-- update swap status
UPDATE swaps SET status = 'accepted' WHERE id = 'S010';

-- delete a skill
DELETE FROM user_skills WHERE user_id = 'USR01' AND name = 'Figma';

-- delete the test user (cascades to skills and links)
DELETE FROM users WHERE id = 'USR01';


-- ============================================================
-- DQL: SELECT queries used by the application
-- ============================================================

-- login: find user by email and password
SELECT * FROM users WHERE email = 'aryan@example.com' AND password = 'pass123';

-- get user by id
SELECT * FROM users WHERE id = '1001';

-- get all skills for a user
SELECT id, type, name, category, level FROM user_skills WHERE user_id = '1001' ORDER BY type, category;

-- get portfolio links for a user
SELECT label, url FROM user_portfolio_links WHERE user_id = '1001';

-- get all sent swaps for a user via view
SELECT * FROM view_swap_details WHERE senderId = '1001';

-- get all received swaps for a user via view
SELECT * FROM view_swap_details WHERE recipientId = '1001';

-- get a single swap by id
SELECT * FROM view_swap_details WHERE id = 'S001';


-- ============================================================
-- JOINs
-- ============================================================

-- users with all their skills
SELECT u.fullName, s.type, s.name, s.category, s.level
FROM users u
INNER JOIN user_skills s ON u.id = s.user_id
ORDER BY u.fullName, s.type;

-- swap details with initiator and receiver names
SELECT sw.id, u1.fullName AS initiator, u2.fullName AS receiver,
       sw.offeredSkill, sw.soughtSkill, sw.status
FROM swaps sw
INNER JOIN users u1 ON sw.initiatorId = u1.id
INNER JOIN users u2 ON sw.receiverId  = u2.id;

-- all users with their portfolio links, including users with none
SELECT u.fullName, p.label, p.url
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
ORDER BY u.fullName;

-- users who have no portfolio links
SELECT u.fullName FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
WHERE p.id IS NULL;


-- ============================================================
-- GROUP BY and HAVING
-- ============================================================

-- number of skills per user
SELECT u.fullName, COUNT(s.id) AS total_skills
FROM users u
JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName
ORDER BY total_skills DESC;

-- skill count by category
SELECT category, COUNT(*) AS total FROM user_skills GROUP BY category ORDER BY total DESC;

-- swap count by status
SELECT status, COUNT(*) AS total FROM swaps GROUP BY status;

-- users who offer more than 1 skill
SELECT u.fullName, COUNT(s.id) AS offered
FROM users u JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering'
GROUP BY u.id, u.fullName
HAVING offered > 1;

-- categories with more than 3 skills total
SELECT category, COUNT(*) AS total FROM user_skills
GROUP BY category HAVING total > 3;


-- ============================================================
-- Subqueries
-- ============================================================

-- users who have sent at least one swap
SELECT fullName, email FROM users
WHERE id IN (SELECT DISTINCT initiatorId FROM swaps);

-- users who have never sent a swap
SELECT fullName, email FROM users
WHERE id NOT IN (SELECT DISTINCT initiatorId FROM swaps);

-- skills offered by users with more than 2 swaps
SELECT name, category, level FROM user_skills
WHERE type = 'offering'
AND user_id IN (SELECT id FROM users WHERE swapCount > 2);

-- users with above average swap count
SELECT fullName, swapCount FROM users
WHERE swapCount > (SELECT AVG(swapCount) FROM users);

-- derived table: total swaps initiated per user
SELECT fullName, swap_total FROM (
    SELECT u.fullName, COUNT(sw.id) AS swap_total
    FROM users u LEFT JOIN swaps sw ON u.id = sw.initiatorId
    GROUP BY u.id, u.fullName
) AS summary ORDER BY swap_total DESC;

-- perfect match: find user who offers Figma and wants React.js
SELECT DISTINCT u.fullName, u.email FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type = 'offering' AND name = 'Figma')
AND   u.id IN (SELECT user_id FROM user_skills WHERE type = 'seeking'  AND name = 'React.js');


-- ============================================================
-- Aggregate and Scalar Functions
-- ============================================================

SELECT COUNT(*)       AS total_users    FROM users;
SELECT AVG(swapCount) AS avg_swaps      FROM users;
SELECT MAX(swapCount) AS most_active    FROM users;
SELECT MIN(swapCount) AS least_active   FROM users;
SELECT SUM(swapCount) AS platform_total FROM users;
SELECT COUNT(*)       AS total_swaps    FROM swaps;

-- user with highest swap count
SELECT fullName, swapCount FROM users
WHERE swapCount = (SELECT MAX(swapCount) FROM users);

-- string functions
SELECT fullName, UPPER(fullName), LENGTH(fullName),
       CONCAT(fullName, ' <', email, '>') AS contact_info
FROM users;

-- date functions
SELECT fullName, createdAt,
       YEAR(createdAt)              AS join_year,
       DATEDIFF(NOW(), createdAt)   AS days_since_joined
FROM users;

-- category breakdown: how many teach vs want each skill
SELECT category,
       SUM(CASE WHEN type = 'offering' THEN 1 ELSE 0 END) AS being_taught,
       SUM(CASE WHEN type = 'seeking'  THEN 1 ELSE 0 END) AS being_sought
FROM user_skills
GROUP BY category ORDER BY being_taught DESC;
