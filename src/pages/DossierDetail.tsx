import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Calendar, User, Plus, Trash2, CheckCircle2, XCircle,
  AlertTriangle, Clock, Wallet, StickyNote, Activity, Zap, ChevronDown, Inbox,
  Send, CircleDot, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { mockDossiers, statusConfig, type DossierComplet } from '@/lib/mock-data';
import { classificationConfig } from '@/lib/scoring';
import { mockRelanceExecutions, mockScenarios, canalConfig, statutRelanceConfig } from '@/lib/relance';
import { dbRowToDossier, isUuid, VALID_DOSSIER_STATUSES, type DossierStatus } from '@/lib/dossier-map';
import { recommendAction, type ActionTone } from '@/lib/worklist';
import {
  fetchNotes, createNote, deleteNote, fetchPromises, createPromise, setPromiseStatus,
  PROMISE_STATUS_CONFIG, PROMISE_CHANNELS, addDaysISO, dueLabel, daysUntil,
  type DossierNote, type PaymentPromise, type PromiseStatus,
} from '@/lib/dossier-activity';
import DemoBanner from '@/components/DemoBanner';
import EnvoyerEmailDialog from '@/components/dossiers/EnvoyerEmailDialog';
import { fetchEnvois, envoiStatus, type Envoi } from '@/lib/messaging';

type TabKey = 'timeline' | 'notes' | 'promesses';

const fmtTND = (n: number) => `${n.toLocaleString('fr-FR')} TND`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const scoreColor = (s: number) => (s >= 70 ? '#dc2626' : s >= 40 ? '#d97706' : '#16a34a');

/** Must mirror the weights in src/lib/scoring.ts */
const SCORE_FACTORS = [
  { key: 'scoreMontant', label: 'Montant exposé', weight: 25 },
  { key: 'scoreAnciennete', label: 'Ancienneté', weight: 20 },
  { key: 'scoreHistorique', label: 'Historique de paiement', weight: 25 },
  { key: 'scoreReactivite', label: 'Réactivité aux relances', weight: 20 },
  { key: 'scoreTypologie', label: 'Typologie client', weight: 10 },
] as const;

const TONE_CLS: Record<ActionTone, string> = {
  urgent: 'bg-red-50 border-red-200 text-red-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  done: 'bg-green-50 border-green-200 text-green-800',
};

interface TimelineEvent {
  key: string;
  date: string;
  icon: typeof Plus;
  iconCls: string;
  title: string;
  detail?: string;
}

