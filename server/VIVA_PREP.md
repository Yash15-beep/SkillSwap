# SkillSwap — DBMS Viva Preparation Guide

---

## 1. Project Overview

**SkillSwap** is a skill exchange platform where users trade skills instead of money.
A user lists what they can teach and what they want to learn, then sends swap requests to other users.

**Tables:** `users`, `user_skills`, `user_portfolio_links`, `swaps`, `contacts`  
**Backend:** Node.js + Express using raw MySQL (no ORM)  
**DB Features used:** DDL, DML, DQL, TCL, Views, Stored Procedures, Indexes, Transactions

---

## 2. ER Diagram & Relationships

### All Relationships

| Relationship | Type | Why |
|---|---|---|
| users → user_skills | 1:N | One user can have many skills (offering + seeking) |
| users → user_portfolio_links | 1:N | One user can have many portfolio links |
| users → swaps (as initiator) | 1:N | One user can send many swap requests |
| users → swaps (as receiver) | 1:N | One user can receive many swap requests |
| contacts | Standalone | No relationship — just a contact form |

### Why these cardinalities?

- **users → user_skills (1:N):** A user like Aryan teaches React AND Node.js and wants to learn Figma AND UI/UX. That's 4 skills — one user, many rows. Storing them as a comma list in `users` would violate 1NF.
- **users → swaps (1:N twice):** The `swaps` table has TWO foreign keys to `users` — `initiatorId` and `receiverId`. This models a swap as a directed relationship between exactly two users. One user can initiate many swaps AND receive many swaps independently.
- **No M:N table:** There is no direct M:N between users and skills because the `user_skills` table already acts as the junction, with the added `type` column (offering/seeking) that carries meaning.

### Text ER Diagram

```
[users] 1 ----< [user_skills]
[users] 1 ----< [user_portfolio_links]
[users] 1 ----< [swaps] (initiatorId)
[users] 1 ----< [swaps] (receiverId)
[contacts]  (standalone)
```

### FK Verification Query

