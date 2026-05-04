USE skillswap_db;

-- registers a new user, called by the /api/auth/register route
DROP PROCEDURE IF EXISTS sp_register_user;
DELIMITER $$
CREATE PROCEDURE sp_register_user(
    IN p_id        VARCHAR(255),
    IN p_fullName  VARCHAR(255),
    IN p_email     VARCHAR(255),
    IN p_password  VARCHAR(255),
    IN p_bio       TEXT,
    IN p_avatarUrl VARCHAR(255)
)
BEGIN
    INSERT INTO users (id, fullName, email, password, bio, avatarUrl)
    VALUES (p_id, p_fullName, p_email, p_password, p_bio, p_avatarUrl);

    SELECT * FROM users WHERE id = p_id;
END$$
DELIMITER ;


-- updates swap status and increments swapCount if accepted
-- uses a transaction so both updates succeed or both roll back
DROP PROCEDURE IF EXISTS sp_update_swap_status;
DELIMITER $$
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

    SELECT * FROM view_swap_details WHERE id = p_swapId;
END$$
DELIMITER ;


-- searches users by name/bio keyword and optional category filter
-- called by the Discover page via /api/users
DROP PROCEDURE IF EXISTS sp_search_users;
DELIMITER $$
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
        (p_category = '' OR p_category = 'All' OR s.category = p_category)
    ORDER BY u.swapCount DESC;
END$$
DELIMITER ;
