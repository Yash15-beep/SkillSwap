USE skillswap_db;


-- show all tables and structure
SHOW TABLES;
DESC users;
DESC user_skills;
DESC swaps;
DESC contacts;
DESC user_portfolio_links;


-- DDL: add and remove a column to show ALTER works
ALTER TABLE users ADD COLUMN demo_col VARCHAR(50) DEFAULT 'test';
DESC users;
ALTER TABLE users DROP COLUMN demo_col;
DESC users;


-- DML: insert, update, delete a test row
INSERT INTO users (id, fullName, email, password, bio, swapCount)
VALUES ('DEMO01', 'Demo User', 'demo@skillswap.com', 'demo123', 'Temporary demo account.', 0);

SELECT id, fullName, email, swapCount FROM users WHERE id = 'DEMO01';

UPDATE users SET bio = 'Bio updated via DML.' WHERE id = 'DEMO01';

SELECT id, fullName, bio FROM users WHERE id = 'DEMO01';

DELETE FROM users WHERE id = 'DEMO01';

SELECT id FROM users WHERE id = 'DEMO01';


-- basic select queries
SELECT id, fullName, email, swapCount FROM users;

SELECT fullName, swapCount FROM users WHERE swapCount > 2 ORDER BY swapCount DESC;

SELECT fullName, email FROM users WHERE fullName LIKE '%a%';

SELECT fullName, swapCount FROM users ORDER BY swapCount DESC LIMIT 3;

SELECT id, initiatorId, receiverId, offeredSkill, soughtSkill, status FROM swaps WHERE status = 'pending';


-- transaction: shows ACID, savepoint and rollback
START TRANSACTION;

INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, status)
VALUES ('DEMO_SW', '1001', '1003', 'React.js', 'Guitar', 'TCL demo.', 'pending');

SAVEPOINT before_status_change;

UPDATE swaps SET status = 'accepted' WHERE id = 'DEMO_SW';

SELECT id, status FROM swaps WHERE id = 'DEMO_SW';

-- rollback to savepoint, status goes back to pending
ROLLBACK TO SAVEPOINT before_status_change;

SELECT id, status FROM swaps WHERE id = 'DEMO_SW';

COMMIT;

SELECT id, initiatorId, receiverId, status FROM swaps WHERE id = 'DEMO_SW';

DELETE FROM swaps WHERE id = 'DEMO_SW';


-- joins: users with their skills
SELECT u.fullName, s.type, s.name, s.category, s.level
FROM users u
INNER JOIN user_skills s ON u.id = s.user_id
ORDER BY u.fullName, s.type;

-- swap details with both user names
SELECT sw.id, u1.fullName AS initiator, u2.fullName AS receiver,
       sw.offeredSkill, sw.soughtSkill, sw.status
FROM swaps sw
INNER JOIN users u1 ON sw.initiatorId = u1.id
INNER JOIN users u2 ON sw.receiverId = u2.id;

-- left join: users and their portfolio links, including those with none
SELECT u.fullName, p.label, p.url
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
ORDER BY u.fullName;

-- users with no portfolio links
SELECT u.fullName
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
WHERE p.id IS NULL;


-- group by: skill count per user
SELECT u.fullName, COUNT(s.id) AS total_skills
FROM users u
JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName
ORDER BY total_skills DESC;

SELECT category, COUNT(*) AS skill_count FROM user_skills GROUP BY category ORDER BY skill_count DESC;

SELECT status, COUNT(*) AS total FROM swaps GROUP BY status;

-- having: only categories with more than 3 skills
SELECT category, COUNT(*) AS total FROM user_skills
GROUP BY category HAVING total > 3;

SELECT u.fullName, COUNT(s.id) AS offered
FROM users u JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering'
GROUP BY u.id, u.fullName HAVING offered > 1;


-- subqueries
SELECT fullName, email FROM users
WHERE id IN (SELECT DISTINCT initiatorId FROM swaps);

SELECT fullName, email FROM users
WHERE id NOT IN (SELECT DISTINCT initiatorId FROM swaps);

-- skills offered by active users
SELECT name, category, level FROM user_skills
WHERE type = 'offering'
AND user_id IN (SELECT id FROM users WHERE swapCount > 2);

