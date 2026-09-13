const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { PROVIDERS, generateAIResponse, compareModelsResponse } = require('../services/aiService');

// Get available providers & models
router.get('/providers', (req, res) => {
  res.json({ providers: PROVIDERS });
});

// List conversations
router.get('/conversations', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const conversations = db.prepare(`
    SELECT c.*, 
      (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.id) as message_count
    FROM ai_conversations c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
  `).all(userId);

  res.json({ conversations });
});

// Create new conversation
router.post('/conversations', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { title, provider, model } = req.body;

  const result = db.prepare(`
    INSERT INTO ai_conversations (user_id, title, provider, model)
    VALUES (?, ?, ?, ?)
  `).run(userId, title || 'New Study Session', provider || 'gemini', model || 'gemini-1.5-flash');

  const conversation = db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ conversation });
});

// Get conversation messages
router.get('/conversations/:id/messages', optionalAuth, (req, res) => {
  const convId = req.params.id;
  const messages = db.prepare(`
    SELECT * FROM ai_messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(convId);

  const conversation = db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(convId);

  res.json({ conversation, messages });
});

// Rename conversation
router.put('/conversations/:id', optionalAuth, (req, res) => {
  const convId = req.params.id;
  const { title } = req.body;

  db.prepare('UPDATE ai_conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, convId);
  res.json({ message: 'Conversation renamed successfully' });
});

// Delete conversation
router.delete('/conversations/:id', optionalAuth, (req, res) => {
  const convId = req.params.id;
  db.prepare('DELETE FROM ai_conversations WHERE id = ?').run(convId);
  res.json({ message: 'Conversation deleted successfully' });
});

// Ask AI / Chat
router.post('/chat', optionalAuth, async (req, res) => {
  const userId = req.user.id;
  let { conversation_id, message, provider, model, temperature, subject_context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Create conversation if not provided
  if (!conversation_id) {
    const title = message.slice(0, 36) + (message.length > 36 ? '...' : '');
    const result = db.prepare(`
      INSERT INTO ai_conversations (user_id, title, provider, model)
      VALUES (?, ?, ?, ?)
    `).run(userId, title, provider || 'gemini', model || 'gemini-1.5-flash');
    conversation_id = result.lastInsertRowid;
  }

  // Save user message
  db.prepare(`
    INSERT INTO ai_messages (conversation_id, role, content, model_used)
    VALUES (?, 'user', ?, ?)
  `).run(conversation_id, message, model || 'gemini-1.5-flash');

  // Fetch user fun checkup context and custom API keys if available
  let funCheckup = null;
  let userCustomKey = null;
  try {
    funCheckup = db.prepare('SELECT * FROM fun_checkups WHERE user_id = ?').get(userId);
    const userSettings = db.prepare('SELECT api_keys_json FROM user_settings WHERE user_id = ?').get(userId);
    if (userSettings && userSettings.api_keys_json) {
      const keys = JSON.parse(userSettings.api_keys_json);
      userCustomKey = keys.gemini || null;
    }
  } catch (e) {}

  // Generate assistant response via Live API or Academic Engine
  const assistantReply = await generateAIResponse(message, {
    subject: subject_context || 'Computer Science & Engineering',
    provider: provider || 'gemini',
    model: model || (provider === 'ollama' ? 'qwen3' : 'gemini-1.5-flash'),
    apiKey: userCustomKey,
    fun_checkup: funCheckup
  });

  // Save assistant message
  db.prepare(`
    INSERT INTO ai_messages (conversation_id, role, content, model_used)
    VALUES (?, 'assistant', ?, ?)
  `).run(conversation_id, assistantReply, model || 'gemini-1.5-flash');

  // Update conversation updated_at
  db.prepare('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

  // Award XP for asking AI doubts
  try {
    db.prepare('INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 10, ?)').run(userId, 'Asked AI Study Doubt');
  } catch (e) {}

  res.json({
    conversation_id,
    role: 'assistant',
    content: assistantReply,
    model_used: model || (provider === 'ollama' ? 'qwen3' : 'gemini-1.5-flash'),
    provider: provider || 'gemini'
  });
});

// Compare model responses
router.post('/compare', optionalAuth, (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required for model comparison' });
  }

  const comparisons = compareModelsResponse(query);
  res.json({
    query,
    comparisons
  });
});

module.exports = router;
