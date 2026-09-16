import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sunrise, Flame, Wallet, Search, Phone, CalendarClock, ArrowRight,
  CheckCircle2, RotateCcw, Inbox, FileText, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { mockDossiers, statusConfig, type DossierComplet } from '@/lib/mock-data';
import { dbRowToDossier } from '@/lib/dossier-map';
import { recommendAction, priorityScore, isUrgent, duePromises, brokenPromises, type ActionTone } from '@/lib/worklist';
import {
  fetchAllPromises, readLocalPromises, addDaysISO, todayISO,
  type PaymentPromise,
} from '@/lib/dossier-activity';
import DemoBanner from '@/components/DemoBanner';

type Segment = 'all' | 'urgent' | 'promises';

const SNOOZE_KEY = 'recovtn:snoozed';

const TONE_CLS: Record<ActionTone, string> = {
  urgent: 'bg-red-50 border-red-200 text-red-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  done: 'bg-green-50 border-green-200 text-green-800',
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M TND`;
  if (n >= 1_000) return `${Math.round(n / 1000).toLocaleString('fr-FR')} k TND`;
  return `${n.toLocaleString('fr-FR')} TND`;
}

function loadSnoozed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

interface WorkItem {
  dossier: DossierComplet;
  promises: PaymentPromise[];
  priority: number;
  reasons: string[];
  urgent: boolean;
  hasPromiseAlert: boolean;
  phone: string | null;
}

export default function MaJournee() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<DossierComplet[] | null>(null);
  const [allPromises, setAllPromises] = useState<PaymentPromise[]>([]);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [snoozed, setSnoozed] = useState<Record<string, string>>(loadSnoozed);
  const [segment, setSegment] = useState<Segment>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) {
        setDossiers([]);
        return;
      }
      const [{ data }, promises] = await Promise.all([
        supabase.from('dossiers').select('*').order('created_at', { ascending: false }),
        fetchAllPromises(['pending', 'broken']).catch(() => [] as PaymentPromise[]),
      ]);
      if (!data || data.length === 0) {
        setDossiers([]);
        setAllPromises(readLocalPromises(mockDossiers.map((d) => d.id)));
        return;
      }
      setDossiers(data.map(dbRowToDossier));
      setAllPromises(promises);
      const phoneMap: Record<string, string> = {};
      data.forEach((r) => {
        if (r.debtor_phone) phoneMap[r.id] = r.debtor_phone;
      });
      setPhones(phoneMap);
    })();
  }, [user]);

  const loading = dossiers === null;
  const isDemo = !loading && dossiers.length === 0;
  const source = isDemo ? mockDossiers : (dossiers ?? []);

  const today = todayISO();
  const isSnoozed = (id: string) => (snoozed[id] ?? '') >= today;

  const items: WorkItem[] = useMemo(() => {
    const byDossier = new Map<string, PaymentPromise[]>();
    allPromises.forEach((p) => {
      const list = byDossier.get(p.dossier_id) ?? [];
      list.push(p);
      byDossier.set(p.dossier_id, list);
    });
    return source
      .filter((d) => d.status !== 'paye' && !isSnoozed(d.id))
      .map((d) => {
        const dp = byDossier.get(d.id) ?? [];
        const pr = priorityScore(d, dp);
        return {
          dossier: d,
          promises: dp,
          priority: pr.score,
          reasons: pr.reasons,
          urgent: isUrgent(d, dp),
          hasPromiseAlert: duePromises(dp).length > 0 || brokenPromises(dp).length > 0,
          phone: phones[d.id] ?? null,
        };
      })
      .sort((a, b) => b.priority - a.priority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, allPromises, phones, snoozed]);

  const stats = useMemo(() => {
    const urgentCount = items.filter((i) => i.urgent).length;
    const recoverable = items.reduce((s, i) => s + i.dossier.amount, 0);
    const snoozedCount = source.filter((d) => d.status !== 'paye' && isSnoozed(d.id)).length;
    return { urgentCount, recoverable, snoozedCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, source, snoozed]);

  const filtered = items.filter((i) => {
    if (segment === 'urgent' && !i.urgent) return false;
    if (segment === 'promises' && !i.hasPromiseAlert) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      i.dossier.debtorName.toLowerCase().includes(q) ||
      i.dossier.clientCode.toLowerCase().includes(q)
    );
  });

  const firstName =
    ((user?.user_metadata as { full_name?: string } | undefined)?.full_name || user?.email || '')
      .split(' ')[0] || 'Agent';

  const snooze = (id: string) => {
    const next = { ...snoozed, [id]: addDaysISO(1) };
    setSnoozed(next);
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
    } catch {
      /* session-only */
    }
    toast({ title: 'Dossier reporté', description: 'Il réapparaîtra dans votre file demain.' });
  };

  const unsnoozeAll = () => {
    setSnoozed({});
    try {
      localStorage.removeItem(SNOOZE_KEY);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sunrise size={14} aria-hidden />
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
        <h1 className="text-3xl font-black text-navy tracking-tight font-syne mt-1">
          Bonjour {firstName} — voici votre journée
        </h1>
        <p className="text-muted-foreground mt-1">
          Dossiers triés par priorité de recouvrement : risque × exposition × événements.
        </p>
      </div>

      {isDemo && (
        <DemoBanner text="Portefeuille d'exemple — créez des dossiers réels pour obtenir votre vraie file de travail." />
      )}

      {/* ─── Summary ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={20} aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black text-navy">{loading ? '…' : items.length}</p>
            <p className="text-xs text-muted-foreground">dossiers à traiter</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Flame size={20} aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black text-navy">{loading ? '…' : stats.urgentCount}</p>
            <p className="text-xs text-muted-foreground">urgences</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Wallet size={20} aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black text-navy">{loading ? '…' : fmtCompact(stats.recoverable)}</p>
            <p className="text-xs text-muted-foreground">recouvrables</p>
          </div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
          {(
            [
              { key: 'all', label: 'Tous' },
              { key: 'urgent', label: 'Urgences' },
              { key: 'promises', label: 'Promesses à risque' },
            ] as { key: Segment; label: string }[]
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-bold transition-all',
                segment === s.key ? 'bg-card shadow text-navy' : 'text-muted-foreground hover:text-navy'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par débiteur, code…"
            aria-label="Filtrer la file de travail"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all"
          />
        </div>
        {stats.snoozedCount > 0 && (
          <button
            onClick={unsnoozeAll}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-navy transition"
          >
            <RotateCcw size={13} aria-hidden />
            {stats.snoozedCount} reporté{stats.snoozedCount > 1 ? 's' : ''} — tout réafficher
          </button>
        )}
      </div>

      {/* ─── Worklist ─── */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-10 text-center" role="status">
          Chargement de votre file…
        </p>
      ) : source.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <Inbox size={30} className="mx-auto text-muted-foreground mb-3" aria-hidden />
          <p className="font-bold text-navy">Aucun dossier pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Créez votre premier dossier pour démarrer votre file de travail.</p>
          <Link
            to="/dossiers"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all"
          >
            <Plus size={16} /> Aller aux dossiers
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <CheckCircle2 size={30} className="mx-auto text-green-600 mb-3" aria-hidden />
          <p className="font-bold text-navy">Journée terminée — beau travail !</p>
          <p className="text-sm text-muted-foreground mt-1">
            {segment !== 'all' || search ? 'Aucun dossier ne correspond à ces filtres.' : 'Plus aucun dossier dans votre file.'}
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {filtered.map((item, rank) => {
            const action = recommendAction(item.dossier, item.promises);
            return (
              <li
                key={item.dossier.id}
                className="bg-card rounded-3xl border border-border p-5 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0',
                      rank < 3 ? 'bg-navy text-white' : 'bg-mist text-muted-foreground'
                    )}
                    aria-label={`Priorité ${rank + 1}`}
                  >
                    {rank + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <Link
                          to={`/dossiers/${item.dossier.id}`}
                          className="font-bold text-navy hover:text-[hsl(var(--crimson))] transition break-words"
                        >
                          {item.dossier.debtorName}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">{item.dossier.clientCode}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-navy">{fmtCompact(item.dossier.amount)}</p>
                        <span
                          className={cn(
                            'inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full',
                            statusConfig[item.dossier.status].color
                          )}
                        >
                          {statusConfig[item.dossier.status].label}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-2 flex-wrap" aria-label="Motifs de priorité">
                      {item.reasons.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mist text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <div className={cn('mt-3 p-3 rounded-xl border text-sm', TONE_CLS[action.tone])}>
                      <p className="font-bold">{action.label}</p>
                      <p className="text-xs mt-0.5 opacity-90">{action.detail}</p>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link
                        to={action.href}
                        className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all"
                      >
                        Traiter <ArrowRight size={13} aria-hidden />
                      </Link>
                      <Link
                        to={`/dossiers/${item.dossier.id}#promesses`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-mist transition-all"
                      >
                        <Wallet size={13} aria-hidden /> Promesse
                      </Link>
                      {item.phone && (
                        <a
                          href={`tel:${item.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-mist transition-all"
                        >
                          <Phone size={13} aria-hidden /> Appeler
                        </a>
                      )}
                      <button
                        onClick={() => snooze(item.dossier.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-mist transition-all"
                      >
                        <CalendarClock size={13} aria-hidden /> Reporter
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