```sql
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 3. Schema Design

```sql
CREATE TABLE users (
    id        VARCHAR(255) PRIMARY KEY,
    fullName  VARCHAR(255) NOT NULL,
    email     VARCHAR(255) UNIQUE NOT NULL,
    password  VARCHAR(255) NOT NULL,
    bio       TEXT,
    avatarUrl VARCHAR(255),
    swapCount INT      DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_skills (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id  VARCHAR(255)               NOT NULL,
    type     ENUM('offering', 'seeking') NOT NULL,
    name     VARCHAR(255)               NOT NULL,
    category VARCHAR(255)               NOT NULL,
    level    VARCHAR(50)                NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE swaps (
    id               VARCHAR(255) PRIMARY KEY,
    initiatorId      VARCHAR(255) NOT NULL,
    receiverId       VARCHAR(255) NOT NULL,
    offeredSkill     VARCHAR(255) NOT NULL,
    soughtSkill      VARCHAR(255) NOT NULL,
    message          TEXT,
    proposedSchedule VARCHAR(255),
    status           ENUM('pending','accepted','rejected','completed') DEFAULT 'pending',
    createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (initiatorId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId)  REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. Normalization

### 1NF — First Normal Form
**Rule:** All columns must be atomic. No repeating groups.

**Proof:** Skills are NOT stored as a comma list inside `users`. Each skill is its own row in `user_skills`.

```sql
-- BAD (violates 1NF):
-- users: id | fullName | skills
--        1  | Aryan    | React.js, Node.js, Figma

-- GOOD (our design):
SELECT * FROM user_skills WHERE user_id = '1001';
-- Returns 4 separate rows, one per skill
```

### 2NF — Second Normal Form
**Rule:** No partial dependencies. Every non-key column must depend on the FULL primary key.

**Proof:** `user_skills` has its own PK (`id`). Columns like `name`, `category`, `level` all depend on that `id`, not just on `user_id` alone.

```sql
DESC user_skills;
-- id (PK), user_id (FK), type, name, category, level
-- 'name' depends on the skill row id, not partially on user_id
```

### 3NF — Third Normal Form
**Rule:** No transitive dependencies. Non-key columns must not depend on other non-key columns.

**Proof:** Portfolio links are in a separate table. They are NOT derived from `bio` or any other non-key column in `users`.

```sql
-- If links were in users: users.github_url depends on users.id (fine)
-- But if we had users.city and users.country_code where country_code -> country_name,
-- that would be transitive. We avoided this entirely.
SELECT u.fullName, p.label, p.url
FROM users u JOIN user_portfolio_links p ON u.id = p.user_id;
```

**Why not BCNF or 4NF?**
The schema is already in 3NF. Going to BCNF/4NF would require further decomposition that adds complexity to queries without meaningful benefit at this scale.

---

## 5. Keys

### Primary Keys
Every table has a PK. `users` and `swaps` use application-generated VARCHAR IDs. `user_skills`, `user_portfolio_links`, `contacts` use `AUTO_INCREMENT INT`.

```sql
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillswap_db' AND CONSTRAINT_NAME = 'PRIMARY';
```

### Foreign Keys
```sql
-- user_skills.user_id -> users.id  (ON DELETE CASCADE)
-- user_portfolio_links.user_id -> users.id  (ON DELETE CASCADE)
-- swaps.initiatorId -> users.id  (ON DELETE CASCADE)
-- swaps.receiverId  -> users.id  (ON DELETE CASCADE)
```

**ON DELETE CASCADE** means: if a user is deleted, all their skills, links, and swaps are automatically deleted too. This maintains referential integrity.

### Candidate Key
`email` in `users` is UNIQUE — it uniquely identifies a row and could serve as the primary key. It is a **candidate key** (alternate key).

```sql
SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';
-- Shows email with Non_unique = 0 (meaning it is unique)
```

---

## 6. Indexing Strategy

### All Indexes Created

```sql
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_skills_user_id   ON user_skills(user_id);
CREATE INDEX idx_skills_category  ON user_skills(category);
CREATE INDEX idx_swaps_initiator  ON swaps(initiatorId);
CREATE INDEX idx_swaps_receiver   ON swaps(receiverId);
CREATE INDEX idx_swaps_status     ON swaps(status);
```

### Index Type
MySQL InnoDB uses **B-Tree indexing** by default for all secondary indexes.

**Why B-Tree?**
- Efficient for both **equality** (`WHERE email = ?`) and **range** queries (`WHERE swapCount BETWEEN 1 AND 5`)
- Supports `ORDER BY` and `GROUP BY` optimizations
- O(log n) lookup time

### Why each column was indexed

| Index | Reason |
|---|---|
| `users.email` | Used in every login query — `WHERE email = ? AND password = ?`. Without this, MySQL scans all rows. |
| `user_skills.user_id` | Every profile load does `WHERE user_id = ?`. This is the most frequent JOIN column. |
| `user_skills.category` | The Discover page filters by category — `WHERE category = 'Coding'`. |
| `swaps.initiatorId` | Swap dashboard fetches all sent swaps — `WHERE initiatorId = ?`. |
| `swaps.receiverId` | Swap dashboard fetches all received swaps — `WHERE receiverId = ?`. |
| `swaps.status` | Filtering pending/accepted swaps — `WHERE status = 'pending'`. |

### Proof indexes are used (EXPLAIN)

```sql
EXPLAIN SELECT * FROM users WHERE email = 'aryan@example.com';
-- key = idx_users_email, type = const, rows = 1

EXPLAIN SELECT * FROM swaps WHERE status = 'pending';
-- key = idx_swaps_status

EXPLAIN SELECT * FROM user_skills WHERE user_id = '1001';
-- key = idx_skills_user_id
```

---

## 7. Views

### view_swap_details
```sql
CREATE OR REPLACE VIEW view_swap_details AS
    SELECT
        sw.id,
        sw.initiatorId  AS senderId,
        sw.receiverId   AS recipientId,
        u1.fullName     AS senderName,
        u2.fullName     AS recipientName,
        sw.offeredSkill AS skillOffered,
        sw.soughtSkill  AS skillRequested,
        sw.message,
        sw.proposedSchedule,
        sw.status,
        sw.createdAt
    FROM swaps sw
    JOIN users u1 ON sw.initiatorId = u1.id
    JOIN users u2 ON sw.receiverId  = u2.id;
```

**Why this view?**
The Swaps page needs human-readable names (not just IDs). Without this view, the app would need two extra queries per swap to resolve names. The view bakes the JOIN in once.

**Why these columns?** `password`, `bio`, `avatarUrl` are excluded — the Swaps page has no use for them and exposing passwords in a view is a security risk.

### view_user_summary
```sql
CREATE OR REPLACE VIEW view_user_summary AS
    SELECT
        u.id, u.fullName, u.email, u.bio, u.avatarUrl, u.swapCount, u.createdAt,
        COUNT(DISTINCT CASE WHEN s.type = 'offering' THEN s.id END) AS offeringCount,
        COUNT(DISTINCT CASE WHEN s.type = 'seeking'  THEN s.id END) AS seekingCount
    FROM users u
    LEFT JOIN user_skills s ON u.id = s.user_id
    GROUP BY u.id, u.fullName, u.email, u.bio, u.avatarUrl, u.swapCount, u.createdAt;
```

**Why this view?**
The Discover page shows a summary card per user with skill counts. This view pre-aggregates the counts so the app doesn't need to run a GROUP BY every time.

**Why LEFT JOIN here?** Because a user with zero skills should still appear on the Discover page. An INNER JOIN would hide them.

---

## 8. Stored Procedures

### sp_register_user
```sql
CREATE PROCEDURE sp_register_user(
    IN p_id VARCHAR(255), IN p_fullName VARCHAR(255),
    IN p_email VARCHAR(255), IN p_password VARCHAR(255),
    IN p_bio TEXT, IN p_avatarUrl VARCHAR(255)
)
BEGIN
    INSERT INTO users (id, fullName, email, password, bio, avatarUrl)
    VALUES (p_id, p_fullName, p_email, p_password, p_bio, p_avatarUrl);
    SELECT * FROM users WHERE id = p_id;
END
```
**Why?** Encapsulates INSERT + SELECT in one DB call. The app just calls `CALL sp_register_user(...)`.

### sp_update_swap_status
```sql
CREATE PROCEDURE sp_update_swap_status(IN p_swapId VARCHAR(255), IN p_status VARCHAR(50))
BEGIN
    DECLARE v_initiatorId VARCHAR(255);
    DECLARE v_receiverId  VARCHAR(255);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
        UPDATE swaps SET status = p_status WHERE id = p_swapId;
        IF p_status = 'accepted' THEN
            SELECT initiatorId, receiverId INTO v_initiatorId, v_receiverId
            FROM swaps WHERE id = p_swapId;
            UPDATE users SET swapCount = swapCount + 1
            WHERE id IN (v_initiatorId, v_receiverId);
        END IF;
    COMMIT;

    SELECT * FROM view_swap_details WHERE id = p_swapId;
END
```
**Why?** This touches TWO tables. Wrapping in a transaction guarantees atomicity — if the `users` update fails, the `swaps` update also rolls back.

### sp_search_users
```sql
CREATE PROCEDURE sp_search_users(IN p_search VARCHAR(255), IN p_category VARCHAR(255))
BEGIN
    SELECT DISTINCT u.id, u.fullName, u.email, u.bio, u.avatarUrl, u.swapCount, u.createdAt
    FROM users u
    LEFT JOIN user_skills s ON u.id = s.user_id
    WHERE
        (p_search = '' OR u.fullName LIKE CONCAT('%', p_search, '%')
                       OR u.bio      LIKE CONCAT('%', p_search, '%'))
        AND
        (p_category = '' OR p_category = 'All' OR s.category = p_category)
    ORDER BY u.swapCount DESC;
END
```
**Why?** Moves search logic from JavaScript into SQL. The DB engine can use indexes and optimize the query plan. `DISTINCT` prevents duplicate rows when a user has multiple skills in the same category.

---

## 9. Transactions (ACID)

### ACID in this project

| Property | How it's implemented |
|---|---|
| **Atomicity** | `sp_update_swap_status` wraps two UPDATEs in one transaction — both succeed or both roll back |
| **Consistency** | FK constraints prevent orphan records. ENUM on `status` prevents invalid values |
| **Isolation** | MySQL InnoDB default isolation level (REPEATABLE READ) handles concurrent swaps |
| **Durability** | InnoDB writes to disk on COMMIT — data survives crashes |

### Transaction Example

```sql
START TRANSACTION;

INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, status)
VALUES ('TXN001', '1001', '1002', 'React.js', 'Figma', 'Demo', 'pending');

SAVEPOINT before_status_change;

UPDATE swaps SET status = 'accepted' WHERE id = 'TXN001';

-- something went wrong, undo just the status change
ROLLBACK TO SAVEPOINT before_status_change;

-- swap is still inserted but status is pending
COMMIT;
```

---

## 10. Join Logic

### INNER JOIN — used when both sides must exist

```sql
-- swap details: only show swaps where BOTH users exist
SELECT sw.id, u1.fullName AS initiator, u2.fullName AS receiver
FROM swaps sw
INNER JOIN users u1 ON sw.initiatorId = u1.id
INNER JOIN users u2 ON sw.receiverId  = u2.id;
```
**Why INNER?** If either user was deleted (and cascade didn't fire), we don't want a broken row showing up. INNER JOIN naturally excludes it.

### LEFT JOIN — used when the left side must always appear

```sql
-- all users with their links, even users with no links
SELECT u.fullName, p.label, p.url
FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id;
```
**Why LEFT?** We want every user to appear on the Discover page regardless of whether they have portfolio links. An INNER JOIN would hide users with no links.

```sql
-- users with NO portfolio links (NULL check after LEFT JOIN)
SELECT u.fullName FROM users u
LEFT JOIN user_portfolio_links p ON u.id = p.user_id
WHERE p.id IS NULL;
```

---

## 11. Group By & Having

```sql
-- skill count per user
SELECT u.fullName, COUNT(s.id) AS total_skills
FROM users u JOIN user_skills s ON u.id = s.user_id
GROUP BY u.id, u.fullName;

-- HAVING: only categories with more than 3 skills
SELECT category, COUNT(*) AS total FROM user_skills
GROUP BY category HAVING total > 3;
```

**GROUP BY vs WHERE:** `WHERE` filters rows before grouping. `HAVING` filters groups after aggregation. You cannot use `HAVING total > 3` as `WHERE total > 3` because `total` doesn't exist before the GROUP BY runs.

---

## 12. Subqueries

### IN subquery
```sql
-- users who have sent at least one swap
SELECT fullName FROM users
WHERE id IN (SELECT DISTINCT initiatorId FROM swaps);
```

### NOT IN subquery
```sql
-- users who have never sent a swap
SELECT fullName FROM users
WHERE id NOT IN (SELECT DISTINCT initiatorId FROM swaps);
```

### Correlated subquery
```sql
-- users with above average swap count
SELECT fullName, swapCount FROM users
WHERE swapCount > (SELECT AVG(swapCount) FROM users);
```

### Derived table (subquery in FROM)
```sql
SELECT fullName, swap_total FROM (
    SELECT u.fullName, COUNT(sw.id) AS swap_total
    FROM users u LEFT JOIN swaps sw ON u.id = sw.initiatorId
    GROUP BY u.id, u.fullName
) AS summary ORDER BY swap_total DESC;
```

**Why subquery vs JOIN here?** The derived table pre-aggregates swap counts before the outer query sorts them. Doing this in a single JOIN + GROUP BY would work too, but the derived table makes the intent clearer.

### Double subquery (perfect match)
```sql
SELECT DISTINCT u.fullName FROM users u
WHERE u.id IN (SELECT user_id FROM user_skills WHERE type='offering' AND name='Figma')
  AND u.id IN (SELECT user_id FROM user_skills WHERE type='seeking'  AND name='React.js');
```
**Why two subqueries instead of a self-join?** A self-join on `user_skills` would require joining the table to itself with two aliases and complex ON conditions. Two `IN` subqueries are cleaner and easier to read and explain.

---

## 13. Aggregate & Scalar Functions

### Aggregate
```sql
SELECT COUNT(*)       AS total_users    FROM users;
SELECT AVG(swapCount) AS avg_swaps      FROM users;
SELECT MAX(swapCount) AS most_active    FROM users;
SELECT MIN(swapCount) AS least_active   FROM users;
SELECT SUM(swapCount) AS platform_total FROM users;
```

### Scalar
```sql
SELECT UPPER(fullName), LENGTH(fullName),
       CONCAT(fullName, ' <', email, '>') AS contact_info
FROM users;

SELECT YEAR(createdAt), DATEDIFF(NOW(), createdAt) AS days_since_joined
FROM users;
```

### CASE inside aggregate (used in view)
```sql
COUNT(DISTINCT CASE WHEN s.type = 'offering' THEN s.id END) AS offeringCount
```
**Why?** This counts only offering-type skills without needing a subquery or separate GROUP BY.

---

## 14. 10 Tough Viva Questions & Answers

**Q1. Your `swaps` table has two foreign keys both pointing to `users`. How does MySQL handle this?**

MySQL treats them as two independent FK constraints. Each one is checked separately on INSERT and UPDATE. Both use `ON DELETE CASCADE`, so deleting a user removes all swaps where they were either the initiator or receiver.

---

**Q2. Why did you use VARCHAR(255) as the primary key for `users` instead of INT AUTO_INCREMENT?**

The ID is generated in the application layer using `Date.now()` (a timestamp in milliseconds). This avoids a round-trip to the DB to get the generated ID before inserting related records. The tradeoff is slightly more storage than INT, but at this scale it's negligible.

---

**Q3. What happens if two users try to accept the same swap simultaneously?**

InnoDB's default isolation level is REPEATABLE READ. The `sp_update_swap_status` procedure wraps the update in a transaction. The second concurrent transaction will wait for the first to COMMIT before it can read the updated status, preventing a double-accept scenario.

---

**Q4. Your `view_user_summary` uses LEFT JOIN. What would change if you used INNER JOIN?**

Users with zero skills would disappear from the view. The Discover page would not show newly registered users who haven't added skills yet. LEFT JOIN ensures all users appear, with NULL counts for those with no skills.

---

**Q5. Prove that your database is in 3NF.**

- **1NF:** All columns are atomic. Skills are in a separate table, not a comma list.
- **2NF:** Every non-key column in every table depends on the full primary key, not a partial key.
- **3NF:** No transitive dependencies. Example — `user_skills.category` depends on the skill row's `id`, not on `user_id` or `fullName`.

There is no column A → column B → column C chain anywhere in the schema.

---

**Q6. What is the difference between DELETE CASCADE and DELETE RESTRICT? Which did you use and why?**

- `ON DELETE CASCADE`: deleting a parent row automatically deletes all child rows.
- `ON DELETE RESTRICT`: prevents deletion of a parent row if child rows exist.

We used CASCADE because deleting a user should clean up all their data (skills, links, swaps). RESTRICT would force the app to manually delete child records first, which is error-prone.

---

**Q7. Why did you create an index on `swaps.status` when it has only 4 possible values?**

Low cardinality indexes are generally less efficient, but `status = 'pending'` is the most frequent filter in the app (the swap dashboard always loads pending swaps first). MySQL's query optimizer will use the index when the filtered result set is small relative to the total rows. As swap volume grows, this index becomes increasingly valuable.

---

**Q8. What is the purpose of SAVEPOINT in your transaction demo?**

SAVEPOINT creates a named checkpoint within a transaction. `ROLLBACK TO SAVEPOINT` undoes only the work done after that point, without rolling back the entire transaction. This is useful when you want to undo a specific step (like a status update) while keeping earlier inserts (like the swap record itself).

---

**Q9. Could you replace your stored procedures with just application-level code? Why did you choose SQL procedures?**

Yes, technically. But stored procedures have advantages:
1. Logic lives in the DB — any client (not just this Node app) gets the same behavior.
2. Reduced network round-trips — one `CALL` instead of multiple queries.
3. The transaction in `sp_update_swap_status` is atomic at the DB level, not dependent on the app staying connected.

---

**Q10. Your `sp_search_users` uses `LIKE '%search%'`. Will the index on `fullName` be used?**

No. A leading wildcard (`LIKE '%aryan%'`) prevents index usage because the B-Tree index is sorted by the start of the string. MySQL cannot use it when the match can start anywhere. For this project scale it's acceptable. In production, a FULLTEXT index on `fullName` and `bio` would be the correct solution.

---

## 15. Quick Tips for Tomorrow

- **"Why" beats "What":** Don't just say "I used INNER JOIN." Say "I used INNER JOIN because I only want swaps where both users exist — if either was deleted, I don't want a broken row displayed."

- **Normalization defence:** If asked why not BCNF — "The schema is already in 3NF. BCNF would require further decomposition that adds JOIN complexity without meaningful benefit at this scale."

- **B-Tree default:** MySQL InnoDB uses B-Tree for all indexes by default. B-Tree is efficient for both equality (`=`) and range queries (`BETWEEN`, `>`, `<`). Hash indexes only support equality.

- **ACID in one line:** "Atomicity = all or nothing. Consistency = constraints always hold. Isolation = transactions don't interfere. Durability = committed data survives crashes."

- **Views are not stored data:** A view is a saved query, not a table. Every time you `SELECT * FROM view_swap_details`, MySQL runs the underlying JOIN query fresh.

- **CASCADE is your friend:** Explain that `ON DELETE CASCADE` on all FK constraints means the DB self-cleans — no orphan records possible.
