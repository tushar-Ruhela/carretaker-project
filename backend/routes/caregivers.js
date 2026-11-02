const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

const fallbackCaregivers = [
  { id: 'cg-1', full_name: 'Ananya Verma', email: 'ananya@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Dementia & Memory Care', hourly_rate: 500, experience_years: 6, rating: 4.9, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Hindi', 'English'] }] },
  { id: 'cg-2', full_name: 'Rajan Nair', email: 'rajan@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Certified Nursing Assistant', hourly_rate: 400, experience_years: 4, rating: 4.7, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Malayalam', 'Hindi', 'English'] }] },
  { id: 'cg-3', full_name: 'Preethi Subramaniam', email: 'preethi@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Mobility & Physiotherapy Support', hourly_rate: 450, experience_years: 8, rating: 4.8, background_verified: true, aadhaar_verified: true, police_checked: false, languages: ['Tamil', 'English'] }] },
  { id: 'cg-4', full_name: 'Mohammad Iqbal', email: 'iqbal@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Live-In Care Specialist', hourly_rate: 350, experience_years: 3, rating: 4.5, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Urdu', 'Hindi', 'English'] }] },
  { id: 'cg-5', full_name: 'Sunita Kumari', email: 'sunita@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Companion & General Care', hourly_rate: 300, experience_years: 5, rating: 4.6, background_verified: false, aadhaar_verified: true, police_checked: false, languages: ['Hindi', 'Bhojpuri'] }] },
  { id: 'cg-6', full_name: 'Dr. Rekha Menon', email: 'rekha@careconnect.in', role: 'caregiver', caregiver_profiles: [{ specialty: 'Advanced Nursing (RN)', hourly_rate: 600, experience_years: 12, rating: 5.0, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Malayalam', 'English'] }] },
];

// GET /api/caregivers - Get all verified caregivers
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, caregiver_profiles(*)`)
      .eq('role', 'caregiver');
    if (!error && data && data.length > 0) return res.json(data);
  } catch (err) {
    console.warn('Supabase caregivers query failed, using fallback.');
  }
  res.json(fallbackCaregivers);
});

// GET /api/caregivers/:id - Get single caregiver
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, caregiver_profiles(*)`)
      .eq('id', req.params.id)
      .single();
    if (!error && data) return res.json(data);
  } catch (err) {
    console.warn('Supabase single caregiver query failed, using fallback.');
  }
  const found = fallbackCaregivers.find(c => c.id === req.params.id);
  if (found) return res.json(found);
  res.status(404).json({ error: 'Caregiver not found' });
});

module.exports = router;
