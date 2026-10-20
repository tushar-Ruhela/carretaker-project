const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, fullName, role, phone } = req.body;
  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'email, password, fullName, role required' });
  }

  // Sign up via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return res.status(400).json({ error: authError.message });

  const userId = authData.user?.id;
  if (!userId) return res.status(500).json({ error: 'User creation failed' });

  // Insert profile
  const { error: profileError } = await supabase.from('profiles').insert([{
    id: userId,
    email,
    full_name: fullName,
    role,
    phone,
  }]);
  if (profileError) return res.status(500).json({ error: profileError.message });

  res.status(201).json({ userId, email, role });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  res.json({
    user: { ...data.user, ...profile },
    session: data.session,
  });
});

module.exports = router;
