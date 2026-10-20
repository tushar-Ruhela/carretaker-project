-- ====================================================
-- CareConnect Production Schema
-- Run this in your Supabase SQL Editor
-- ====================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ====================================================
-- USERS TABLE (replaces auth.users metadata)
-- ====================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('family', 'caregiver', 'admin')),
  phone text,
  city text,
  state text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Family-specific data
create table public.family_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  elderly_name text,
  elderly_age integer,
  care_needs text[],
  address text,
  is_nri boolean default false,
  country_of_residence text,
  created_at timestamptz default now()
);

-- Caregiver-specific data
create table public.caregiver_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  specialty text not null,
  hourly_rate numeric(10,2) not null,
  experience_years integer default 0,
  bio text,
  languages text[],
  availability text[],
  aadhaar_verified boolean default false,
  police_checked boolean default false,
  background_verified boolean default false,
  rating numeric(3,2) default 0,
  total_reviews integer default 0,
  created_at timestamptz default now()
);

-- ====================================================
-- BOOKINGS TABLE
-- ====================================================
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references public.profiles(id) on delete set null,
  caregiver_id uuid references public.profiles(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  care_type text not null,
  start_date date not null,
  end_date date,
  shift_time text,
  notes text,
  total_hours numeric(6,2),
  total_amount numeric(10,2),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ====================================================
-- TIMESHEETS TABLE
-- ====================================================
create table public.timesheets (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete set null,
  caregiver_id uuid references public.profiles(id) on delete set null,
  family_id uuid references public.profiles(id) on delete set null,
  date date not null,
  clock_in time,
  clock_out time,
  hours_worked numeric(5,2) not null,
  tasks_completed text[],
  notes text,
  status text default 'pending' check (status in ('pending', 'approved', 'disputed')),
  created_at timestamptz default now()
);

-- ====================================================
-- PAYMENTS TABLE
-- ====================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete set null,
  family_id uuid references public.profiles(id) on delete set null,
  caregiver_id uuid references public.profiles(id) on delete set null,
  amount numeric(10,2) not null,
  currency text default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text default 'pending' check (status in ('pending', 'captured', 'failed', 'refunded')),
  created_at timestamptz default now()
);

-- ====================================================
-- REVIEWS TABLE
-- ====================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  caregiver_id uuid references public.profiles(id) on delete set null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ====================================================
-- CHAT SESSIONS and MESSAGES (RAG Counsellor)
-- ====================================================
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  session_type text default 'support' check (session_type in ('support', 'counsellor', 'onboarding')),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ====================================================
-- VOICE SESSIONS (Ultravox AI Counsellor)
-- ====================================================
create table public.voice_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ultravox_call_id text,
  status text default 'created' check (status in ('created', 'active', 'ended', 'failed')),
  language text default 'en',
  duration_seconds integer,
  transcript text,
  counsellor_notes text,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- ====================================================
-- RAG KNOWLEDGE BASE (pgvector)
-- ====================================================
create table public.knowledge_documents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  category text,
  source text,
  embedding vector(768),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Vector similarity search index
create index on public.knowledge_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ====================================================
-- NOTIFICATIONS
-- ====================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now()
);

-- ====================================================
-- SOS ALERTS
-- ====================================================
create table public.sos_alerts (
  id uuid default uuid_generate_v4() primary key,
  caregiver_id uuid references public.profiles(id) on delete set null,
  family_id uuid references public.profiles(id) on delete set null,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  status text default 'active' check (status in ('active', 'acknowledged', 'resolved')),
  notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ====================================================
-- ROW LEVEL SECURITY
-- ====================================================
alter table public.profiles enable row level security;
alter table public.family_profiles enable row level security;
alter table public.caregiver_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.timesheets enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.voice_sessions enable row level security;
alter table public.notifications enable row level security;

create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users see own bookings" on public.bookings for select
  using (auth.uid() = family_id or auth.uid() = caregiver_id);
create policy "Family can create bookings" on public.bookings for insert
  with check (auth.uid() = family_id);
create policy "Users can update own bookings" on public.bookings for update
  using (auth.uid() = family_id or auth.uid() = caregiver_id);

create policy "Users see own timesheets" on public.timesheets for select
  using (auth.uid() = caregiver_id or auth.uid() = family_id);
create policy "Caregiver can insert timesheets" on public.timesheets for insert
  with check (auth.uid() = caregiver_id);

create policy "Users see own chat sessions" on public.chat_sessions for select
  using (auth.uid() = user_id);
create policy "Users can create chat sessions" on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users see own notifications" on public.notifications for select
  using (auth.uid() = user_id);

create policy "Knowledge docs are public" on public.knowledge_documents for select using (true);

-- ====================================================
-- FUNCTIONS
-- ====================================================
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language sql stable
as $$
  select
    id, title, content, category,
    1 - (embedding <=> query_embedding) as similarity
  from public.knowledge_documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function update_updated_at();
create trigger chat_sessions_updated_at before update on public.chat_sessions
  for each row execute function update_updated_at();
