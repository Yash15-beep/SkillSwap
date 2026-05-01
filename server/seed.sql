-- ============================================================
-- SkillSwap DB - Seed File (Dummy Data)
-- ============================================================

USE skillswap_db;

-- Clear existing data (order matters due to FK constraints)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE swaps;
TRUNCATE TABLE user_portfolio_links;
TRUNCATE TABLE user_skills;
TRUNCATE TABLE contacts;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS (8 dummy users)
-- ============================================================
INSERT INTO users (id, fullName, email, password, bio, avatarUrl, swapCount, createdAt) VALUES
('1001', 'Aryan Mehta',     'aryan@example.com',   'pass123', 'Full-stack developer passionate about open source and teaching React to beginners.', 'https://i.pravatar.cc/150?img=11', 4, '2025-01-10 09:00:00'),
('1002', 'Priya Sharma',    'priya@example.com',   'pass123', 'UI/UX designer with 3 years of experience. Love turning ideas into beautiful interfaces.', 'https://i.pravatar.cc/150?img=5',  3, '2025-01-15 10:30:00'),
('1003', 'Rohan Verma',     'rohan@example.com',   'pass123', 'Music producer and guitarist. Also learning Python for audio processing projects.', 'https://i.pravatar.cc/150?img=12', 2, '2025-02-01 11:00:00'),
('1004', 'Sneha Patel',     'sneha@example.com',   'pass123', 'Finance analyst who loves teaching budgeting and investment basics to students.', 'https://i.pravatar.cc/150?img=9',  5, '2025-02-14 08:45:00'),
('1005', 'Karan Singh',     'karan@example.com',   'pass123', 'Content writer and blogger. Fluent in English, Hindi and currently learning Spanish.', 'https://i.pravatar.cc/150?img=15', 1, '2025-03-05 14:00:00'),
('1006', 'Ananya Iyer',     'ananya@example.com',  'pass123', 'Data scientist with expertise in ML and Python. Looking to improve my design skills.', 'https://i.pravatar.cc/150?img=20', 3, '2025-03-20 16:00:00'),
('1007', 'Dev Kapoor',      'dev@example.com',     'pass123', 'Mobile app developer (Flutter/Dart). Interested in learning digital marketing strategies.', 'https://i.pravatar.cc/150?img=17', 2, '2025-04-01 09:30:00'),
('1008', 'Meera Nair',      'meera@example.com',   'pass123', 'Yoga instructor and wellness coach. Curious about building a personal website.', 'https://i.pravatar.cc/150?img=25', 1, '2025-04-10 12:00:00');

-- ============================================================
-- USER SKILLS
-- ============================================================
INSERT INTO user_skills (user_id, type, name, category, level) VALUES
-- Aryan Mehta
('1001', 'offering', 'React.js',        'Coding',  'Expert'),
('1001', 'offering', 'Node.js',         'Coding',  'Advanced'),
('1001', 'seeking',  'UI/UX Design',    'Design',  'Beginner'),
('1001', 'seeking',  'Figma',           'Design',  'Beginner'),

-- Priya Sharma
('1002', 'offering', 'Figma',           'Design',  'Expert'),
('1002', 'offering', 'Adobe XD',        'Design',  'Advanced'),
('1002', 'seeking',  'React.js',        'Coding',  'Intermediate'),
('1002', 'seeking',  'JavaScript',      'Coding',  'Beginner'),

-- Rohan Verma
('1003', 'offering', 'Guitar',          'Music',   'Expert'),
('1003', 'offering', 'Music Production','Music',   'Advanced'),
('1003', 'seeking',  'Python',          'Coding',  'Beginner'),
('1003', 'seeking',  'Data Analysis',   'Coding',  'Beginner'),

-- Sneha Patel
('1004', 'offering', 'Personal Finance','Finance', 'Expert'),
('1004', 'offering', 'Stock Market',    'Finance', 'Advanced'),
('1004', 'seeking',  'Content Writing', 'Writing', 'Intermediate'),
('1004', 'seeking',  'Blogging',        'Writing', 'Beginner'),

-- Karan Singh
('1005', 'offering', 'Content Writing', 'Writing', 'Expert'),
('1005', 'offering', 'Blogging',        'Writing', 'Advanced'),
('1005', 'seeking',  'Spanish',         'Languages','Beginner'),
('1005', 'seeking',  'Video Editing',   'Other',   'Beginner'),

-- Ananya Iyer
('1006', 'offering', 'Python',          'Coding',  'Expert'),
('1006', 'offering', 'Machine Learning','Coding',  'Advanced'),
('1006', 'seeking',  'Figma',           'Design',  'Intermediate'),
('1006', 'seeking',  'Graphic Design',  'Design',  'Beginner'),

-- Dev Kapoor
('1007', 'offering', 'Flutter',         'Coding',  'Expert'),
('1007', 'offering', 'Dart',            'Coding',  'Advanced'),
('1007', 'seeking',  'Digital Marketing','Marketing','Beginner'),
('1007', 'seeking',  'SEO',             'Marketing','Beginner'),

