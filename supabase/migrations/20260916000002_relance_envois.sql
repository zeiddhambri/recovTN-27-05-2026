-- Outbound relance sends (email first, SMS/WhatsApp later).
-- One row per send, updated by provider webhooks (delivery/open/click/bounce).

create table if not exists public.relance_envois (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dossier_id uuid references public.dossiers(id) on delete set null,
  scenario_id text,
  etape_id text,
  canal text not null default 'email',
  destinataire text not null,
  sujet text,
  statut text not null default 'queued',
  provider_id text,
  error text,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists relance_envois_provider_idx on public.relance_envois (provider_id);
create index if not exists relance_envois_dossier_idx on public.relance_envois (dossier_id);

alter table public.relance_envois enable row level security;

drop policy if exists "Users view own envois" on public.relance_envois;
create policy "Users view own envois"
  on public.relance_envois for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own envois" on public.relance_envois;
create policy "Users insert own envois"
  on public.relance_envois for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete own envois" on public.relance_envois;
create policy "Users delete own envois"
  on public.relance_envois for delete to authenticated using (auth.uid() = user_id);
