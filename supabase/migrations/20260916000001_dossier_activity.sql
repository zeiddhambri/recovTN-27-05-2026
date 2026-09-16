-- Dossier activity: agent notes + tracked payment promises.
-- Owner-based RLS, mirroring the dossiers table.

create table if not exists public.dossier_notes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.dossier_notes enable row level security;

drop policy if exists "Users view own dossier notes" on public.dossier_notes;
create policy "Users view own dossier notes"
  on public.dossier_notes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own dossier notes" on public.dossier_notes;
create policy "Users insert own dossier notes"
  on public.dossier_notes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete own dossier notes" on public.dossier_notes;
create policy "Users delete own dossier notes"
  on public.dossier_notes for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.payment_promises (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  user_id uuid not null,
  amount numeric not null,
  due_date date not null,
  channel text not null default 'appel',
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

alter table public.payment_promises enable row level security;

drop policy if exists "Users view own promises" on public.payment_promises;
create policy "Users view own promises"
  on public.payment_promises for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own promises" on public.payment_promises;
create policy "Users insert own promises"
  on public.payment_promises for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own promises" on public.payment_promises;
create policy "Users update own promises"
  on public.payment_promises for update to authenticated using (auth.uid() = user_id);
drop policy if exists "Users delete own promises" on public.payment_promises;
create policy "Users delete own promises"
  on public.payment_promises for delete to authenticated using (auth.uid() = user_id);
