USE skillswap_db;

-- Q1: Discover page - all users with their offering skills
-- Output: one row per user, skills concatenated, sorted by most active
SELECT
    u.fullName,
    u.bio,
    u.swapCount,
    GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills_offering
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id AND s.type = 'offering'
GROUP BY u.id, u.fullName, u.bio, u.swapCount
ORDER BY u.swapCount DESC;
-- expected: 8 rows, Sneha Patel at top (swapCount=5), skills listed per user


-- Q2: Login query - find user by email (uses idx_users_email index)
-- Output: the matching user row, or empty set if wrong credentials
SELECT id, fullName, email, swapCount
FROM users
WHERE email = 'aryan@example.com' AND password = 'pass123';
-- expected: 1 row - Aryan Mehta


-- Q3: Swap dashboard - all swaps for a user (sent + received) via view
-- Output: swap rows with human-readable sender/receiver names
SELECT * FROM view_swap_details
WHERE senderName = 'Aryan Mehta' OR recipientName = 'Aryan Mehta';
-- expected: 4 rows (S001 sent, S003 received, S008 received, S009 sent)


-- Q4: Search by category - find all Coding users (calls sp_search_users)
-- Output: distinct users who have any Coding skill
CALL sp_search_users('', 'Coding');
-- expected: users like Aryan, Priya, Ananya, Dev, Rohan, Meera


-- Q5: Accept a swap - updates status and both users swap counts atomically
-- Output: updated swap row from view_swap_details
CALL sp_update_swap_status('S010', 'accepted');
-- expected: S010 status = accepted, Karan and Rohan swapCount incremented


-- Q6: Perfect match - who offers what I want and wants what I offer
-- Output: users who offer Figma AND seek React.js
SELECT DISTINCT u.fullName, u.email FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type='offering' AND name='Figma')
  AND u.id IN (SELECT user_id FROM user_skills WHERE type='seeking'  AND name='React.js');
-- expected: Priya Sharma


-- Q7: Platform stats - category popularity
-- Output: each category with count of teachers vs learners
SELECT
    category,
    SUM(CASE WHEN type='offering' THEN 1 ELSE 0 END) AS being_taught,
    SUM(CASE WHEN type='seeking'  THEN 1 ELSE 0 END) AS being_sought
FROM user_skills
GROUP BY category ORDER BY being_taught DESC;
-- expected: Coding is most popular on both sides


-- Q8: Leaderboard - top users by swap count with skill count
-- Output: all users ranked by activity
SELECT u.fullName, u.swapCount,
       COUNT(DISTINCT s.id) AS total_skills
FROM users u
LEFT JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName, u.swapCount
ORDER BY u.swapCount DESC;
-- expected: Sneha Patel at top with swapCount=5


-- Q9: EXPLAIN - prove indexes are being used
-- Output: type=const means index lookup, not full table scan
EXPLAIN SELECT * FROM users WHERE email = 'aryan@example.com';
-- expected: key = idx_users_email, rows = 1

EXPLAIN SELECT * FROM swaps WHERE status = 'pending';
-- expected: key = idx_swaps_status

EXPLAIN SELECT * FROM user_skills WHERE user_id = '1001';
-- expected: key = idx_skills_user_id