-- users above average swap count
SELECT fullName, swapCount FROM users
WHERE swapCount > (SELECT AVG(swapCount) FROM users);

-- derived table: swap totals per user
SELECT fullName, swap_total FROM (
    SELECT u.fullName, COUNT(sw.id) AS swap_total
    FROM users u LEFT JOIN swaps sw ON u.id = sw.initiatorId
    GROUP BY u.id, u.fullName
) AS swap_summary ORDER BY swap_total DESC;


-- aggregate functions
SELECT COUNT(*) AS total_users FROM users;
SELECT AVG(swapCount) AS avg_swaps FROM users;
SELECT MAX(swapCount) AS most_active, MIN(swapCount) AS least_active FROM users;
SELECT COUNT(*) AS total_swaps FROM swaps;
SELECT SUM(swapCount) AS platform_total FROM users;

SELECT fullName, swapCount FROM users
WHERE swapCount = (SELECT MAX(swapCount) FROM users);


-- scalar functions: string and date
SELECT fullName, UPPER(fullName), LENGTH(fullName),
       CONCAT(fullName, ' <', email, '>') AS contact_info
FROM users;

SELECT fullName, createdAt, YEAR(createdAt) AS join_year,
       DATEDIFF(NOW(), createdAt) AS days_since_joined
FROM users;


-- views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

SELECT * FROM view_swap_details;

SELECT * FROM view_swap_details WHERE status = 'accepted';

SELECT * FROM view_swap_details WHERE senderName = 'Aryan Mehta' OR recipientName = 'Aryan Mehta';

SELECT * FROM view_user_summary ORDER BY swapCount DESC;


-- stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'skillswap_db';

CALL sp_search_users('Aryan', '');

CALL sp_search_users('', 'Coding');

-- this one runs a transaction internally
CALL sp_update_swap_status('S006', 'accepted');

SELECT id, fullName, swapCount FROM users WHERE id IN ('1006', '1007');

CALL sp_register_user('PROC01', 'Test Proc', 'proc@test.com', 'test123', 'via procedure', NULL);
SELECT id, fullName, email FROM users WHERE id = 'PROC01';
DELETE FROM users WHERE id = 'PROC01';


-- indexes: show them and use EXPLAIN to prove they are being used
SHOW INDEX FROM users;
SHOW INDEX FROM user_skills;
SHOW INDEX FROM swaps;

EXPLAIN SELECT * FROM users WHERE email = 'aryan@example.com';
EXPLAIN SELECT * FROM swaps WHERE status = 'pending';
EXPLAIN SELECT * FROM user_skills WHERE user_id = '1001';


-- normalization proof
-- 1NF: skills are atomic, each in its own row
SELECT * FROM user_skills WHERE user_id = '1001';

-- 2NF: user_skills has its own PK, all columns depend on it
DESC user_skills;

-- 3NF: portfolio links are separate, no transitive dependency
SELECT u.fullName, p.label, p.url
FROM users u JOIN user_portfolio_links p ON u.id = p.user_id;


-- keys via information schema
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db' AND CONSTRAINT_NAME = 'PRIMARY';

SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- email is unique so it acts as a candidate key
SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';


-- project queries used by the actual app
SELECT u.fullName, u.bio, u.swapCount,
       GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills_offering
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id AND s.type = 'offering'
GROUP BY u.id, u.fullName, u.bio, u.swapCount
ORDER BY u.swapCount DESC;

-- who can teach Python
SELECT DISTINCT u.fullName, u.email FROM users u
JOIN user_skills s ON u.id = s.user_id
WHERE s.type = 'offering' AND s.name = 'Python';

-- perfect match: offers Figma and wants React
SELECT DISTINCT u.fullName, u.email FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type='offering' AND name='Figma')
AND u.id IN (SELECT user_id FROM user_skills WHERE type='seeking' AND name='React.js');

-- category breakdown
SELECT category,
       SUM(CASE WHEN type='offering' THEN 1 ELSE 0 END) AS being_taught,
       SUM(CASE WHEN type='seeking' THEN 1 ELSE 0 END) AS being_sought
FROM user_skills GROUP BY category ORDER BY being_taught DESC;
