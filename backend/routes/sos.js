const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// POST /api/sos - Trigger SOS alert
router.post('/', async (req, res) => {
  const { caregiverId, familyId, lat, lng, notes } = req.body;
  const { data, error } = await supabase
    .from('sos_alerts')
    .insert([{ caregiver_id: caregiverId, family_id: familyId, location_lat: lat, location_lng: lng, notes }])
    .select().single();
  if (error) return res.status(500).json({ error });

  // Create notification for family
  if (familyId) {
    await supabase.from('notifications').insert([{
      user_id: familyId,
      type: 'sos',
      title: '🚨 SOS Alert',
      body: 'An emergency alert has been triggered. Please respond immediately.',
      data: { alertId: data.id },
    }]);
  }

  res.status(201).json(data);
});

// GET /api/sos/:familyId - Get SOS alerts for family
router.get('/:familyId', async (req, res) => {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('family_id', req.params.familyId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = router;
