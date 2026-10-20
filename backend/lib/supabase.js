const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http')
  ? process.env.SUPABASE_URL
  : 'https://placeholder-project.supabase.co';

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key-for-local-demo';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
