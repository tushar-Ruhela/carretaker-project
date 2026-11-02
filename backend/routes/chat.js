const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { runCounsellorAgent } = require('../lib/agent');

// POST /api/chat/message - Send a message to counsellor
router.post('/message', async (req, res) => {
  try {
    const { userId, sessionId, message, sessionType = 'support' } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });

    // Get or create chat session
    let sid = sessionId || `session_${Date.now()}`;
    if (!sessionId) {
      try {
        const { data: session, error } = await supabase
          .from('chat_sessions')
          .insert([{ user_id: userId, session_type: sessionType, title: message.substring(0, 60) }])
          .select().single();
        if (!error && session) sid = session.id;
      } catch (e) {
        // Fallback to local session id if DB is unavailable
      }
    }

    // Get chat history for this session (best effort)
    let history = [];
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })
        .limit(20);
      if (data) history = data;
    } catch (e) {}

    // Run counsellor agent (LangGraph + RAG)
    const { response, intent } = await runCounsellorAgent(message, history || []);

    // Save user & assistant messages (best effort)
    try {
      await supabase.from('chat_messages').insert([{
        session_id: sid,
        role: 'user',
        content: message,
      }]);
      await supabase.from('chat_messages').insert([{
        session_id: sid,
        role: 'assistant',
        content: response,
        metadata: { intent },
      }]);
    } catch (e) {}

    res.json({ sessionId: sid, response, intent });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

// GET /api/chat/sessions/:userId - List sessions
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('updated_at', { ascending: false });
    if (!error && data) return res.json(data);
  } catch (err) {}
  res.json([]);
});

// GET /api/chat/messages/:sessionId - Get messages for a session
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', req.params.sessionId)
      .order('created_at', { ascending: true });
    if (!error && data) return res.json(data);
  } catch (err) {}
  res.json([]);
});

module.exports = router;
