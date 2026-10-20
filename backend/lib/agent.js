const { StateGraph, END } = require('@langchain/langgraph');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { retrieveContext } = require('./rag');

// ─────────────────────────────────────────────────────────────
// Supported Indian Languages
// ─────────────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = {
  en: { name: 'English',   native: 'English' },
  hi: { name: 'Hindi',     native: 'हिन्दी' },
  bn: { name: 'Bengali',   native: 'বাংলা' },
  te: { name: 'Telugu',    native: 'తెలుగు' },
  mr: { name: 'Marathi',   native: 'मराठी' },
  ta: { name: 'Tamil',     native: 'தமிழ்' },
  gu: { name: 'Gujarati',  native: 'ગુજરાતી' },
  kn: { name: 'Kannada',   native: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' },
  pa: { name: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
  or: { name: 'Odia',      native: 'ଓଡ଼ିଆ' },
};

// ─────────────────────────────────────────────────────────────
// Gemini Model Factory
// ─────────────────────────────────────────────────────────────
function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
  });
}

// ─────────────────────────────────────────────────────────────
// Language Detection using Gemini
// ─────────────────────────────────────────────────────────────
async function detectLanguage(model, text) {
  if (!model) return 'en';
  try {
    const prompt = `Detect the language of the following text and return ONLY the ISO 639-1 language code.
Supported codes: en, hi, bn, te, mr, ta, gu, kn, ml, pa, or
If unsure, return "en".

Text: "${text}"

Return ONLY the two-letter code. Nothing else.`;
    const result = await model.invoke([new HumanMessage(prompt)]);
    const code = result.content.trim().toLowerCase().slice(0, 2);
    return SUPPORTED_LANGUAGES[code] ? code : 'en';
  } catch {
    return 'en';
  }
}

// ─────────────────────────────────────────────────────────────
// Build multilingual system prompt for the counsellor
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(intent, context, langCode) {
  const lang = SUPPORTED_LANGUAGES[langCode] || SUPPORTED_LANGUAGES['en'];

  const langInstruction = langCode === 'en'
    ? `Always respond in clear, simple English.`
    : `IMPORTANT: The user is communicating in ${lang.name} (${lang.native}).
You MUST respond entirely in ${lang.name}.
Do NOT switch to English unless the user writes in English.
Keep your response warm, simple, and culturally appropriate for Indian families.`;

  return `You are CareBot — a compassionate AI counsellor for CareConnect, India's trusted elderly care platform.

${langInstruction}

INTENT DETECTED: ${intent}
${intent === 'emergency' ? 'PRIORITY: This is an EMERGENCY. Provide immediate guidance and ask them to press SOS or call 112.' : ''}
${intent === 'emotional_support' ? 'Be especially warm and empathetic. Validate feelings before offering practical advice.' : ''}
${intent === 'booking' ? 'Guide the user to the Find Caregivers section of their dashboard.' : ''}

RELEVANT KNOWLEDGE:
${context || 'No specific context retrieved.'}

Always end with a helpful next step or offer to connect with a live voice counsellor.`;
}

// ─────────────────────────────────────────────────────────────
// Multilingual fallback responses (no API key)
// ─────────────────────────────────────────────────────────────
const FALLBACK_GREETINGS = {
  en: 'Hello! I am your CareConnect AI Counsellor. I can help you find verified caregivers, understand care plans, or answer payment questions.\n\nHow can I support your family today?',
  hi: 'नमस्ते! मैं आपका CareConnect AI सलाहकार हूँ। मैं आपको देखभाल करने वाले खोजने, देखभाल योजनाएं समझने या भुगतान प्रश्नों में मदद कर सकता हूँ।\n\nआज मैं आपके परिवार की कैसे मदद कर सकता हूँ?',
  bn: 'নমস্কার! আমি আপনার CareConnect AI পরামর্শদাতা। আমি যাচাইকৃত কেয়ারগিভার খুঁজতে বা পেমেন্ট প্রশ্নে সাহায্য করতে পারি।\n\nআজ কীভাবে সাহায্য করতে পারি?',
  te: 'నమస్కారం! నేను మీ CareConnect AI కౌన్సెలర్‌ను. ధృవీకరించిన కేర్‌గివర్‌లను కనుగొనడంలో మీకు సహాయం చేయగలను.\n\nఈరోజు ఎలా సహాయం చేయగలను?',
  mr: 'नमस्कार! मी तुमचा CareConnect AI सल्लागार आहे. सत्यापित काळजीवाहक शोधण्यात किंवा देखभाल योजना समजून घेण्यात मदत करू शकतो.\n\nआज कशी मदत करू?',
  ta: 'வணக்கம்! நான் உங்கள் CareConnect AI ஆலோசகர். சரிபார்க்கப்பட்ட பராமரிப்பாளர்களைக் கண்டுபிடிக்க உதவுவேன்.\n\nஇன்று எவ்வாறு உதவலாம்?',
  gu: 'નમસ્તે! હું તમારો CareConnect AI સલાહકાર છું. ચકાસાયેલ કેરગિવર્સ શોધવામાં અથવા ચૂકવણી પ્રશ્નોમાં મદદ કરી શકું છું.\n\nઆજે કેવી રીતે મદદ કરી શકું?',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ CareConnect AI ಸಲಹೆಗಾರ. ಪರಿಶೀಲಿಸಿದ ಆರೈಕೆದಾರರನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಬಹುದು.\n\nಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ CareConnect AI കൗൺസലർ ആണ്. സ്ഥിരീകരിച്ച കെയർഗിവർമാരെ കണ്ടെത്തുന്നതിൽ സഹായിക്കാം.\n\nഇന്ന് എങ്ങനെ സഹായിക്കാം?',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ CareConnect AI ਸਲਾਹਕਾਰ ਹਾਂ। ਪ੍ਰਮਾਣਿਤ ਦੇਖਭਾਲ ਕਰਨ ਵਾਲੇ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।\n\nਅੱਜ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?',
  or: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ CareConnect AI ପରାମର୍ଶଦାତା। ଯାଞ୍ଚ ହୋଇଥିବା ଯତ୍ନ ନେଉଥିବା ବ୍ୟକ୍ତିଙ୍କୁ ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବି।\n\nଆଜି କିପରି ସାହାଯ୍ୟ କରିବି?',
};

