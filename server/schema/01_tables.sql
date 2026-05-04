-- create the database
CREATE DATABASE IF NOT EXISTS skillswap_db;
USE skillswap_db;

-- users table: stores registered user accounts
CREATE TABLE IF NOT EXISTS users (
    id        VARCHAR(255) PRIMARY KEY,
    fullName  VARCHAR(255) NOT NULL,
    email     VARCHAR(255) UNIQUE NOT NULL,
    password  VARCHAR(255) NOT NULL,
    bio       TEXT,
    avatarUrl VARCHAR(255),
    swapCount INT      DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- skills each user offers or is seeking (1NF: one skill per row)
CREATE TABLE IF NOT EXISTS user_skills (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id  VARCHAR(255)               NOT NULL,
    type     ENUM('offering', 'seeking') NOT NULL,
    name     VARCHAR(255)               NOT NULL,
    category VARCHAR(255)               NOT NULL,
    level    VARCHAR(50)                NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- portfolio links attached to a user profile
CREATE TABLE IF NOT EXISTS user_portfolio_links (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    label   VARCHAR(255) NOT NULL,
    url     VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- swap requests between two users
CREATE TABLE IF NOT EXISTS swaps (
    id               VARCHAR(255) PRIMARY KEY,
    initiatorId      VARCHAR(255) NOT NULL,
    receiverId       VARCHAR(255) NOT NULL,
    offeredSkill     VARCHAR(255) NOT NULL,
    soughtSkill      VARCHAR(255) NOT NULL,
    message          TEXT,
    proposedSchedule VARCHAR(255),
    status           ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (initiatorId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId)  REFERENCES users(id) ON DELETE CASCADE
);

-- contact form submissions from visitors
CREATE TABLE IF NOT EXISTS contacts (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    email     VARCHAR(255) NOT NULL,
    subject   VARCHAR(255) NOT NULL,
    message   TEXT         NOT NULL,
    createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP
);