-- Meera Nair
('1008', 'offering', 'Yoga',            'Other',   'Expert'),
('1008', 'offering', 'Meditation',      'Other',   'Advanced'),
('1008', 'seeking',  'HTML & CSS',      'Coding',  'Beginner'),
('1008', 'seeking',  'WordPress',       'Coding',  'Beginner');

-- ============================================================
-- USER PORTFOLIO LINKS
-- ============================================================
INSERT INTO user_portfolio_links (user_id, label, url) VALUES
('1001', 'GitHub',    'https://github.com/aryanmehta'),
('1001', 'Portfolio', 'https://aryanmehta.dev'),
('1002', 'Dribbble',  'https://dribbble.com/priyasharma'),
('1002', 'Behance',   'https://behance.net/priyasharma'),
('1003', 'SoundCloud','https://soundcloud.com/rohanverma'),
('1004', 'LinkedIn',  'https://linkedin.com/in/snehapatel'),
('1006', 'Kaggle',    'https://kaggle.com/ananyaiyer'),
('1006', 'GitHub',    'https://github.com/ananyaiyer'),
('1007', 'Play Store','https://play.google.com/store/apps/dev?id=devkapoor'),
('1008', 'Instagram', 'https://instagram.com/meerayoga');

-- ============================================================
-- SWAPS
-- ============================================================
INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, proposedSchedule, status, createdAt) VALUES
('S001', '1001', '1002', 'React.js',         'Figma',           'Hey Priya! I can teach you React if you help me get better at Figma. I think we would be a great match!', 'Weekends 10 AM - 12 PM', 'accepted',  '2025-05-01 10:00:00'),
('S002', '1002', '1006', 'Figma',            'Python',          'Hi Ananya, I would love to learn Python from you. I can teach you Figma in return!', 'Tuesdays 6 PM', 'pending',   '2025-05-10 14:00:00'),
('S003', '1003', '1001', 'Guitar',           'Node.js',         'Aryan, I have been wanting to learn backend dev. Can we swap? I will teach you guitar!', 'Saturdays 4 PM', 'accepted',  '2025-05-12 09:00:00'),
('S004', '1004', '1005', 'Personal Finance', 'Content Writing', 'Karan, your writing is amazing. I can teach you investing basics if you help me with my blog.', 'Mondays 7 PM',  'completed', '2025-04-20 11:00:00'),
('S005', '1005', '1004', 'Content Writing',  'Stock Market',    'Sneha, would love to understand the stock market better. Happy to write content for you!', 'Fridays 5 PM',  'completed', '2025-04-25 15:00:00'),
('S006', '1006', '1007', 'Python',           'Flutter',         'Dev, I want to build a mobile ML app. Can you teach me Flutter? I will teach you Python!', 'Wednesdays 8 PM','pending',  '2025-05-15 17:00:00'),
('S007', '1007', '1008', 'Flutter',          'Yoga',            'Meera, I need to de-stress! Can we swap Flutter lessons for Yoga sessions?', 'Sundays 7 AM',  'accepted',  '2025-05-18 08:00:00'),
('S008', '1008', '1001', 'Yoga',             'HTML & CSS',      'Aryan, I want to build my own website. Can you teach me HTML/CSS? I will give you yoga classes!', 'Thursdays 6 PM','pending',  '2025-05-20 12:00:00'),
('S009', '1001', '1006', 'React.js',         'Machine Learning','Ananya, I want to add ML features to my web app. Lets swap React for ML!', 'Saturdays 2 PM','rejected',  '2025-05-08 10:00:00'),
('S010', '1005', '1003', 'Content Writing',  'Guitar',          'Rohan, I have always wanted to learn guitar. I can help you write better documentation!', 'Flexible timing','pending', '2025-05-22 09:30:00');

-- ============================================================
-- CONTACTS
-- ============================================================
INSERT INTO contacts (name, email, subject, message, createdAt) VALUES
('Rahul Gupta',   'rahul@test.com',  'Partnership Inquiry',    'Hi, I represent a coding bootcamp and would love to partner with SkillSwap to offer our students a platform to practice.', '2025-05-01 10:00:00'),
('Simran Kaur',   'simran@test.com', 'Bug Report',             'The swap proposal form does not clear after submission. Please look into this issue.', '2025-05-05 14:30:00'),
('Amit Joshi',    'amit@test.com',   'Feature Request',        'It would be great to have a rating system after each completed swap so users can build reputation.', '2025-05-10 09:15:00'),
('Nisha Reddy',   'nisha@test.com',  'General Feedback',       'Love the platform! The UI is clean and the concept is brilliant. Keep up the great work.', '2025-05-15 16:45:00'),
('Vikram Bose',   'vikram@test.com', 'Account Issue',          'I am unable to update my profile bio. The save button does not seem to work on mobile browsers.', '2025-05-18 11:00:00');
