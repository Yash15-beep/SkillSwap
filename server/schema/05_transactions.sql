USE skillswap_db;

-- Transaction 1: create a new swap request
-- if the insert fails for any reason, nothing is saved
START TRANSACTION;

INSERT INTO swaps (id, initiatorId, receiverId, offeredSkill, soughtSkill, message, proposedSchedule, status)
VALUES ('TXN001', '1001', '1002', 'React.js', 'Figma', 'Hey, want to swap skills?', 'Weekends', 'pending');

COMMIT;


-- Transaction 2: update user profile + replace their skills atomically
-- both must succeed together or both roll back
START TRANSACTION;

UPDATE users SET bio = 'Updated bio.', fullName = 'Aryan Mehta' WHERE id = '1001';

DELETE FROM user_skills WHERE user_id = '1001';

INSERT INTO user_skills (user_id, type, name, category, level) VALUES ('1001', 'offering', 'React.js', 'Coding', 'Expert');
INSERT INTO user_skills (user_id, type, name, category, level) VALUES ('1001', 'offering', 'Node.js',  'Coding', 'Advanced');
INSERT INTO user_skills (user_id, type, name, category, level) VALUES ('1001', 'seeking',  'Figma',    'Design', 'Beginner');

COMMIT;


-- Transaction 3: accept a swap and increment both users swap count
-- this is what sp_update_swap_status does internally
START TRANSACTION;

UPDATE swaps SET status = 'accepted' WHERE id = 'TXN001';

UPDATE users SET swapCount = swapCount + 1 WHERE id = '1001';
UPDATE users SET swapCount = swapCount + 1 WHERE id = '1002';

COMMIT;


-- Rollback example: something goes wrong mid-transaction
START TRANSACTION;

UPDATE swaps SET status = 'completed' WHERE id = 'TXN001';

-- simulating an error scenario, undo everything
ROLLBACK;

-- verify status is unchanged
SELECT id, status FROM swaps WHERE id = 'TXN001';


-- cleanup
DELETE FROM swaps WHERE id = 'TXN001';
