-- Demo requests submitted from the public landing page.
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.demo_requests enable row level security;

-- Anyone can submit a demo request; reading is reserved for service role / admins.
drop policy if exists "Allow public demo requests" on public.demo_requests;
create policy "Allow public demo requests"
  on public.demo_requests
  for insert
  to anon, authenticated
  with check (true);
