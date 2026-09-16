import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Clock, AlertCircle, CheckCircle2, BarChart3, Gavel, ShieldCheck, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mockDossiers, statusConfig, type DossierComplet } from '@/lib/mock-data';
import { dbRowToDossier, type DossierStatus } from '@/lib/dossier-map';
import { litigationCases } from '@/lib/litigation-mock';
import DemoBanner from '@/components/DemoBanner';

/** Compact French number: 4,25 M TND / 320 k TND */
function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M TND`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k TND`;
  return `${n.toLocaleString('fr-FR')} TND`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_BAR_COLORS: Record<DossierStatus, string> = {
  a_relancer: 'bg-blue-500',
  en_relance: 'bg-amber-500',
  promesse_paiement: 'bg-purple-500',
  partiellement_paye: 'bg-orange-500',
  paye: 'bg-green-500',
  contentieux: 'bg-red-500',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [dbDossiers, setDbDossiers] = useState<DossierComplet[] | null>(null);

  useEffect(() => {
    if (!user) {
      setDbDossiers([]);
      return;
    }
    supabase
      .from('dossiers')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) {
          setDbDossiers([]);
          return;
        }
        setDbDossiers(data.map(dbRowToDossier));
      });
  }, [user]);

  const loading = dbDossiers === null;
  const isDemo = !loading && (dbDossiers ?? []).length === 0;
  const dossiers = useMemo(
    () => (isDemo ? mockDossiers : (dbDossiers ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDemo, loading]
  );

  const stats = useMemo(() => {
    const actives = dossiers.filter((d) => d.status !== 'paye');
    const litiges = dossiers.filter((d) => d.status === 'contentieux');
    const clos = dossiers.filter((d) => d.status === 'paye');
    const encours = actives.reduce((s, d) => s + d.amount, 0);
    const recovered = clos.reduce((s, d) => s + d.amount, 0);
    const aRelancer = dossiers.filter((d) => d.status === 'a_relancer').length;
    return { actives, litiges, clos, encours, recovered, aRelancer };
  }, [dossiers]);

  const distribution = useMemo(() => {
    const counts = new Map<DossierStatus, number>();
    dossiers.forEach((d) => counts.set(d.status, (counts.get(d.status) ?? 0) + 1));
    const total = Math.max(dossiers.length, 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        label: statusConfig[status].label,
        pct: Math.round((count / total) * 100),
        color: STATUS_BAR_COLORS[status],
      }));
  }, [dossiers]);

  const upcomingHearings = useMemo(() => {
    const all: { caseId: string; debtor: string; court: string; type: string; date: string; time: string }[] = [];
    litigationCases.forEach((c) =>
      c.hearings
        .filter((h) => h.status === 'scheduled')
        .forEach((h) =>
          all.push({ caseId: c.id, debtor: c.debtor.name, court: h.court, type: h.type, date: h.date, time: h.time })
        )
    );
    return all.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3);
  }, []);

  const cards = [
    {
      title: 'Encours Total',
      value: fmtCompact(stats.encours),
      sub: `${stats.actives.length} dossier${stats.actives.length > 1 ? 's' : ''} actif${stats.actives.length > 1 ? 's' : ''}`,
      icon: TrendingUp,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Dossiers Actifs',
      value: String(stats.actives.length),
      sub: `${stats.aRelancer} à relancer`,
      icon: Clock,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'En Litige',
      value: String(stats.litiges.length),
      sub: fmtCompact(stats.litiges.reduce((s, d) => s + d.amount, 0)),
      icon: AlertCircle,
      iconClass: 'bg-red-50 text-red-500',
    },
    {
      title: 'Montant Recouvré',
      value: fmtCompact(stats.recovered),
      sub: `${stats.clos.length} dossier${stats.clos.length > 1 ? 's' : ''} clos`,
      icon: CheckCircle2,
      iconClass: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre portefeuille de recouvrement.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all shadow-lg shadow-navy/20"
          >
            <BarChart3 size={14} />
            Analyses IA
          </Link>
        </div>
      </div>

      {isDemo && (
        <DemoBanner text="Aucun dossier dans votre base — les chiffres ci-dessous illustrent un portefeuille de démonstration. Créez votre premier dossier pour passer en réel." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card p-6 rounded-3xl shadow-sm border border-border hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110',
                  card.iconClass
                )}
              >
                <card.icon size={24} aria-hidden />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{card.title}</p>
            <p className="text-2xl font-black text-navy">{loading ? '…' : card.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{loading ? '' : card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming hearings — sourced from the litigation store */}
        <div className="bg-gradient-to-br from-navy to-navy/90 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Gavel size={20} className="text-sky" aria-hidden />
                </div>
                <h2 className="text-lg font-black tracking-tight font-syne">Prochaines audiences</h2>
              </div>
              <Link
                to="/litigation"
                className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Voir le contentieux
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingHearings.length === 0 && (
                <p className="text-sm text-white/70">Aucune audience planifiée pour le moment.</p>
              )}
              {upcomingHearings.map((h) => (
                <Link
                  key={`${h.caseId}-${h.date}-${h.time}`}
                  to={`/litigation/${h.caseId}`}
                  className="block p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-bold mb-1">
                    {h.type} — {h.debtor}
                  </p>
                  <div className="flex items-center gap-1.5 text-white/70 text-xs">
                    <Clock size={14} aria-hidden />
                    {fmtDate(h.date)} à {h.time} · {h.court}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Regulatory shortcut */}
        <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ShieldCheck size={20} className="text-amber-600" aria-hidden />
            </div>
            <h2 className="text-lg font-black text-navy tracking-tight font-syne">Conformité & Risque</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Veille des circulaires BCT & CTAF, checklists de conformité et moteur d'analyse crédit IFRS 9.
          </p>
          <div className="mt-auto space-y-3">
            <Link
              to="/regulatory"
              className="flex items-center gap-2 px-4 py-3 bg-mist border border-border rounded-xl text-sm font-bold text-navy hover:bg-border/50 transition-all"
            >
              <ShieldCheck size={16} aria-hidden />
              Veille réglementaire
            </Link>
            <Link
              to="/regulatory/ifrs9-engine"
              className="flex items-center gap-2 px-4 py-3 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90 transition-all"
            >
              <Brain size={16} aria-hidden />
              Moteur IFRS 9
            </Link>
          </div>
        </div>

        {/* Status distribution — computed from displayed data */}
        <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border">
          <h2 className="text-lg font-black text-navy tracking-tight mb-6 font-syne">Répartition par statut</h2>
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-navy">{item.label}</span>
                  <span className="text-muted-foreground font-bold">{item.pct}%</span>
                </div>
                <div className="h-2 bg-mist rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn('h-full rounded-full', item.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent dossiers */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-black text-navy font-syne">Dossiers récents</h2>
          <Link to="/dossiers" className="text-xs font-bold text-sky hover:underline">
            Voir tous
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th scope="col" className="text-left p-4">
                  Débiteur
                </th>
                <th scope="col" className="text-left p-4">
                  Code
                </th>
                <th scope="col" className="text-left p-4">
                  Montant
                </th>
                <th scope="col" className="text-left p-4">
                  Statut
                </th>
                <th scope="col" className="text-left p-4">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {dossiers.slice(0, 5).map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-mist transition-colors">
                  <td className="p-4 font-bold text-sm text-navy"><Link to={`/dossiers/${d.id}`} className="hover:text-[hsl(var(--crimson))] hover:underline">{d.debtorName}</Link></td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">{d.clientCode}</td>
                  <td className="p-4 text-sm font-mono">{d.amount.toLocaleString('fr-FR')} TND</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap',
                        statusConfig[d.status].color
                      )}
                    >
                      {statusConfig[d.status].label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
