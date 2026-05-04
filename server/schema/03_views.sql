USE skillswap_db;

-- view used by the Swaps page: joins swaps with both user names
CREATE OR REPLACE VIEW view_swap_details AS
    SELECT
        sw.id,
        sw.initiatorId      AS senderId,
        sw.receiverId       AS recipientId,
        u1.fullName         AS senderName,
        u2.fullName         AS recipientName,
        sw.offeredSkill     AS skillOffered,
        sw.soughtSkill      AS skillRequested,
        sw.message,
        sw.proposedSchedule,
        sw.status,
        sw.createdAt
    FROM swaps sw
    JOIN users u1 ON sw.initiatorId = u1.id
    JOIN users u2 ON sw.receiverId  = u2.id;


-- view used by the Discover page: user summary with skill counts
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
    GROUP BY u.id, u.fullName, u.email, u.bio, u.avatarUrl, u.swapCount, u.createdAt;