function fallbackCounsellor(userMessage, langCode = 'en') {
  const lower = userMessage.toLowerCase();
  let intent = 'general';
  let response = '';

  const emergencyWords = ['emergency', 'fall', 'hospital', 'urgent', 'doctor', 'आपातकाल', 'गिर', 'अस्पताल', 'ఆపద', 'ਐਮਰਜੈਂਸੀ', 'জরুরি', 'இடர்'];
  const bookingWords  = ['book', 'hire', 'find', 'caregiver', 'बुक', 'देखभाल', 'ढूंढ', 'కేర్‌గివర్', 'ਬੁਕ', 'বুক', 'முன்பதிவு'];
  const paymentWords  = ['pay', 'price', 'cost', 'rate', 'पैसे', 'भुगतान', 'दर', 'చెల్లింపు', 'ਭੁਗਤਾਨ', 'পেমেন্ট', 'கட்டணம்'];
  const dementiaWords = ['dementia', 'alzheimer', 'memory', 'डिमेंशिया', 'स्मृति', 'మతిమరుపు', 'ਡਿਮੈਂਸ਼ੀਆ', 'ডিমেনশিয়া'];
  const stressWords   = ['stress', 'guilt', 'worry', 'nri', 'तनाव', 'चिंता', 'ఆందోళన', 'ਤਣਾਅ', 'উদ্বেগ'];

  if (emergencyWords.some(w => lower.includes(w))) {
    intent = 'emergency';
    response = langCode === 'hi'
      ? '⚠️ **तत्काल चेतावनी:** यदि यह चिकित्सा आपातकाल है, तो **SOS बटन** दबाएं या **112** डायल करें।'
      : '⚠️ **Urgent Alert:** If this is a medical emergency, press the **SOS button** on your dashboard or dial **112** immediately.';
  } else if (bookingWords.some(w => lower.includes(w))) {
    intent = 'booking';
    response = langCode === 'hi'
      ? 'मैं आपके परिवार के लिए सही देखभालकर्ता खोजने में मदद करूँगा! डैशबोर्ड पर **"देखभालकर्ता खोजें"** टैब पर जाएं।'
      : 'I would be happy to help you find the right caregiver! Browse verified profiles under **"Find Caregivers"** on your dashboard.';
  } else if (paymentWords.some(w => lower.includes(w))) {
    intent = 'payment';
    response = langCode === 'hi'
      ? 'दरें आमतौर पर **₹350/घंटे** से **₹700/घंटे** तक होती हैं। सभी भुगतान **Razorpay** के माध्यम से सुरक्षित हैं।'
      : 'Rates range from **₹350/hr** to **₹700/hr**. All payments are secured via **Razorpay** (UPI, cards, net banking).';
  } else if (dementiaWords.some(w => lower.includes(w))) {
    intent = 'caregiving_info';
    response = langCode === 'hi'
      ? 'डिमेंशिया की देखभाल के लिए विशेष धैर्य की आवश्यकता है। हमारे प्रशिक्षित देखभालकर्ता संज्ञानात्मक अभ्यास और दिनचर्या में विशेषज्ञ हैं।'
      : 'Dementia care requires specialized patience. Our trained caregivers practice memory prompts and calm routine maintenance.';
  } else if (stressWords.some(w => lower.includes(w))) {
    intent = 'emotional_support';
    response = langCode === 'hi'
      ? 'दूर रहते हुए चिंता करना बहुत कठिन है। आप अकेले नहीं हैं। हमारा प्लेटफ़ॉर्म आपको रियल-टाइम अपडेट्स से जोड़े रखता है।'
      : 'Being far from elderly parents is deeply challenging. You are not alone — our platform keeps you connected via real-time updates and verified daily logs.';
  } else {
    response = FALLBACK_GREETINGS[langCode] || FALLBACK_GREETINGS['en'];
  }

  return { response, intent, language: langCode };
}

