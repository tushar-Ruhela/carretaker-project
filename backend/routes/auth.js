const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, fullName, role, phone } = req.body;
  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'email, password, fullName, role required' });
  }

  try {
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
  } catch (err) {
    res.status(503).json({ error: 'Database service is currently unreachable. Please unpause Supabase or use Quick Demo.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

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
  } catch (err) {
    if (email && email.toLowerCase().includes('demo')) {
      const role = email.includes('care') ? 'caregiver' : email.includes('admin') ? 'admin' : 'family';
      return res.json({
        user: {
          id: `demo-${role}-001`,
          email,
          full_name: role === 'family' ? 'The Sharma Family' : role === 'caregiver' ? 'Ananya Verma' : 'Admin User',
          role,
          backgroundVerified: true
        },
        session: { access_token: `demo-token-${Date.now()}` }
      });
    }
    res.status(503).json({ error: 'Database service is currently unreachable. Please unpause Supabase or use Quick Demo.' });
  }
});

module.exports = router;
