const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('./supabase');

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Embed text using Gemini embedding model
async function embedText(text) {
  const genAI = getGenAI();
  if (!genAI) {
    // Return empty 768-dim mock vector if key not set
    return new Array(768).fill(0);
  }
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Retrieve relevant documents from pgvector
async function retrieveContext(query, matchCount = 5) {
  if (!process.env.GEMINI_API_KEY || !process.env.SUPABASE_URL) {
    return [
      {
        title: 'Elderly Care Standards',
        category: 'Elderly Care',
        content: 'CareConnect caregivers adhere to NABH-aligned care protocols, including daily vital signs monitoring, medication compliance tracking, and cognitive engagement.'
      },
      {
        title: 'NRI Remote Monitoring',
        category: 'NRI Care',
        content: 'Families abroad receive real-time check-in alerts, shift summary logs, and monthly doctor consultation summaries.'
      }
    ];
  }

  try {
    const queryEmbedding = await embedText(query);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.65,
      match_count: matchCount,
    });
    
    if (error) {
      console.warn('RAG retrieval fallback:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('RAG retrieval error:', err.message);
    return [];
  }
}

// Generate counsellor response with RAG
async function generateCounsellorResponse(userMessage, chatHistory = [], sessionType = 'support') {
  const genAI = getGenAI();
  if (!genAI) {
    return 'Thank you for reaching out to CareConnect. Our team is available 24/7 to support NRI families with verified eldercare in India. How can we assist you today?';
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const context = await retrieveContext(userMessage);
  const contextText = context.length > 0
    ? context.map(d => `[${d.category}] ${d.title}:\n${d.content}`).join('\n\n')
    : 'No specific knowledge documents found.';

  const systemPrompt = `You are CareBot, a compassionate AI counsellor for CareConnect — India's elderly care platform. 
Your role is to help NRI families and caregivers with:
- Choosing the right care plans for their elderly parents
- Understanding caregiver profiles and specialties
- Managing bookings, timesheets, and payments
- Emotional support and guidance for caregiving challenges
- Dementia, mobility care, and medical assistance information

Always be warm, empathetic, and professional. Speak simply and clearly.
When relevant, guide users to book a caregiver, make a payment, or schedule a voice consultation.

RELEVANT KNOWLEDGE BASE:
${contextText}

SESSION TYPE: ${sessionType}`;

  const history = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

// Ingest a document into the RAG knowledge base
async function ingestDocument(title, content, category, source = null) {
  const embedding = await embedText(`${title}: ${content}`);
  
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert([{ title, content, category, source, embedding }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

module.exports = { generateCounsellorResponse, retrieveContext, ingestDocument, embedText };
