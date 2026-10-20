const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/bookings/:userId
router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, family:family_id(full_name, email), caregiver:caregiver_id(full_name, email)`)
    .or(`family_id.eq.${req.params.userId},caregiver_id.eq.${req.params.userId}`)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /api/bookings
router.post('/', async (req, res) => {
  const { familyId, caregiverId, careType, startDate, shiftTime, notes } = req.body;
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      family_id: familyId,
      caregiver_id: caregiverId,
      care_type: careType,
      start_date: startDate,
      shift_time: shiftTime,
      notes,
      status: 'pending',
    }])
    .select().single();
  if (error) return res.status(500).json({ error });
  res.status(201).json(data);
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = router;
