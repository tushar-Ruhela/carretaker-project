const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../lib/supabase');

const ULTRAVOX_API_BASE = 'https://api.ultravox.ai/api';

// Supported Indian languages for voice sessions
const VOICE_LANGUAGE_CONFIG = {
  en: { label: 'English',   voice: 'Tanya-English-Indian',  instruction: 'Speak in clear, simple English.' },
  hi: { label: 'Hindi',     voice: 'Tanya-English-Indian',  instruction: 'आप हिन्दी में बात करें। सरल और स्पष्ट हिन्दी का उपयोग करें। यदि उपयोगकर्ता अंग्रेज़ी में बोले तो अंग्रेज़ी में जवाब दें।' },
  bn: { label: 'Bengali',   voice: 'Tanya-English-Indian',  instruction: 'বাংলায় কথা বলুন। সহজ ও স্পষ্ট বাংলা ব্যবহার করুন। ব্যবহারকারী ইংরেজিতে কথা বললে ইংরেজিতে উত্তর দিন।' },
  te: { label: 'Telugu',    voice: 'Tanya-English-Indian',  instruction: 'తెలుగులో మాట్లాడండి. సరళమైన మరియు స్పష్టమైన తెలుగు ఉపయోగించండి. వినియోగదారు ఇంగ్లీషులో మాట్లాడితే ఇంగ్లీషులో సమాధానం ఇవ్వండి.' },
  mr: { label: 'Marathi',   voice: 'Tanya-English-Indian',  instruction: 'मराठीत बोला. सोपी आणि स्पष्ट मराठी वापरा. वापरकर्ता इंग्रजीत बोलल्यास इंग्रजीत उत्तर द्या.' },
  ta: { label: 'Tamil',     voice: 'Tanya-English-Indian',  instruction: 'தமிழில் பேசுங்கள். எளிய மற்றும் தெளிவான தமிழைப் பயன்படுத்துங்கள். பயனர் ஆங்கிலத்தில் பேசினால் ஆங்கிலத்தில் பதிலளியுங்கள்.' },
  gu: { label: 'Gujarati',  voice: 'Tanya-English-Indian',  instruction: 'ગુજરાતીમાં વાત કરો. સરળ અને સ્પષ્ટ ગુજરાતી વાપરો. વપરાશકર્તા અંગ્રેજીમાં બોલે તો અંગ્રેજીમાં જવાબ આપો.' },
  kn: { label: 'Kannada',   voice: 'Tanya-English-Indian',  instruction: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ. ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ ಕನ್ನಡ ಬಳಸಿ. ಬಳಕೆದಾರರು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿದರೆ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಉತ್ತರಿಸಿ.' },
  ml: { label: 'Malayalam', voice: 'Tanya-English-Indian',  instruction: 'മലയാളത്തിൽ സംസാരിക്കുക. ലളിതവും വ്യക്തവുമായ മലയാളം ഉപയോഗിക്കുക. ഉപയോക്താവ് ഇംഗ്ലീഷിൽ സംസാരിച്ചാൽ ഇംഗ്ലീഷിൽ മറുപടി നൽകുക.' },
  pa: { label: 'Punjabi',   voice: 'Tanya-English-Indian',  instruction: 'ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰੋ। ਸਰਲ ਅਤੇ ਸਪੱਸ਼ਟ ਪੰਜਾਬੀ ਵਰਤੋ। ਜੇ ਵਰਤੋਂਕਾਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਬੋਲੇ ਤਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।' },
  or: { label: 'Odia',      voice: 'Tanya-English-Indian',  instruction: 'ଓଡ଼ିଆରେ କଥା ହୁଅନ୍ତୁ। ସରଳ ଏବଂ ସ୍ପଷ୍ଟ ଓଡ଼ିଆ ବ୍ୟବହାର କରନ୍ତୁ। ବ୍ୟବହାରକାରୀ ଇଂରାଜୀରେ କଥା ହେଲେ ଇଂରାଜୀରେ ଉତ୍ତର ଦିଅନ୍ତୁ।' },
};

// POST /api/voice/start - Create an Ultravox call for counsellor session
router.post('/start', async (req, res) => {
  try {
    const { userId, userName, language = 'en' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Pick language config, fallback to English
    const langConfig = VOICE_LANGUAGE_CONFIG[language] || VOICE_LANGUAGE_CONFIG['en'];

    const systemPrompt = `You are Priya, a compassionate and professional elderly care counsellor at CareConnect — India's most trusted elderly care platform.

LANGUAGE INSTRUCTION: ${langConfig.instruction}

Your role:
- Help NRI families choose the right care for their elderly parents in India
- Answer questions about caregiver profiles, care types, and costs
- Provide emotional support and reassurance
- Guide users through booking caregivers on the CareConnect platform
- Discuss dementia care, nursing assistance, mobility support, and companion care

Personality: Warm, patient, empathetic. Speak clearly and simply.

If there is an emergency, immediately ask the user to press the SOS button on their dashboard or call 112.

Start by greeting ${userName || 'the family'} warmly in ${langConfig.label} and asking how you can help today.`;

    const response = await axios.post(
      `${ULTRAVOX_API_BASE}/calls`,
      {
        systemPrompt,
        voice: langConfig.voice,
        temperature: 0.7,
        model: 'fixie-ai/ultravox-70B',
        firstSpeaker: 'FIRST_SPEAKER_AGENT',
      },
      {
        headers: {
          'X-API-Key': process.env.ULTRAVOX_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const { callId, joinUrl } = response.data;

    // Save voice session to DB
    const { data: session } = await supabase
      .from('voice_sessions')
      .insert([{ user_id: userId, ultravox_call_id: callId, status: 'created', language }])
      .select().single();

    res.json({ callId, joinUrl, sessionId: session?.id, language });
  } catch (err) {
    console.error('Ultravox start error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not start voice session', detail: err.response?.data });
  }
});

// POST /api/voice/end - End and record a voice session
router.post('/end', async (req, res) => {
  try {
    const { callId, sessionId, duration } = req.body;

    // Get transcript from Ultravox
    let transcript = null;
    try {
      const txResp = await axios.get(
        `${ULTRAVOX_API_BASE}/calls/${callId}/messages`,
        { headers: { 'X-API-Key': process.env.ULTRAVOX_API_KEY } }
      );
      transcript = txResp.data.results
        ?.map(m => `${m.role}: ${m.text}`)
        .join('\n');
    } catch (e) {
      console.warn('Could not fetch transcript');
    }

    await supabase
      .from('voice_sessions')
      .update({ status: 'ended', duration_seconds: duration, transcript, ended_at: new Date() })
      .eq('id', sessionId);

    res.json({ success: true });
  } catch (err) {
    console.error('Voice end error:', err);
    res.status(500).json({ error: 'Could not end voice session' });
  }
});

// GET /api/voice/sessions/:userId - Get all voice sessions for user
router.get('/sessions/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET /api/voice/languages - Return supported Indian languages
router.get('/languages', (req, res) => {
  const languages = Object.entries(VOICE_LANGUAGE_CONFIG).map(([code, config]) => ({
    code,
    label: config.label,
  }));
  res.json(languages);
});

module.exports = router;