// ─────────────────────────────────────────────────────────────
// LangGraph Counsellor Agent (Multilingual)
// ─────────────────────────────────────────────────────────────
const counsellorGraph = () => {
  const model = getModel();
  if (!model) return null;

  const graph = new StateGraph({
    channels: {
      messages: { reducer: (x, y) => x.concat(y), default: () => [] },
      context:  { reducer: (_, y) => y, default: () => '' },
      intent:   { reducer: (_, y) => y, default: () => '' },
      response: { reducer: (_, y) => y, default: () => '' },
      language: { reducer: (_, y) => y, default: () => 'en' },
    }
  });

  // Node 1: Detect language of user message
  graph.addNode('detect_language', async (state) => {
    const lastMessage = state.messages[state.messages.length - 1].content;
    const lang = await detectLanguage(model, lastMessage);
    return { language: lang };
  });

  // Node 2: Classify intent (language-aware)
  graph.addNode('classify_intent', async (state) => {
    const lastMessage = state.messages[state.messages.length - 1].content;
    const lang = SUPPORTED_LANGUAGES[state.language] || SUPPORTED_LANGUAGES['en'];

    const classifyPrompt = `Classify this user message into one of these intents:
- booking: user wants to book a caregiver
- payment: user has payment or billing questions
- emergency: user has an urgent/emergency situation
- caregiving_info: user wants information about care types
- emotional_support: user is stressed or seeking emotional help
- general: general inquiry

The message may be in ${lang.name}. Classify based on meaning regardless of language.

Message: "${lastMessage}"
Return ONLY the intent word.`;

    try {
      const result = await model.invoke([new HumanMessage(classifyPrompt)]);
      return { intent: result.content.trim().toLowerCase() };
    } catch {
      return { intent: 'general' };
    }
  });

  // Node 3: Retrieve RAG context
  graph.addNode('retrieve_context', async (state) => {
    const lastMessage = state.messages[state.messages.length - 1].content;
    try {
      const docs = await retrieveContext(lastMessage, 4);
      const contextText = docs.map(d => `[${d.category}] ${d.title}: ${d.content}`).join('\n\n');
      return { context: contextText };
    } catch {
      return { context: '' };
    }
  });

  // Node 4: Generate multilingual response
  graph.addNode('generate_response', async (state) => {
    const { messages, context, intent, language } = state;
    const systemPrompt = buildSystemPrompt(intent, context, language);

    const allMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map(m => new HumanMessage(m.content)),
    ];

    try {
      const result = await model.invoke(allMessages);
      return { response: result.content };
    } catch (e) {
      const fallback = fallbackCounsellor(messages[messages.length - 1].content, language);
      return { response: fallback.response };
    }
  });

  // Define graph flow
  graph.setEntryPoint('detect_language');
  graph.addEdge('detect_language',   'classify_intent');
  graph.addEdge('classify_intent',   'retrieve_context');
  graph.addEdge('retrieve_context',  'generate_response');
  graph.addEdge('generate_response', END);

  return graph.compile();
};

let agentInstance = null;

// ─────────────────────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────────────────────
async function runCounsellorAgent(userMessage, chatHistory = []) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackCounsellor(userMessage, 'en');
  }

  try {
    if (!agentInstance) {
      agentInstance = counsellorGraph();
    }
    if (!agentInstance) {
      return fallbackCounsellor(userMessage, 'en');
    }

    const messages = [
      ...chatHistory.map(m => ({ content: m.content, role: m.role })),
      { content: userMessage, role: 'user' },
    ];

    const result = await agentInstance.invoke({ messages });
    return {
      response: result.response,
      intent:   result.intent,
      language: result.language,
    };
  } catch (err) {
    console.warn('LangGraph execution error, using fallback:', err.message);
    return fallbackCounsellor(userMessage, 'en');
  }
}

module.exports = { runCounsellorAgent, fallbackCounsellor, SUPPORTED_LANGUAGES };
