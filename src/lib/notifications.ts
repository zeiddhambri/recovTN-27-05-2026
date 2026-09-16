import { supabase } from '@/integrations/supabase/client';
import { fetchAllPromises, todayISO, daysUntil } from './dossier-activity';
import { isUuid } from './dossier-map';

// ─── Types ───

export interface AppNotification {
  id: string;
  kind: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
  link: string;
}

// ─── Read state (localStorage) ───

const READ_KEY = 'recovtn-notifs-lues:v1';

export function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markAllRead(ids: string[]): void {
  try {
    const s = readIds();
    ids.forEach((i) => s.add(i));
    localStorage.setItem(READ_KEY, JSON.stringify([...s].slice(-300)));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

// ─── Helpers ───

const fmtTND = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DT`;
const fmtDate = (iso: string) => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('fr-FR');
};

// ─── Sources ───

/**
 * Construit les notifications depuis les données réelles :
 * promesses dues / en retard / rompues + emails non distribués.
 * Chaque source est isolée : si une table est absente (migration non
 * appliquée) ou hors-ligne, elle est simplement ignorée.
 */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const notifs: AppNotification[] = [];
  const today = todayISO();

  // 1. Promesses de paiement
  try {
    const promises = await fetchAllPromises();
    const uuids = [...new Set(promises.map((p) => p.dossier_id).filter((id) => isUuid(id)))];
    const names = new Map<string, string>();
    if (uuids.length > 0) {
      const { data } = await supabase.from('dossiers').select('id, debtor_name').in('id', uuids);
      (data ?? []).forEach((r) => names.set(r.id, r.debtor_name ?? 'Dossier'));
    }
    for (const p of promises) {
      const who = names.get(p.dossier_id) ?? 'Dossier';
      const link = `/dossiers/${p.dossier_id}`;
      if (p.status === 'broken') {
        notifs.push({
          id: `promesse-rompue-${p.id}`,
          kind: 'danger',
          title: `Promesse rompue — ${who}`,
          detail: `${fmtTND(p.amount)} · due le ${fmtDate(p.due_date)}`,
          link,
        });
      } else if (p.status === 'pending') {
        const d = daysUntil(p.due_date);
        if (d < 0) {
          notifs.push({
            id: `promesse-retard-${p.id}-${p.due_date}`,
            kind: 'danger',
            title: `Promesse en retard — ${who}`,
            detail: `${fmtTND(p.amount)} · due depuis ${-d} j (${fmtDate(p.due_date)})`,
            link,
          });
        } else if (d === 0) {
          notifs.push({
            id: `promesse-jour-${p.id}-${today}`,
            kind: 'warning',
            title: `Promesse due aujourd'hui — ${who}`,
            detail: `${fmtTND(p.amount)} · canal ${p.channel}`,
            link,
          });
        }
      }
    }
  } catch {
    /* promesses indisponibles : on ignore cette source */
  }

  // 2. Emails non distribués (bounce / échec / plainte spam)
  try {
    const { data } = await supabase
      .from('relance_envois')
      .select('id, dossier_id, statut, created_at')
      .in('statut', ['bounced', 'failed', 'complained'])
      .order('created_at', { ascending: false })
      .limit(10);
    for (const e of data ?? []) {
      notifs.push({
        id: `envoi-${e.id}`,
        kind: 'danger',
        title: e.statut === 'complained' ? 'Plainte spam sur un email' : 'Email non distribué',
        detail: `Envoi du ${fmtDate(e.created_at)} — vérifier l'adresse sur la fiche`,
        link: `/dossiers/${e.dossier_id}`,
      });
    }
  } catch {
    /* table relance_envois absente (migration non appliquée) : on ignore */
  }

  return notifs.slice(0, 20);
}
