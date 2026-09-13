alter table public.accounts
  add column if not exists privacy_accepted_at timestamptz;
