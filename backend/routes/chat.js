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
    let sid = sessionId;
    if (!sid) {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert([{ user_id: userId, session_type: sessionType, title: message.substring(0, 60) }])
        .select().single();
      if (error) throw error;
      sid = session.id;
    }

    // Get chat history for this session
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sid)
      .order('created_at', { ascending: true })
      .limit(20);

    // Run counsellor agent (LangGraph + RAG)
    const { response, intent } = await runCounsellorAgent(message, history || []);

    // Save user message
    await supabase.from('chat_messages').insert([{
      session_id: sid,
      role: 'user',
      content: message,
    }]);

    // Save assistant response
    await supabase.from('chat_messages').insert([{
      session_id: sid,
      role: 'assistant',
      content: response,
      metadata: { intent },
    }]);

    res.json({ sessionId: sid, response, intent });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

// GET /api/chat/sessions/:userId - List sessions
router.get('/sessions/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET /api/chat/messages/:sessionId - Get messages for a session
router.get('/messages/:sessionId', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', req.params.sessionId)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = router;
