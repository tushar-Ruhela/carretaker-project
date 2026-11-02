const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/notifications/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) return res.json(data);
  } catch (err) {}
  res.json([]);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .select().single();
    if (!error && data) return res.json(data);
  } catch (err) {}
  res.json({ id: req.params.id, read: true });
});

module.exports = router;
