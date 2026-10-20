const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/caregivers - Get all verified caregivers
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`*, caregiver_profiles(*)`)
    .eq('role', 'caregiver');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET /api/caregivers/:id - Get single caregiver
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`*, caregiver_profiles(*)`)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error });
  res.json(data);
});

module.exports = router;
