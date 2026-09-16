import { supabase } from '@/integrations/supabase/client';

// ─── Types ───

export type OnboardingStepId = 'import' | 'qualifier' | 'relancer' | 'encaisser';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  detail: string;
  cta: string;
  to: string;
  done: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  doneCount: number;
  total: number;
  allDone: boolean;
}

// ─── Dismiss state (localStorage, per user) ───

const keyFor = (userId: string) => `recovtn-onboarding-masque:${userId || 'anon'}`;

export function isOnboardingHidden(userId: string): boolean {
  try {
    return localStorage.getItem(keyFor(userId)) === '1';
  } catch {
    return false;
  }
}

export function hideOnboarding(userId: string): void {
  try {
    localStorage.setItem(keyFor(userId), '1');
  } catch {
    /* stockage indisponible : on ignore */
  }
}

// ─── Real progress detection ───

async function count(table: string, match?: Record<string, string>): Promise<number> {
  try {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (match) {
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    }
    const { count: n } = await q;
    return n ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Détecte la progression réelle de l'utilisateur : chaque étape est validée
 * par des données existantes (jamais par un simple clic « j'ai compris »).
 */
export async function fetchOnboardingProgress(): Promise<OnboardingProgress> {
  const [dossiers, notes, promises, envois, kept, partial] = await Promise.all([
    count('dossiers'),
    count('dossier_notes'),
    count('payment_promises'),
    count('relance_envois'),
    count('payment_promises', { status: 'kept' }),
    count('payment_promises', { status: 'partial' }),
  ]);

  const steps: OnboardingStep[] = [
    {
      id: 'import',
      title: 'Importez votre portefeuille',
      detail: 'Chargez vos créances depuis Excel ou CSV pour peupler votre file de travail.',
      cta: 'Importer',
      to: '/leasing/import',
      done: dossiers > 0,
    },
    {
      id: 'qualifier',
      title: 'Qualifiez un dossier',
      detail: 'Ouvrez une fiche, ajoutez une note ou enregistrez une promesse de paiement.',
      cta: 'Voir les dossiers',
      to: '/dossiers',
      done: notes > 0 || promises > 0,
    },
    {
      id: 'relancer',
      title: 'Envoyez votre première relance',
      detail: 'Depuis une fiche dossier, envoyez un email de relance suivi (ouvertures, clics).',
      cta: 'Choisir un dossier',
      to: '/dossiers',
      done: envois > 0,
    },
    {
      id: 'encaisser',
      title: 'Encaissez votre premier euro',
      detail: 'Quand une promesse est tenue, marquez-la : c\'est votre premier euro recouvré.',
      cta: 'Suivre mes promesses',
      to: '/aujourdhui',
      done: kept > 0 || partial > 0,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, total: steps.length, allDone: doneCount === steps.length };
}
