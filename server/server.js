import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and setup DB
async function initDb() {
  try {
    // First connect without database to create it if it doesn't exist
    const initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await initialConnection.end();

    console.log('Database checked/created successfully.');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        avatarUrl VARCHAR(255),
        swapCount INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type ENUM('offering', 'seeking') NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        level VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_portfolio_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS swaps (
        id VARCHAR(255) PRIMARY KEY,
        initiatorId VARCHAR(255) NOT NULL,
        receiverId VARCHAR(255) NOT NULL,
        offeredSkill VARCHAR(255) NOT NULL,
        soughtSkill VARCHAR(255) NOT NULL,
        message TEXT,
        proposedSchedule VARCHAR(255),
        status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (initiatorId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables checked/created successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initDb();

// Helper function to format user object
const formatUser = async (user) => {
  const [skills] = await pool.query('SELECT * FROM user_skills WHERE user_id = ?', [user.id]);
  const [links] = await pool.query('SELECT * FROM user_portfolio_links WHERE user_id = ?', [user.id]);
  
  return {
    ...user,
    skillsOffering: skills.filter(s => s.type === 'offering'),
    skillsSeeking: skills.filter(s => s.type === 'seeking'),
    portfolioLinks: links
  };
}

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, bio, avatarUrl } = req.body;
  try {
    const id = Date.now().toString();
    await pool.query(
      'INSERT INTO users (id, fullName, email, password, bio, avatarUrl) VALUES (?, ?, ?, ?, ?, ?)',
      [id, fullName, email, password, bio || null, avatarUrl || null]
    );
    
    // In a real app we'd use JWTs, but returning simple string for mockup compatibility
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json({ token: `mock-jwt-${id}`, user: await formatUser(users[0]) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: `mock-jwt-${users[0].id}`, user: await formatUser(users[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.startsWith('mock-jwt-')) return res.status(401).json({ error: 'Unauthorized' });
  
  const userId = token.replace('mock-jwt-', '');
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(401).json({ error: 'User not found' });
    res.json({ user: await formatUser(users[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  const { search, category } = req.query;
  try {
    let [users] = await pool.query('SELECT * FROM users');
    
    // Format all users with their skills (simplified for this app size)
    const formattedUsers = await Promise.all(users.map(u => formatUser(u)));
    
    let filteredUsers = formattedUsers;
    
    if (search) {
      const s = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u => u.fullName.toLowerCase().includes(s) || (u.bio && u.bio.toLowerCase().includes(s)));
    }
    
    if (category && category !== 'All') {
      filteredUsers = filteredUsers.filter(u => {
        const allSkills = [...(u.skillsOffering || []), ...(u.skillsSeeking || [])];
        return allSkills.some(skill => skill.category === category);
      });
    }
    
    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(await formatUser(users[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { fullName, bio, avatarUrl } = req.body;
  try {
    await pool.query(
      'UPDATE users SET fullName = ?, bio = ?, avatarUrl = ? WHERE id = ?',
      [fullName, bio, avatarUrl, req.params.id]
    );
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(await formatUser(users[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swaps', async (req, res) => {
  const { senderId, recipientId, offeredSkill, soughtSkill, message, proposedSchedule } = req.body;
  try {
    const id = Date.now().toString();
    await pool.query(
      'INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, proposedSchedule) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, senderId, recipientId, offeredSkill, soughtSkill, message, proposedSchedule || null]
    );
    const [swaps] = await pool.query('SELECT * FROM swaps WHERE id = ?', [id]);
    
    // Map to expected format
    const s = swaps[0];
    res.json({ ...s, senderId: s.initiatorId, recipientId: s.receiverId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swaps/user/:userId', async (req, res) => {
  try {
    const [sent] = await pool.query('SELECT * FROM swaps WHERE initiatorId = ?', [req.params.userId]);
    const [received] = await pool.query('SELECT * FROM swaps WHERE receiverId = ?', [req.params.userId]);
    
    res.json({
      sent: sent.map(s => ({ ...s, senderId: s.initiatorId, recipientId: s.receiverId })),
      received: received.map(s => ({ ...s, senderId: s.initiatorId, recipientId: s.receiverId }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/swaps/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE swaps SET status = ? WHERE id = ?', [status, req.params.id]);
    
    if (status === 'accepted') {
      const [swaps] = await pool.query('SELECT * FROM swaps WHERE id = ?', [req.params.id]);
      const s = swaps[0];
      await pool.query('UPDATE users SET swapCount = swapCount + 1 WHERE id IN (?, ?)', [s.initiatorId, s.receiverId]);
    }
    
    const [swaps] = await pool.query('SELECT * FROM swaps WHERE id = ?', [req.params.id]);
    const s = swaps[0];
    res.json({ ...s, senderId: s.initiatorId, recipientId: s.receiverId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { pool };
