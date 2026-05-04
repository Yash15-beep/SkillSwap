USE skillswap_db;

-- 1NF: all columns are atomic, no repeating groups
-- skills are stored one per row in user_skills, not as a comma list in users
SELECT * FROM user_skills WHERE user_id = '1001';

-- 2NF: no partial dependencies
-- user_skills has its own PK (id), every non-key column depends on the full key
DESC user_skills;

-- 3NF: no transitive dependencies
-- portfolio links are in a separate table, not derived from any non-key column in users
SELECT u.fullName, p.label, p.url
FROM users u JOIN user_portfolio_links p ON u.id = p.user_id;

-- primary keys across all tables
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db' AND CONSTRAINT_NAME = 'PRIMARY';

-- foreign key relationships
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- candidate key: email is unique so it qualifies as an alternate key
SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';
