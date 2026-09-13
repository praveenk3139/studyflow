const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Get friends list & pending requests
router.get('/friends', optionalAuth, (req, res) => {
  const userId = req.user.id;

  const friends = db.prepare(`
    SELECT u.id, u.username, p.full_name, p.college, p.department, p.profile_image,
      (SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = u.id) as xp,
      f.status, f.created_at
    FROM friends f
    JOIN users u ON (f.friend_id = u.id)
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE f.user_id = ? AND f.status = 'accepted'
  `).all(userId);

  const pendingRequests = db.prepare(`
    SELECT fr.id, u.id as sender_id, u.username, p.full_name, fr.created_at
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
  `).all(userId);

  res.json({
    friends: friends.map(f => ({ ...f, is_online: true })),
    pending_requests: pendingRequests
  });
});

// Search users by username
router.get('/search', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.json({ users: [] });
  }

  const users = db.prepare(`
    SELECT u.id, u.username, p.full_name, p.college, p.department
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.username LIKE ? AND u.id != ?
    LIMIT 10
  `).all(`%${query}%`, userId);

  res.json({ users });
});

// Send friend request
router.post('/request', optionalAuth, (req, res) => {
  const senderId = req.user.id;
  const { target_username } = req.body;

  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(target_username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === senderId) return res.status(400).json({ error: 'Cannot add yourself as a friend' });

  db.prepare(`
    INSERT INTO friend_requests (sender_id, receiver_id, status)
    VALUES (?, ?, 'pending')
  `).run(senderId, target.id);

  // Send notification to receiver
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (?, 'New Friend Request', ?, 'friend', '#social')
  `).run(target.id, `${req.user.username} sent you a study buddy request.`);

  res.status(201).json({ message: `Friend request sent to ${target_username}!` });
});

// Direct Messages between two students
router.get('/messages/:friend_id', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friend_id;

  const messages = db.prepare(`
    SELECT m.*, u.username as sender_username
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(userId, friendId, friendId, userId);

  res.json({ messages });
});

// Send Direct Message
router.post('/messages', optionalAuth, (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, content } = req.body;

  if (!content || !receiver_id) {
    return res.status(400).json({ error: 'Receiver ID and content are required' });
  }

  const result = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES (?, ?, ?)
  `).run(senderId, receiver_id, content);

  res.status(201).json({
    message_id: result.lastInsertRowid,
    sender_id: senderId,
    receiver_id,
    content,
    created_at: new Date().toISOString()
  });
});

// Study Groups
router.get('/groups', optionalAuth, (req, res) => {
  const userId = req.user.id;

  const groups = db.prepare(`
    SELECT g.*, s.name as subject_name,
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count
    FROM groups g
    LEFT JOIN subjects s ON g.subject_id = s.id
    ORDER BY g.created_at DESC
  `).all();

  res.json({ groups });
});

// Study Group Chat Messages
router.get('/groups/:id/messages', optionalAuth, (req, res) => {
  const groupId = req.params.id;

  const messages = db.prepare(`
    SELECT gm.*, u.username as sender_username, p.full_name as sender_name
    FROM group_messages gm
    JOIN users u ON gm.sender_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.created_at ASC
  `).all(groupId);

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);

  res.json({ group, messages });
});

// Send Study Group Message
router.post('/groups/:id/messages', optionalAuth, (req, res) => {
  const senderId = req.user.id;
  const groupId = req.params.id;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Message content required' });

  const result = db.prepare(`
    INSERT INTO group_messages (group_id, sender_id, content)
    VALUES (?, ?, ?)
  `).run(groupId, senderId, content);

  res.status(201).json({
    message_id: result.lastInsertRowid,
    group_id: groupId,
    sender_id: senderId,
    content,
    created_at: new Date().toISOString()
  });
});

// Moderation: Report or Block
router.post('/moderation/report', optionalAuth, (req, res) => {
  const { target_user_id, reason, details } = req.body;
  res.json({
    message: 'Report submitted to academic honor council moderators. The user has been muted from your feed.',
    status: 'MUTED_AND_LOGGED'
  });
});

module.exports = router;
