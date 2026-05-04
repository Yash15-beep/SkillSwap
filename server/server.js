import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Connection Pool
// ---------------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true   // needed for procedure calls that return result sets
});

// ---------------------------------------------------------------------------
// DB INITIALISATION  (DDL + Indexes + Views + Stored Procedures)
// ---------------------------------------------------------------------------
async function initDb() {
  try {
    // ── 1. Create database if missing ──────────────────────────────────────
    const boot = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    await boot.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await boot.end();
    console.log('Database checked/created.');

    // ── 2. DDL – Tables ────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         VARCHAR(255) PRIMARY KEY,
        fullName   VARCHAR(255) NOT NULL,
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        bio        TEXT,
        avatarUrl  VARCHAR(255),
        swapCount  INT          DEFAULT 0,
        createdAt  DATETIME     DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id       INT AUTO_INCREMENT PRIMARY KEY,
        user_id  VARCHAR(255)              NOT NULL,
        type     ENUM('offering','seeking') NOT NULL,
        name     VARCHAR(255)              NOT NULL,
        category VARCHAR(255)              NOT NULL,
        level    VARCHAR(50)               NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_portfolio_links (
        id      INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        label   VARCHAR(255) NOT NULL,
        url     VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS swaps (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        name      VARCHAR(255) NOT NULL,
        email     VARCHAR(255) NOT NULL,
        subject   VARCHAR(255) NOT NULL,
        message   TEXT         NOT NULL,
        createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables checked/created.');

    // ── 3. INDEXING ────────────────────────────────────────────────────────
    // Silberschatz Ch-14: indexes speed up search on non-PK columns.
    // We index columns that appear frequently in WHERE / JOIN clauses.
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
        ON users(email)
    `).catch(() => {});   // ignore if already exists (older MySQL)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_skills_user_id
        ON user_skills(user_id)
    `).catch(() => {});

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_skills_category
        ON user_skills(category)
    `).catch(() => {});

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_swaps_initiator
        ON swaps(initiatorId)
    `).catch(() => {});

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_swaps_receiver
        ON swaps(receiverId)
    `).catch(() => {});

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_swaps_status
        ON swaps(status)
    `).catch(() => {});

    console.log('Indexes checked/created.');

    // ── 4. VIEWS ───────────────────────────────────────────────────────────
    // Silberschatz Ch-4: a view is a virtual relation defined by a query.

    // View 1 – full swap details with human-readable names (used by Swaps page)
    await pool.query(`
      CREATE OR REPLACE VIEW view_swap_details AS
        SELECT
          sw.id,
          sw.initiatorId                AS senderId,
          sw.receiverId                 AS recipientId,
          u1.fullName                   AS senderName,
          u2.fullName                   AS recipientName,
          sw.offeredSkill               AS skillOffered,
          sw.soughtSkill                AS skillRequested,
          sw.message,
          sw.proposedSchedule,
          sw.status,
          sw.createdAt
        FROM swaps sw
        JOIN users u1 ON sw.initiatorId = u1.id
        JOIN users u2 ON sw.receiverId  = u2.id
    `);

    // View 2 – user profile summary with skill counts (used by Discover page)
    await pool.query(`
      CREATE OR REPLACE VIEW view_user_summary AS
        SELECT
          u.id,
          u.fullName,
          u.email,
          u.bio,
          u.avatarUrl,
          u.swapCount,
          u.createdAt,
          COUNT(DISTINCT CASE WHEN s.type = 'offering' THEN s.id END) AS offeringCount,
          COUNT(DISTINCT CASE WHEN s.type = 'seeking'  THEN s.id END) AS seekingCount
        FROM users u
        LEFT JOIN user_skills s ON u.id = s.user_id
        GROUP BY u.id, u.fullName, u.email, u.bio, u.avatarUrl, u.swapCount, u.createdAt
    `);

    console.log('Views checked/created.');

    // ── 5. STORED PROCEDURES ───────────────────────────────────────────────
    // Silberschatz Ch-5: stored procedures encapsulate business logic in the DB.

    // Procedure 1 – register a new user (wraps INSERT + SELECT in one call)
    await pool.query(`DROP PROCEDURE IF EXISTS sp_register_user`);
    await pool.query(`
      CREATE PROCEDURE sp_register_user(
        IN  p_id        VARCHAR(255),
        IN  p_fullName  VARCHAR(255),
        IN  p_email     VARCHAR(255),
        IN  p_password  VARCHAR(255),
        IN  p_bio       TEXT,
        IN  p_avatarUrl VARCHAR(255)
      )
      BEGIN
        INSERT INTO users (id, fullName, email, password, bio, avatarUrl)
        VALUES (p_id, p_fullName, p_email, p_password, p_bio, p_avatarUrl);

        SELECT * FROM users WHERE id = p_id;
      END
    `);

    // Procedure 2 – accept/reject a swap using a TRANSACTION
    // Silberschatz Ch-17 (ACID): both the status update AND the swapCount
    // increment must succeed together, or both must roll back.
    await pool.query(`DROP PROCEDURE IF EXISTS sp_update_swap_status`);
    await pool.query(`
      CREATE PROCEDURE sp_update_swap_status(
        IN p_swapId VARCHAR(255),
        IN p_status VARCHAR(50)
      )
      BEGIN
        DECLARE v_initiatorId VARCHAR(255);
        DECLARE v_receiverId  VARCHAR(255);
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;

        START TRANSACTION;

          UPDATE swaps SET status = p_status WHERE id = p_swapId;

          IF p_status = 'accepted' THEN
            SELECT initiatorId, receiverId
              INTO v_initiatorId, v_receiverId
              FROM swaps WHERE id = p_swapId;

            UPDATE users
               SET swapCount = swapCount + 1
             WHERE id IN (v_initiatorId, v_receiverId);
          END IF;

        COMMIT;

        -- Return the updated swap row via the view
        SELECT * FROM view_swap_details WHERE id = p_swapId;
      END
    `);

    // Procedure 3 – search users by name/bio/category using SQL (not JS)
    await pool.query(`DROP PROCEDURE IF EXISTS sp_search_users`);
    await pool.query(`
      CREATE PROCEDURE sp_search_users(
        IN p_search   VARCHAR(255),
        IN p_category VARCHAR(255)
      )
      BEGIN
        SELECT DISTINCT
          u.id, u.fullName, u.email, u.bio,
          u.avatarUrl, u.swapCount, u.createdAt
        FROM users u
        LEFT JOIN user_skills s ON u.id = s.user_id
        WHERE
          (p_search   = '' OR u.fullName LIKE CONCAT('%', p_search, '%')
                           OR u.bio      LIKE CONCAT('%', p_search, '%'))
          AND
          (p_category = '' OR p_category = 'All'
                           OR s.category = p_category)
        ORDER BY u.swapCount DESC;
      END
    `);

    console.log('Stored procedures checked/created.');
    console.log('--- DB initialisation complete ---');

  } catch (error) {
    console.error('DB initialisation failed:', error);
  }
}