export default function DossierDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const tabsRef = useRef<HTMLDivElement>(null);

  const [dossier, setDossier] = useState<DossierComplet | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [contact, setContact] = useState<{ email: string | null; phone: string | null }>({ email: null, phone: null });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showScoreWhy, setShowScoreWhy] = useState(false);

  const [notes, setNotes] = useState<DossierNote[]>([]);
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [promises, setPromises] = useState<PaymentPromise[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [pAmount, setPAmount] = useState('');
  const [pDue, setPDue] = useState(addDaysISO(7));
  const [pChannel, setPChannel] = useState<string>('appel');
  const [pNote, setPNote] = useState('');
  const [savingPromise, setSavingPromise] = useState(false);

  const tab: TabKey =
    location.hash === '#promesses' ? 'promesses' : location.hash === '#notes' ? 'notes' : 'timeline';

  // ─── Load dossier ───
  useEffect(() => {
    (async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const mock = mockDossiers.find((d) => d.id === id);
      if (mock) {
        setDossier(mock);
        setIsDemo(true);
        setPAmount(String(mock.amount));
        setLoading(false);
        return;
      }
      if (!isUuid(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('dossiers').select('*').eq('id', id).single();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const mapped = dbRowToDossier(data);
      setDossier(mapped);
      setContact({ email: data.debtor_email, phone: data.debtor_phone });
      setIsDemo(false);
      setPAmount(String(mapped.amount));
      setLoading(false);
    })();
  }, [id]);

  const reloadActivity = async (d: DossierComplet, demo: boolean) => {
    try {
      const [n, p, e] = await Promise.all([
        fetchNotes(d.id, demo),
        fetchPromises(d.id, demo),
        demo ? Promise.resolve([] as Envoi[]) : fetchEnvois(d.id),
      ]);
      setNotes(n);
      setPromises(p);
      setEnvois(e);
    } catch (e) {
      toast({
        title: 'Historique indisponible',
        description: e instanceof Error ? e.message : 'Réessayez.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (dossier) reloadActivity(dossier, isDemo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossier?.id, isDemo]);

  // Deep-link scroll (#notes / #promesses)
  useEffect(() => {
    if (location.hash && tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const timeline: TimelineEvent[] = useMemo(() => {
    if (!dossier) return [];
    const events: TimelineEvent[] = [
      { key: 'created', date: dossier.date, icon: Plus, iconCls: 'bg-mist text-muted-foreground', title: 'Dossier ouvert' },
    ];
    mockRelanceExecutions
      .filter((rx) => rx.dossierId === dossier.id)
      .forEach((rx) => {
        const scenario = mockScenarios.find((s) => s.id === rx.scenarioId)?.nom ?? 'Scénario';
        events.push({
          key: rx.id,
          date: rx.dateEnvoi,
          icon: Send,
          iconCls: cn(
            rx.statut === 'echouee' && 'bg-red-50 text-red-600',
            rx.statut === 'repondue' && 'bg-green-50 text-green-600',
            (rx.statut === 'envoyee' || rx.statut === 'planifiee' || rx.statut === 'annulee') &&
              'bg-blue-50 text-blue-600'
          ),
          title: `${canalConfig[rx.canal].label} — ${statutRelanceConfig[rx.statut].label} (${scenario})`,
          detail: rx.commentaire,
        });
      });
    notes.forEach((n) =>
      events.push({
        key: `note-${n.id}`,
        date: n.created_at,
        icon: StickyNote,
        iconCls: 'bg-purple-50 text-purple-600',
        title: 'Note agent',
        detail: n.content,
      })
    );
    promises.forEach((p) => {
      events.push({
        key: `promise-${p.id}`,
        date: p.created_at,
        icon: Wallet,
        iconCls: 'bg-amber-50 text-amber-600',
        title: `Promesse de ${fmtTND(p.amount)} — ${PROMISE_STATUS_CONFIG[p.status].label}`,
        detail: p.note ?? undefined,
      });
      if (p.status === 'pending') {
        events.push({
          key: `promise-due-${p.id}`,
          date: p.due_date,
          icon: daysUntil(p.due_date) < 0 ? AlertTriangle : Clock,
          iconCls: daysUntil(p.due_date) < 0 ? 'bg-red-50 text-red-600' : 'bg-mist text-muted-foreground',
          title: `Échéance promise : ${fmtTND(p.amount)} — ${dueLabel(p.due_date)}`,
        });
      }
    });
    envois.forEach((e) => {
      const st = envoiStatus(e.statut);
      events.push({
        key: `envoi-${e.id}`,
        date: e.created_at,
        icon: Mail,
        iconCls: st.cls,
        title: `Email — ${st.label} : ${e.sujet ?? '(sans objet)'}`,
        detail: `À ${e.destinataire}${e.opened_at ? ` · ouvert le ${fmtDateTime(e.opened_at)}` : ''}${e.clicked_at ? ` · cliqué le ${fmtDateTime(e.clicked_at)}` : ''}${e.error ? ` · ${e.error}` : ''}`,
      });
    });
    return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [dossier, notes, promises, envois]);

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm" role="status">
        Chargement du dossier…
      </div>
    );
  }

  if (notFound || !dossier) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Dossier introuvable.</p>
        <Link to="/dossiers" className="text-[hsl(var(--crimson))] font-semibold mt-2 inline-block">
          ← Retour aux dossiers
        </Link>
      </div>
    );
  }

  const cls = classificationConfig[dossier.scoringResult.classification];
  const action = recommendAction(dossier, promises);

  const handleStatusChange = async (status: DossierStatus) => {
    if (isDemo) return;
    const { error } = await supabase.from('dossiers').update({ status }).eq('id', dossier.id);
    if (error) {
      toast({ title: 'Échec de la mise à jour', description: error.message, variant: 'destructive' });
      return;
    }
    setDossier({ ...dossier, status });
    toast({ title: 'Statut mis à jour', description: statusConfig[status].label });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isDemo) return;
    setSavingNote(true);
    try {
      await createNote(dossier.id, user?.id ?? 'demo', noteDraft, isDemo);
      setNoteDraft('');
      await reloadActivity(dossier, isDemo);
      toast({ title: 'Note ajoutée' });
    } catch (err) {
      toast({ title: "Échec de l'ajout", description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId, dossier.id, isDemo);
      await reloadActivity(dossier, isDemo);
    } catch (err) {
      toast({ title: 'Suppression impossible', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    }
  };

  const handleAddPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isDemo) return;
    setSavingPromise(true);
    try {
      await createPromise(
        dossier.id,
        user?.id ?? 'demo',
        { amount: Number(pAmount), due_date: pDue, channel: pChannel, note: pNote },
        isDemo
      );
      setPNote('');
      if (dossier.status === 'a_relancer' || dossier.status === 'en_relance') {
        await handleStatusChange('promesse_paiement');
      }
      await reloadActivity(dossier, isDemo);
      toast({ title: 'Promesse enregistrée', description: `${fmtTND(Number(pAmount))} — ${fmtDate(pDue)}` });
    } catch (err) {
      toast({ title: "Échec de l'enregistrement", description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setSavingPromise(false);
    }
  };

  const handlePromiseStatus = async (p: PaymentPromise, status: PromiseStatus) => {
    try {
      await setPromiseStatus(p.id, dossier.id, status, isDemo);
      if (status === 'broken') {
        // Automatic re-escalation: log it + reopen the dossier for collection.
        await createNote(
          dossier.id,
          user?.id ?? 'demo',
          `Promesse rompue (${fmtTND(p.amount)}, due le ${fmtDate(p.due_date)}). Ré-escalade : dossier repassé en relance active.`,
          isDemo
        );
        if (!isDemo && dossier.status === 'promesse_paiement') {
          await supabase.from('dossiers').update({ status: 'en_relance' }).eq('id', dossier.id);
          setDossier({ ...dossier, status: 'en_relance' });
        } else if (isDemo && dossier.status === 'promesse_paiement') {
          setDossier({ ...dossier, status: 'en_relance' });
        }
      }
      if (status === 'kept' && p.amount >= dossier.amount && !isDemo) {
        await supabase.from('dossiers').update({ status: 'paye' }).eq('id', dossier.id);
        setDossier({ ...dossier, status: 'paye' });
      }
      await reloadActivity(dossier, isDemo);
      toast({ title: 'Promesse mise à jour', description: PROMISE_STATUS_CONFIG[status].label });
    } catch (err) {
      toast({ title: 'Échec de la mise à jour', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    }
  };

  const goTo = (hash: '#notes' | '#promesses') => {
    window.location.hash = hash;
  };

  return (
    <div className="space-y-6 pb-12">
      <Link
        to="/dossiers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-navy transition"
      >
        <ArrowLeft size={14} /> Tous les dossiers
      </Link>

      {isDemo && <DemoBanner text="Dossier d'exemple — notes et promesses enregistrées localement sur ce poste." />}

      {/* ─── Header ─── */}
      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {dossier.clientCode}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-syne break-words">
              {dossier.debtorName}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full', statusConfig[dossier.status].color)}>
                {statusConfig[dossier.status].label}
              </span>
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full', cls.bgClass, cls.colorClass)}>
                {cls.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Créance</p>
              <p className="text-2xl font-black text-navy">{fmtTND(dossier.amount)}</p>
            </div>
            <div
              className="w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center"
              style={{ borderColor: scoreColor(dossier.scoringResult.score) }}
              title={`Score risque ${dossier.scoringResult.score}/100`}
            >
              <span className="text-xl font-black text-navy leading-none">{dossier.scoringResult.score}</span>
              <span className="text-[9px] font-bold text-muted-foreground">RISQUE</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User size={15} aria-hidden /> Agent : <strong className="text-navy">{dossier.agent}</strong>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={15} aria-hidden /> Échéance : <strong className="text-navy">{dossier.date}</strong>
          </div>
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-navy">
              <Phone size={15} aria-hidden /> <strong className="text-navy">{contact.phone}</strong>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-navy min-w-0">
              <Mail size={15} aria-hidden className="shrink-0" /> <strong className="text-navy truncate">{contact.email}</strong>
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest" htmlFor="dossier-status">
            Statut
          </label>
          <select
            id="dossier-status"
            value={dossier.status}
            disabled={isDemo}
            onChange={(e) => handleStatusChange(e.target.value as DossierStatus)}
            title={isDemo ? 'Dossier d’exemple — statut non modifiable' : 'Changer le statut'}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-sky/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {VALID_DOSSIER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusConfig[s].label}
              </option>
            ))}
          </select>
          <Link
            to="/litigation"
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-[hsl(var(--crimson))] transition"
          >
            <Scale size={14} aria-hidden /> Transférer en contentieux
          </Link>
        </div>

        {/* Score explanation */}
        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setShowScoreWhy(!showScoreWhy)}
            aria-expanded={showScoreWhy}
            className="flex items-center gap-2 text-sm font-bold text-navy hover:text-[hsl(var(--crimson))] transition"
          >
            Pourquoi ce score ?
            <ChevronDown size={16} className={cn('transition-transform', showScoreWhy && 'rotate-180')} aria-hidden />
          </button>
          {showScoreWhy && (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-4">
              {SCORE_FACTORS.map((f) => {
                const v = dossier.scoringResult.details[f.key];
                return (
                  <div key={f.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-navy">
                        {f.label} <span className="text-muted-foreground">({f.weight} %)</span>
                      </span>
                      <span className="font-black" style={{ color: scoreColor(v) }}>
                        {v}
                      </span>
                    </div>
                    <div className="h-1.5 bg-mist rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: scoreColor(v) }} />
                    </div>
                  </div>
                );
              })}
              <p className="sm:col-span-2 text-xs text-muted-foreground italic mt-1">
                {dossier.scoringResult.recommandation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Next best action ─── */}
      <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', TONE_CLS[action.tone])}>
        <Zap size={18} className="shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Prochaine action recommandée : {action.label}</p>
          <p className="text-xs mt-0.5 opacity-90">{action.detail}</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => goTo('#promesses')}
            className="px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:bg-navy/90 transition"
          >
            Nouvelle promesse
          </button>
          <button
            onClick={() => setEmailOpen(true)}
            disabled={isDemo}
            title={isDemo ? 'Disponible sur les dossiers réels uniquement' : 'Envoyer une relance email'}
            className="px-3 py-2 rounded-lg bg-white/70 border border-current text-xs font-bold hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer un email
          </button>
          <button
            onClick={() => goTo('#notes')}
            className="px-3 py-2 rounded-lg bg-white/70 border border-current text-xs font-bold hover:bg-white transition"
          >
            Ajouter une note
          </button>
        </div>
      </div>

      <EnvoyerEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        dossierId={dossier.id}
        vars={{ debiteur: dossier.debtorName, code: dossier.clientCode, montant: fmtTND(dossier.amount), echeance: fmtDate(dossier.date) }}
        defaultTo={contact.email ?? ''}
        storedEmail={contact.email}
        onSent={() => {
          reloadActivity(dossier, isDemo);
          supabase.from('dossiers').select('debtor_email, debtor_phone').eq('id', dossier.id).single().then(({ data }) => {
            if (data) setContact({ email: data.debtor_email, phone: data.debtor_phone });
          });
        }}
      />

      {/* ─── Tabs ─── */}
      <div ref={tabsRef} className="flex gap-2 flex-wrap scroll-mt-20" role="tablist" aria-label="Activité du dossier">
        {(
          [
            { key: 'timeline', label: 'Timeline', icon: Activity },
            { key: 'notes', label: `Notes (${notes.length})`, icon: StickyNote },
            { key: 'promesses', label: `Promesses (${promises.length})`, icon: Wallet },
          ] as { key: TabKey; label: string; icon: typeof Activity }[]
        ).map((t) => (
          <button
            type="button"
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              window.location.hash = t.key === 'timeline' ? '' : t.key;
              tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === t.key ? 'bg-navy text-white' : 'bg-card border border-border text-muted-foreground hover:bg-mist'
            )}
          >
            <t.icon size={16} aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <div className="bg-card rounded-3xl border border-border p-6 sm:p-8">
          {timeline.length === 0 ? (
            <EmptyState text="Aucun événement pour le moment." />
          ) : (
            <ol className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {timeline.map((ev) => (
                <li key={ev.key} className="relative pl-12">
                  <span className={cn('absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center', ev.iconCls)}>
                    <ev.icon size={17} aria-hidden />
                  </span>
                  <p className="text-sm font-bold text-navy">{ev.title}</p>
                  {ev.detail && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{ev.detail}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(ev.date)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <form onSubmit={handleAddNote} className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 h-fit">
            <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
              <Plus size={16} aria-hidden /> Nouvelle note
            </h3>
            <label htmlFor="note-content" className="sr-only">
              Contenu de la note
            </label>
            <textarea
              id="note-content"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Appel du 12/09 : débiteur joignable, promet un virement…"
              className="w-full px-4 py-3 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all resize-y"
            />
            <button
              type="submit"
              disabled={savingNote || !noteDraft.trim()}
              className="mt-3 w-full px-4 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all disabled:opacity-50"
            >
              {savingNote ? 'Enregistrement…' : 'Ajouter la note'}
            </button>
            {isDemo && <p className="text-[11px] text-muted-foreground mt-2">Exemple : note stockée localement.</p>}
          </form>
          <div className="lg:col-span-3 bg-card rounded-3xl border border-border p-6">
            <h3 className="font-bold text-navy mb-4">Historique ({notes.length})</h3>
            {notes.length === 0 ? (
              <EmptyState text="Aucune note — documentez chaque contact avec le débiteur." />
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="p-4 bg-mist rounded-2xl">
                    <p className="text-sm text-navy whitespace-pre-wrap">{n.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{fmtDateTime(n.created_at)}</p>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        aria-label="Supprimer la note"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'promesses' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <form onSubmit={handleAddPromise} className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 h-fit space-y-3">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Plus size={16} aria-hidden /> Nouvelle promesse
            </h3>
            <div>
              <label htmlFor="p-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Montant (TND)
              </label>
              <input
                id="p-amount"
                type="number"
                min={1}
                required
                value={pAmount}
                onChange={(e) => setPAmount(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
              />
            </div>
            <div>
              <label htmlFor="p-due" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Échéance promise
              </label>
              <input
                id="p-due"
                type="date"
                required
                value={pDue}
                onChange={(e) => setPDue(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
              />
            </div>
            <div>
              <label htmlFor="p-channel" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Canal d’obtention
              </label>
              <select
                id="p-channel"
                value={pChannel}
                onChange={(e) => setPChannel(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
              >
                {PROMISE_CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-note" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Note (optionnel)
              </label>
              <input
                id="p-note"
                type="text"
                value={pNote}
                onChange={(e) => setPNote(e.target.value)}
                placeholder="Virement promis, 2ᵉ relance…"
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
              />
            </div>
            <button
              type="submit"
              disabled={savingPromise}
              className="w-full px-4 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all disabled:opacity-50"
            >
              {savingPromise ? 'Enregistrement…' : 'Enregistrer la promesse'}
            </button>
            {isDemo && <p className="text-[11px] text-muted-foreground">Exemple : promesse stockée localement.</p>}
          </form>

          <div className="lg:col-span-3 bg-card rounded-3xl border border-border p-6">
            <h3 className="font-bold text-navy mb-4">Suivi ({promises.length})</h3>
            {promises.length === 0 ? (
              <EmptyState text="Aucune promesse — transformez chaque accord oral en engagement daté." />
            ) : (
              <div className="space-y-3">
                {promises.map((p) => {
                  const st = PROMISE_STATUS_CONFIG[p.status];
                  const overdue = p.status === 'pending' && daysUntil(p.due_date) < 0;
                  return (
                    <div key={p.id} className={cn('p-4 rounded-2xl border', overdue ? 'bg-red-50/50 border-red-200' : 'bg-mist border-border')}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-black text-navy">{fmtTND(p.amount)}</p>
                        <span className={cn('text-xs font-bold px-3 py-1 rounded-full', st.cls)}>{st.label}</span>
                      </div>
                      <p className={cn('text-xs font-bold mt-1', overdue ? 'text-red-600' : 'text-muted-foreground')}>
                        {fmtDate(p.due_date)} · {dueLabel(p.due_date)} · {PROMISE_CHANNELS.find((c) => c.value === p.channel)?.label ?? p.channel}
                      </p>
                      {p.note && <p className="text-sm text-muted-foreground mt-1">{p.note}</p>}
                      {p.status === 'pending' && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button
                            onClick={() => handlePromiseStatus(p, 'kept')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                          >
                            <CheckCircle2 size={13} aria-hidden /> Tenue
                          </button>
                          <button
                            onClick={() => handlePromiseStatus(p, 'partial')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
                          >
                            <CircleDot size={13} aria-hidden /> Partielle
                          </button>
                          <button
                            onClick={() => handlePromiseStatus(p, 'broken')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition"
                          >
                            <XCircle size={13} aria-hidden /> Rompue
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox size={26} className="text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
