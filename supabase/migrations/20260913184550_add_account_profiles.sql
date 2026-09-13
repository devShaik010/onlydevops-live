alter table public.accounts
  add column if not exists display_name text,
  add column if not exists email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'accounts_display_name_length'
      and conrelid = 'public.accounts'::regclass
  ) then
    alter table public.accounts
      add constraint accounts_display_name_length
      check (display_name is null or char_length(display_name) between 2 and 50);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'accounts_email_length'
      and conrelid = 'public.accounts'::regclass
  ) then
    alter table public.accounts
      add constraint accounts_email_length
      check (email is null or char_length(email) between 3 and 254);
  end if;
end $$;
