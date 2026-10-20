require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('NOTE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to run vector embedding seed.');
  console.log('Skipping remote seed. When you set your Supabase keys in backend/.env, run: npm run seed');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleDocs = [
  {
    title: 'Dementia & Alzheimer Care Protocol',
    category: 'Dementia Care',
    source: 'CareConnect Clinical Guidelines',
    content: `CareConnect caregivers are trained in dementia staging and behavioral management. Key protocols include:
1. Maintaining consistent daily routines for meals, cognitive activities, and sleep.
2. Sundowning mitigation: soft lighting, calming classical or devotional music by 5:00 PM, and avoiding daytime overstimulation.
3. Wandering prevention: ensuring GPS monitoring, alert bracelets, and latch security.
4. Validation therapy: always validating feelings rather than contradicting memory lapses.
Caregivers log cognitive alertness, meal consumption, and agitation levels twice daily.`
  },
  {
    title: 'NRI Remote Eldercare Management',
    category: 'NRI Care',
    source: 'CareConnect Platform Guide',
    content: `CareConnect allows overseas children in the US, UK, UAE, and Canada to manage elderly parents in India seamlessly:
- Daily shift reports with verified clock-in/out timestamps and activity checklists.
- Real-time vitals monitoring (BP, sugar levels, SpO2, heart rate) logged after morning and evening shifts.
- Transparent payments via Razorpay escrow with multi-currency and international card acceptance.
- SOS emergency dispatch alerting both the family WhatsApp contact and nearest local ambulance network.`
  },
  {
    title: 'Pricing, Hourly Rates & Escrow Protection',
    category: 'Billing & Payments',
    source: 'CareConnect Fee Schedule',
    content: `All transactions on CareConnect are escrow-protected through Razorpay:
- Companion Care: ₹350 - ₹450 / hour.
- Post-Operative & Mobility Support: ₹450 - ₹550 / hour.
- Specialized Dementia & Palliative Care: ₹600 - ₹800 / hour.
Funds deposited into escrow are held securely until the family approves the caregiver's digital timesheet shift log. Disputed hours trigger automatic review by CareConnect operations within 4 business hours.`
  },
  {
    title: 'Emergency SOS Protocol',
    category: 'Emergency & Safety',
    source: 'CareConnect Safety Handbook',
    content: `When the red SOS button is triggered on the family dashboard or caregiver app:
1. CareConnect 24/7 Operations Command Center receives instantaneous notification with GPS coordinates.
2. Automated SMS and phone call alerts are dispatched to the primary and secondary emergency contacts.
3. Nearest verified on-call ambulance or local hospital tie-up is notified within 3 minutes.
4. If a caregiver is present on site, they are guided via voice protocol to administer first aid until paramedic arrival.`
  },
  {
    title: 'Senior Nutrition & Medication Management',
    category: 'Daily Living',
    source: 'CareConnect Eldercare Handbook',
    content: `Indian senior nutritional management guidelines:
- Low-sodium, diabetic-friendly traditional meals (moong dal khichdi, steamed idlis, fresh seasonal vegetables, methi water).
- Rigorous pill organizer management: morning, noon, evening, and bedtime pill segregation.
- Hydration schedule: minimum 1.5 to 2 liters of fluid daily (coconut water, warm herbal infusions, buttermilk).
- Caregiver checks medication expiry dates and alerts family 5 days before refills are required.`
  }
];

async function seed() {
  console.log('Seeding knowledge documents into Supabase pgvector...');

  let genAI = null;
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  for (const doc of sampleDocs) {
    let embedding = new Array(768).fill(0);

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'embedding-001' });
        const result = await model.embedContent(`${doc.title}: ${doc.content}`);
        embedding = result.embedding.values;
        console.log(`Generated 768-dim embedding for: ${doc.title}`);
      } catch (e) {
        console.warn(`Could not generate embedding for "${doc.title}":`, e.message);
      }
    } else {
      console.log(`Using zero-vector placeholder for: ${doc.title} (GEMINI_API_KEY not configured)`);
    }

    const { error } = await supabase
      .from('knowledge_documents')
      .upsert(
        {
          title: doc.title,
          category: doc.category,
          content: doc.content,
          source: doc.source,
          embedding,
        },
        { onConflict: 'title' }
      );

    if (error) {
      console.error(`Error inserting "${doc.title}":`, error.message);
    } else {
      console.log(`✓ Seeded: ${doc.title}`);
    }
  }

  console.log('Knowledge base seeding completed successfully!');
}

seed().catch(console.error);
