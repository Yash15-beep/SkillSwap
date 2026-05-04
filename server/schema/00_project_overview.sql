-- SkillSwap - Project Overview
-- A skill exchange platform where users trade skills instead of money.
-- Users register, list skills they can teach and skills they want to learn,
-- then send swap requests to each other and agree on a schedule.
--
-- Tables:
--   users               - registered user accounts
--   user_skills         - skills each user offers or seeks (linked to users)
--   user_portfolio_links - external links on a user profile (linked to users)
--   swaps               - swap requests between two users (linked to users x2)
--   contacts            - contact form messages from visitors
--
-- The app is built with React (frontend) and Node.js + Express (backend).
-- All database logic uses raw MySQL - no ORM.
-- Stored procedures handle registration, swap status updates, and search.
-- Views are used by the Swaps and Discover pages.
-- Transactions ensure atomicity when accepting swaps (updates 2 tables).

USE skillswap_db;

-- quick sanity check: show all tables
SHOW TABLES;

-- row counts across all tables
SELECT 'users'               AS tbl, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'user_skills',                COUNT(*)          FROM user_skills
UNION ALL
SELECT 'user_portfolio_links',       COUNT(*)          FROM user_portfolio_links
UNION ALL
SELECT 'swaps',                      COUNT(*)          FROM swaps
UNION ALL
SELECT 'contacts',                   COUNT(*)          FROM contacts;
