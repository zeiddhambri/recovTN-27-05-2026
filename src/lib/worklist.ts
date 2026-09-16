import type { DossierComplet } from './mock-data';
import { daysUntil, type PaymentPromise } from './dossier-activity';

export type ActionTone = 'urgent' | 'warn' | 'info' | 'done';

export interface RecommendedAction {
  label: string;
  detail: string;
  /** Where the primary button leads. */
  href: string;
  tone: ActionTone;
}

export const pendingPromises = (list: PaymentPromise[]) => list.filter((p) => p.status === 'pending');
export const brokenPromises = (list: PaymentPromise[]) => list.filter((p) => p.status === 'broken');
export const duePromises = (list: PaymentPromise[]) =>
  list.filter((p) => p.status === 'pending' && daysUntil(p.due_date) <= 0);

/**
 * Rule-based next-best-action. Transparent by design: every recommendation
 * maps to a visible dossier state (no black box).
 */
export function recommendAction(d: DossierComplet, promises: PaymentPromise[]): RecommendedAction {
  const fiche = `/dossiers/${d.id}`;

  if (brokenPromises(promises).length > 0) {
    return {
      label: 'Relancer la promesse rompue',
      detail: 'Une promesse n’a pas été tenue — requalifier et ré-escalader sans attendre.',
      href: `${fiche}#promesses`,
      tone: 'urgent',
    };
  }
  const due = duePromises(promises);
  if (due.length > 0) {
    return {
      label: 'Confirmer la promesse due',
      detail: `${due.length} promesse${due.length > 1 ? 's' : ''} arrive${due.length > 1 ? 'nt' : ''} à échéance — vérifier l’encaissement.`,
      href: `${fiche}#promesses`,
      tone: 'urgent',
    };
  }
  switch (d.status) {
    case 'contentieux':
      return {
        label: 'Suivre le contentieux',
        detail: 'Dossier en procédure — vérifier les échéances et l’avancement.',
        href: '/litigation',
        tone: 'warn',
      };
    case 'a_relancer':
      return d.scoringResult.score >= 70
        ? {
            label: 'Appeler en priorité',
            detail: `Score risque ${d.scoringResult.score}/100 — contact direct recommandé.`,
            href: fiche,
            tone: 'urgent',
          }
        : {
            label: 'Envoyer la première relance',
            detail: 'Aucune relance émise — démarrer le scénario adapté.',
            href: '/relances',
            tone: 'info',
          };
    case 'en_relance':
      return {
        label: 'Poursuivre la relance',
        detail: 'Séquence en cours — passer au canal suivant si silence.',
        href: '/relances',
        tone: d.scoringResult.score >= 70 ? 'warn' : 'info',
      };
    case 'promesse_paiement':
      return {
        label: 'Suivre la promesse',
        detail: 'Promesse enregistrée — surveiller l’échéance.',
        href: `${fiche}#promesses`,
        tone: 'warn',
      };
    case 'partiellement_paye':
      return {
        label: 'Relancer le solde',
        detail: 'Paiement partiel reçu — relancer sur le reliquat.',
        href: fiche,
        tone: 'warn',
      };
    case 'paye':
      return { label: 'Dossier soldé', detail: 'Rien à faire — dossier clôturé.', href: fiche, tone: 'done' };
  }
}

export interface Priority {
  score: number;
  reasons: string[];
}

/**
 * Transparent priority: risk score scaled by exposure, plus event boosts.
 * Reasons are surfaced in the UI so agents trust the ranking.
 */
export function priorityScore(d: DossierComplet, promises: PaymentPromise[]): Priority {
  const reasons: string[] = [`Score ${d.scoringResult.score}`];
  let s = d.scoringResult.score * (1 + Math.min(d.amount, 2_000_000) / 1_000_000);
  if (d.amount >= 100_000) reasons.push(`${Math.round(d.amount / 1000)} kTND`);
  if (brokenPromises(promises).length > 0) {
    s += 40;
    reasons.push('Promesse rompue');
  }
  if (duePromises(promises).length > 0) {
    s += 30;
    reasons.push('Promesse due');
  }
  if (d.status === 'contentieux') {
    s += 10;
    reasons.push('Contentieux');
  }
  return { score: Math.round(s), reasons };
}

export function isUrgent(d: DossierComplet, promises: PaymentPromise[]): boolean {
  return (
    d.scoringResult.score >= 70 || brokenPromises(promises).length > 0 || duePromises(promises).length > 0
  );
}
