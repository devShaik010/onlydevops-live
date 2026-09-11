-- Launch schema for the Vercel API. The API connects with a server-side
-- database URL; the Data API is intentionally not used for these tables.
create table if not exists public.accounts (
  id uuid primary key,
  username text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  token_hash text primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.progress (
  learner uuid not null,
  item_id text not null,
  completed_at timestamptz not null default now(),
  primary key (learner, item_id)
);

create table if not exists public.practice_progress (
  learner uuid not null,
  challenge_id text not null,
  version integer not null,
  choice_id text not null,
  correct boolean not null,
  updated_at timestamptz not null default now(),
  primary key (learner, challenge_id)
);

create table if not exists public.auth_limits (
  bucket text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);

alter table public.accounts enable row level security;
alter table public.sessions enable row level security;
alter table public.progress enable row level security;
alter table public.practice_progress enable row level security;
alter table public.auth_limits enable row level security;

-- No anon/authenticated Data API policies are granted. The Vercel API uses
-- The server-side Supabase service role remains the only application data boundary.
revoke all on public.accounts, public.sessions, public.progress,
  public.practice_progress, public.auth_limits from anon, authenticated;

create index if not exists sessions_expiry_idx on public.sessions (expires_at);
create index if not exists progress_learner_idx on public.progress (learner);
create index if not exists practice_progress_learner_idx on public.practice_progress (learner);
