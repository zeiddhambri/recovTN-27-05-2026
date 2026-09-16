import type { Database } from '@/integrations/supabase/types';
import { calculerScore } from './scoring';
import type { DossierComplet } from './mock-data';

export type DossierRow = Database['public']['Tables']['dossiers']['Row'];
export type DossierStatus = DossierComplet['status'];

export const VALID_DOSSIER_STATUSES: DossierStatus[] = [
  'a_relancer',
  'en_relance',
  'promesse_paiement',
  'partiellement_paye',
  'paye',
  'contentieux',
];

/**
 * Maps a Supabase `dossiers` row to the app-level DossierComplet.
 * Behavioral inputs (payment history, reactivity) are not stored yet,
 * so neutral defaults are used — the score stays comparable across dossiers.
 */
export function dbRowToDossier(r: DossierRow): DossierComplet {
  const scoring = {
    montant: Number(r.amount),
    ancienneteJours: 30,
    tauxPaiementHistorique: 50,
    tauxReactivite: 50,
    typologieClient: 'pme' as const,
  };
  const status: DossierStatus = VALID_DOSSIER_STATUSES.includes(r.status as DossierStatus)
    ? (r.status as DossierStatus)
    : 'a_relancer';
  return {
    id: r.id,
    clientCode: r.client_code,
    debtorName: r.debtor_name,
    amount: Number(r.amount),
    status,
    managementLevel: r.management_level || 'recouvreur',
    agent: r.assigned_to || 'Non assigné',
    date: (r.due_date || r.created_at || '').slice(0, 10),
    scoring,
    scoringResult: calculerScore(scoring),
    typologieClient: 'pme',
  };
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
