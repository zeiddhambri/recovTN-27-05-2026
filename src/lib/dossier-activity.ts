import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// ─── Types ───

export type PromiseStatus = 'pending' | 'kept' | 'partial' | 'broken';

export interface DossierNote {
  id: string;
  dossier_id: string;
  content: string;
  created_at: string;
  author?: string;
}

export interface PaymentPromise {
  id: string;
  dossier_id: string;
  amount: number;
  due_date: string;
  channel: string;
  status: PromiseStatus;
  note: string | null;
  created_at: string;
}

type NoteRow = Database['public']['Tables']['dossier_notes']['Row'];
type PromiseRow = Database['public']['Tables']['payment_promises']['Row'];

export const PROMISE_STATUS_CONFIG: Record<PromiseStatus, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'text-blue-600 bg-blue-50' },
  kept: { label: 'Tenue', cls: 'text-green-700 bg-green-50' },
  partial: { label: 'Partielle', cls: 'text-amber-700 bg-amber-50' },
  broken: { label: 'Rompue', cls: 'text-red-600 bg-red-50' },
};

export const PROMISE_CHANNELS = [
  { value: 'appel', label: 'Appel' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visite', label: 'Visite' },
  { value: 'courrier', label: 'Courrier' },
] as const;

// ─── Date helpers (day-precision, timezone-safe) ───

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today to `isoDate` (negative = overdue). */
export function daysUntil(isoDate: string): number {
  const toDay = (s: string) => {
    const d = new Date(`${s.slice(0, 10)}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  return Math.round((toDay(isoDate) - toDay(todayISO())) / 86_400_000);
}

export function dueLabel(isoDate: string): string {
  const n = daysUntil(isoDate);
  if (n < 0) return `En retard de ${-n} j`;
  if (n === 0) return "Due aujourd'hui";
  if (n === 1) return 'Due demain';
  return `Due dans ${n} j`;
}

// ─── Local fallback (demo dossiers live in localStorage) ───

function lsKey(kind: 'notes' | 'promises', dossierId: string) {
  return `recovtn:${kind}:${dossierId}`;
}

function lsRead<T>(kind: 'notes' | 'promises', dossierId: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(lsKey(kind, dossierId)) || '[]') as T[];
  } catch {
    return [];
  }
}

function lsWrite<T>(kind: 'notes' | 'promises', dossierId: string, items: T[]) {
  try {
    localStorage.setItem(lsKey(kind, dossierId), JSON.stringify(items));
  } catch {
    /* session-only */
  }
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Notes ───

function noteRowToNote(r: NoteRow): DossierNote {
  return { id: r.id, dossier_id: r.dossier_id, content: r.content, created_at: r.created_at };
}

export async function fetchNotes(dossierId: string, isDemo: boolean): Promise<DossierNote[]> {
  if (isDemo) {
    return lsRead<DossierNote>('notes', dossierId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  const { data, error } = await supabase
    .from('dossier_notes')
    .select('*')
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(noteRowToNote);
}

export async function createNote(
  dossierId: string,
  userId: string,
  content: string,
  isDemo: boolean
): Promise<void> {
  const text = content.trim();
  if (!text) throw new Error('Note vide.');
  if (isDemo) {
    const items = lsRead<DossierNote>('notes', dossierId);
    items.push({ id: uid(), dossier_id: dossierId, content: text, created_at: new Date().toISOString() });
    lsWrite('notes', dossierId, items);
    return;
  }
  const { error } = await supabase.from('dossier_notes').insert({ dossier_id: dossierId, user_id: userId, content: text });
  if (error) throw new Error(error.message);
}

export async function deleteNote(id: string, dossierId: string, isDemo: boolean): Promise<void> {
  if (isDemo) {
    lsWrite(
      'notes',
      dossierId,
      lsRead<DossierNote>('notes', dossierId).filter((n) => n.id !== id)
    );
    return;
  }
  const { error } = await supabase.from('dossier_notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Promises ───

function promiseRowToPromise(r: PromiseRow): PaymentPromise {
  const valid: PromiseStatus[] = ['pending', 'kept', 'partial', 'broken'];
  return {
    id: r.id,
    dossier_id: r.dossier_id,
    amount: Number(r.amount),
    due_date: r.due_date,
    channel: r.channel,
    status: valid.includes(r.status as PromiseStatus) ? (r.status as PromiseStatus) : 'pending',
    note: r.note,
    created_at: r.created_at,
  };
}

export async function fetchPromises(dossierId: string, isDemo: boolean): Promise<PaymentPromise[]> {
  if (isDemo) {
    return lsRead<PaymentPromise>('promises', dossierId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  const { data, error } = await supabase
    .from('payment_promises')
    .select('*')
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(promiseRowToPromise);
}

export async function fetchAllPromises(statuses?: PromiseStatus[]): Promise<PaymentPromise[]> {
  let query = supabase.from('payment_promises').select('*');
  if (statuses) query = query.in('status', statuses);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(promiseRowToPromise);
}

/** Demo mode: promises live in localStorage, keyed per dossier. */
export function readLocalPromises(dossierIds: string[]): PaymentPromise[] {
  return dossierIds.flatMap((id) => lsRead<PaymentPromise>('promises', id));
}

export interface NewPromise {
  amount: number;
  due_date: string;
  channel: string;
  note?: string;
}

export async function createPromise(
  dossierId: string,
  userId: string,
  p: NewPromise,
  isDemo: boolean
): Promise<void> {
  if (!(p.amount > 0)) throw new Error('Montant invalide.');
  if (!p.due_date) throw new Error('Date requise.');
  if (isDemo) {
    const items = lsRead<PaymentPromise>('promises', dossierId);
    items.push({
      id: uid(),
      dossier_id: dossierId,
      amount: p.amount,
      due_date: p.due_date,
      channel: p.channel,
      status: 'pending',
      note: p.note?.trim() || null,
      created_at: new Date().toISOString(),
    });
    lsWrite('promises', dossierId, items);
    return;
  }
  const { error } = await supabase.from('payment_promises').insert({
    dossier_id: dossierId,
    user_id: userId,
    amount: p.amount,
    due_date: p.due_date,
    channel: p.channel,
    note: p.note?.trim() || null,
  });
  if (error) throw new Error(error.message);
}

export async function setPromiseStatus(
  id: string,
  dossierId: string,
  status: PromiseStatus,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    lsWrite(
      'promises',
      dossierId,
      lsRead<PaymentPromise>('promises', dossierId).map((p) => (p.id === id ? { ...p, status } : p))
    );
    return;
  }
  const { error } = await supabase.from('payment_promises').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
