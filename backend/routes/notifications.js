const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/notifications/:userId
router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = router;
