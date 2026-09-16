// Seeds a realistic, freshly-dated demo portfolio into Supabase.
// Usage:
//   SEED_EMAIL=you@company.tn SEED_PASSWORD=secret npm run seed:demo
// Reads VITE_SUPABASE_URL from .env (or SUPABASE_URL env var).
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const out = { ...process.env };
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = env.SEED_EMAIL;
const password = env.SEED_PASSWORD;

if (!url || !anonKey) {
  console.error('Missing Supabase URL / anon key (.env or SUPABASE_URL / SUPABASE_ANON_KEY).');
  process.exit(1);
}
if (!email || !password) {
  console.error('Missing SEED_EMAIL / SEED_PASSWORD env vars.');
  process.exit(1);
}

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const DEMO = [
  ['RCV-2026-101', 'SOCIETE ALPHA SARL', 145000, 'en_relance', 'Ahmed B.', 12],
  ['RCV-2026-102', 'BEN SALEM AHMED', 22000, 'contentieux', 'Sami K.', 40],
  ['RCV-2026-103', 'GLOBAL TECH TUNISIE', 890000, 'a_relancer', 'Leila M.', 5],
  ['RCV-2026-104', 'KARIM ENTERPRISES', 56000, 'paye', 'Ahmed B.', 60],
  ['RCV-2026-105', 'MEDITERANEE INVEST', 320000, 'promesse_paiement', 'Leila M.', 20],
  ['RCV-2026-106', 'TUNISAIR HANDLING', 78000, 'en_relance', 'Sami K.', 25],
  ['RCV-2026-107', 'CARTHAGE CEMENT', 1200000, 'contentieux', 'Ahmed B.', 90],
  ['RCV-2026-108', 'STAR ASSURANCES', 45000, 'a_relancer', 'Leila M.', 3],
  ['RCV-2026-109', 'BANQUE DE TUNISIE', 560000, 'partiellement_paye', 'Sami K.', 33],
  ['RCV-2026-110', 'SLIM TRADING', 18000, 'promesse_paiement', 'Leila M.', 9],
  ['RCV-2026-111', 'LES TOURTERELLES SA', 67000, 'a_relancer', 'Ahmed B.', 2],
  ['RCV-2026-112', 'CAP BON PECHE', 94000, 'en_relance', 'Sami K.', 15],
];

const supabase = createClient(url, anonKey);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr || !auth.user) {
  console.error('Sign-in failed:', authErr?.message);
  process.exit(1);
}

const rows = DEMO.map(([code, name, amount, status, agent, age]) => ({
  user_id: auth.user.id,
  client_code: code,
  debtor_name: name,
  amount,
  status,
  assigned_to: agent,
  management_level: amount > 500000 ? 'comite' : amount > 100000 ? 'directeur' : 'recouvreur',
  due_date: daysAgo(Math.max(0, age - 30)),
}));

// Idempotent: clear previous demo batch, then insert fresh rows.
await supabase.from('dossiers').delete().like('client_code', 'RCV-2026-1%');
const { data, error } = await supabase.from('dossiers').insert(rows).select('id');
if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
console.log(`Seeded ${data?.length ?? rows.length} demo dossiers for ${email}.`);