initDb();

// ---------------------------------------------------------------------------
// HELPER – fetch skills + links for a user and attach them
// ---------------------------------------------------------------------------
const attachSkillsAndLinks = async (user) => {
  // JOIN query instead of two separate selects
  const [skills] = await pool.query(
    `SELECT id, user_id, type, name, category, level
       FROM user_skills
      WHERE user_id = ?
      ORDER BY type, category`,
    [user.id]
  );
  const [links] = await pool.query(
    `SELECT id, user_id, label, url
       FROM user_portfolio_links
      WHERE user_id = ?`,
    [user.id]
  );
  return {
    ...user,
    skillsOffering: skills.filter(s => s.type === 'offering'),
    skillsSeeking:  skills.filter(s => s.type === 'seeking'),
    portfolioLinks: links
  };
};

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

// ── AUTH ────────────────────────────────────────────────────────────────────

// POST /api/auth/register  – calls sp_register_user stored procedure
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, bio, avatarUrl } = req.body;
  try {
    const id = Date.now().toString();
    // Use stored procedure for registration
    const [results] = await pool.query(
      `CALL sp_register_user(?, ?, ?, ?, ?, ?)`,
      [id, fullName, email, password, bio || null, avatarUrl || null]
    );
    const user = results[0][0];
    res.json({ token: `mock-jwt-${id}`, user: await attachSkillsAndLinks(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // DQL with WHERE on indexed email column
    const [users] = await pool.query(
      `SELECT * FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );
    if (users.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: `mock-jwt-${users[0].id}`, user: await attachSkillsAndLinks(users[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token?.startsWith('mock-jwt-'))
    return res.status(401).json({ error: 'Unauthorized' });

  const userId = token.replace('mock-jwt-', '');
  try {
    const [users] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (users.length === 0) return res.status(401).json({ error: 'User not found' });
    res.json({ user: await attachSkillsAndLinks(users[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── USERS ───────────────────────────────────────────────────────────────────

// GET /api/users  – calls sp_search_users stored procedure (SQL-level search)
app.get('/api/users', async (req, res) => {
  const search   = req.query.search   || '';
  const category = req.query.category || '';
  try {
    // Stored procedure handles LIKE search + category filter entirely in SQL
    const [results] = await pool.query(
      `CALL sp_search_users(?, ?)`,
      [search, category]
    );
    const users = results[0];
    const formatted = await Promise.all(users.map(u => attachSkillsAndLinks(u)));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id  – uses view_user_summary + JOIN for skills
app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT * FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(await attachSkillsAndLinks(users[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id  – updates profile + replaces skills, wrapped in TRANSACTION (TCL)
app.put('/api/users/:id', async (req, res) => {
  const { fullName, bio, avatarUrl, skillsOffering, skillsSeeking } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();                          // TCL: START TRANSACTION

    // Update core profile fields
    await conn.query(
      `UPDATE users SET fullName = ?, bio = ?, avatarUrl = ? WHERE id = ?`,
      [fullName, bio, avatarUrl, req.params.id]
    );

    // If skills were sent, replace them entirely
    if (skillsOffering !== undefined || skillsSeeking !== undefined) {
      // Delete existing skills for this user
      await conn.query(`DELETE FROM user_skills WHERE user_id = ?`, [req.params.id]);

      // Re-insert offering skills
      if (skillsOffering && skillsOffering.length > 0) {
        for (const skill of skillsOffering) {
          await conn.query(
            `INSERT INTO user_skills (user_id, type, name, category, level) VALUES (?, 'offering', ?, ?, ?)`,
            [req.params.id, skill.name, skill.category, skill.level]
          );
        }
      }

      // Re-insert seeking skills
      if (skillsSeeking && skillsSeeking.length > 0) {
        for (const skill of skillsSeeking) {
          await conn.query(
            `INSERT INTO user_skills (user_id, type, name, category, level) VALUES (?, 'seeking', ?, ?, ?)`,
            [req.params.id, skill.name, skill.category, skill.level]
          );
        }
      }
    }

    await conn.commit();                                    // TCL: COMMIT

    const [users] = await conn.query(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    res.json(await attachSkillsAndLinks(users[0]));
  } catch (error) {
    await conn.rollback();                                  // TCL: ROLLBACK on error
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// ── SWAPS ───────────────────────────────────────────────────────────────────

// POST /api/swaps  – INSERT wrapped in TRANSACTION
app.post('/api/swaps', async (req, res) => {
  const { senderId, recipientId, offeredSkill, soughtSkill, message, proposedSchedule } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();                          // TCL: START TRANSACTION

    const id = Date.now().toString();
    await conn.query(
      `INSERT INTO swaps
         (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, proposedSchedule)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, senderId, recipientId, offeredSkill, soughtSkill, message, proposedSchedule || null]
    );

    await conn.commit();                                    // TCL: COMMIT

    // Return via view (JOIN already baked in)
    const [rows] = await conn.query(
      `SELECT * FROM view_swap_details WHERE id = ?`, [id]
    );
    res.json(rows[0]);
  } catch (error) {
    await conn.rollback();                                  // TCL: ROLLBACK on error
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// GET /api/swaps/user/:userId  – uses view_swap_details (JOIN-based view)
app.get('/api/swaps/user/:userId', async (req, res) => {
  try {
    // Query the view – no JS-level merging needed, JOIN is in the view
    const [sent] = await pool.query(
      `SELECT * FROM view_swap_details WHERE senderId = ?`,
      [req.params.userId]
    );
    const [received] = await pool.query(
      `SELECT * FROM view_swap_details WHERE recipientId = ?`,
      [req.params.userId]
    );
    res.json({ sent, received });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/swaps/:id/status  – calls sp_update_swap_status (TRANSACTION inside procedure)
app.patch('/api/swaps/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    // Stored procedure handles TRANSACTION + swapCount update atomically
    const [results] = await pool.query(
      `CALL sp_update_swap_status(?, ?)`,
      [req.params.id, status]
    );
    res.json(results[0][0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CONTACTS ────────────────────────────────────────────────────────────────

// POST /api/contacts
app.post('/api/contacts', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      [name, email, subject, message]
    );
    res.json({ id: result.insertId, name, email, subject, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
app.listen(port, () => console.log(`Server running on port ${port}`));
export { pool };
