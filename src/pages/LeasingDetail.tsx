import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Phone, Mail, FileText, Download,
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, Landmark, FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  findLeasingContract, STATUS_CONFIG, ASSET_TYPE_CONFIG, CHANNEL_CONFIG,
  OUTCOME_LABELS, NOTIFICATION_CONFIG, totalOverdue, overdueCount,
  daysOverdue, nextInstallment, recoveryRate,
  type InstallmentStatus, type LeasingContract,
} from '@/lib/leasing-mock';
import {
  LEASING_TEMPLATE_LABELS, LEASING_TEMPLATE_DESCRIPTIONS,
  downloadLeasingPdf, type LeasingTemplateKey,
} from '@/lib/leasing-pdf';
import DemoBanner from '@/components/DemoBanner';
import { toast } from '@/hooks/use-toast';

type TabKey = 'overview' | 'schedule' | 'actions' | 'documents';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'schedule', label: 'Échéancier' },
  { key: 'actions', label: 'Actions & alertes' },
  { key: 'documents', label: 'Documents' },
];

const INSTALLMENT_CONFIG: Record<InstallmentStatus, { label: string; cls: string }> = {
  pending: { label: 'À venir', cls: 'text-gray-600 bg-gray-100' },
  paid: { label: 'Payée', cls: 'text-green-700 bg-green-50' },
  partial: { label: 'Partielle', cls: 'text-amber-700 bg-amber-50' },
  late: { label: 'En retard', cls: 'text-red-600 bg-red-50' },
};

const SEVERITY_CLS: Record<string, string> = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
};

const fmtTND = (n: number) => `${n.toLocaleString('fr-FR')} TND`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function LeasingDetail() {
  const { id } = useParams<{ id: string }>();
  const c = id ? findLeasingContract(id) : undefined;
  const [tab, setTab] = useState<TabKey>('overview');

  if (!c) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Contrat introuvable.</p>
        <Link to="/leasing" className="text-[hsl(var(--crimson))] font-semibold mt-2 inline-block">
          ← Retour au portefeuille
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[c.status];
  const assetCfg = ASSET_TYPE_CONFIG[c.asset.type];
  const AssetIcon = assetCfg.icon;
  const next = nextInstallment(c);
  const rec = recoveryRate(c);

  const generateDoc = async (tpl: LeasingTemplateKey) => {
    try {
      await downloadLeasingPdf(tpl, c);
      toast({ title: 'Document généré', description: LEASING_TEMPLATE_LABELS[tpl] });
    } catch {
      toast({ title: 'Échec de génération', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Link
        to="/leasing"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[hsl(var(--charcoal))] transition"
      >
        <ArrowLeft size={14} /> Tous les contrats
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{c.id}</p>
          <h1 className="text-3xl font-serif-display text-[hsl(var(--charcoal))] tracking-tight">{c.lessee.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {assetCfg.label} · {c.asset.description} · {c.lessor}
          </p>
        </div>
        <span className={cn('text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </div>

      <DemoBanner />

      {/* Alert strip */}
      {(overdueCount(c) > 0 || c.notifications.some((n) => n.severity === 'critical')) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" aria-hidden />
          <p className="text-red-800">
            <strong>{overdueCount(c)} échéance{overdueCount(c) > 1 ? 's' : ''} en retard</strong> —{' '}
            {fmtTND(totalOverdue(c))} · {daysOverdue(c)} jour{daysOverdue(c) > 1 ? 's' : ''} de retard max.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Sections du contrat">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === t.key ? 'bg-navy text-white' : 'bg-card border border-border text-muted-foreground hover:bg-mist'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab c={c} next={next} recoveryPct={rec} AssetIcon={AssetIcon} />}
      {tab === 'schedule' && <ScheduleTab c={c} />}
      {tab === 'actions' && <ActionsTab c={c} />}
      {tab === 'documents' && <DocumentsTab c={c} onGenerate={generateDoc} />}
    </div>
  );
}

/* ───────────────────────── Overview ───────────────────────── */

function OverviewTab({
  c, next, recoveryPct, AssetIcon,
}: {
  c: LeasingContract;
  next: ReturnType<typeof nextInstallment>;
  recoveryPct: number;
  AssetIcon: typeof Building2;
}) {
  const kpis = [
    { label: 'Capital restant', value: fmtTND(c.financials.remainingCapital) },
    { label: c.paymentFrequency === 'monthly' ? 'Loyer mensuel' : 'Loyer trimestriel', value: fmtTND(c.financials.monthlyRent) },
    { label: 'Taux annuel', value: `${c.financials.interestRate.toLocaleString('fr-FR')} %` },
    { label: 'Taux de recouvrement', value: `${recoveryPct} %` },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
            <p className="text-xl font-black text-navy">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={16} aria-hidden /> Preneur
          </h3>
          <p className="font-bold text-navy">{c.lessee.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {c.lessee.address} · {c.lessee.zip} {c.lessee.city}
          </p>
          <div className="mt-3 space-y-1.5 text-sm">
            {c.lessee.contact && <p className="text-muted-foreground">Contact : <span className="text-navy font-medium">{c.lessee.contact}</span></p>}
            {c.lessee.phone && (
              <p className="flex items-center gap-2 text-muted-foreground"><Phone size={14} aria-hidden /> {c.lessee.phone}</p>
            )}
            {c.lessee.email && (
              <p className="flex items-center gap-2 text-muted-foreground"><Mail size={14} aria-hidden /> {c.lessee.email}</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Début</p>
              <p className="font-bold text-navy">{fmtDate(c.startDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Fin</p>
              <p className="font-bold text-navy">{fmtDate(c.endDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Agent suivi</p>
              <p className="font-bold text-navy">{c.agent}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Score risque</p>
              <p className={cn('font-black', c.riskScore >= 70 ? 'text-red-600' : c.riskScore >= 40 ? 'text-amber-600' : 'text-green-600')}>
                {c.riskScore}/100
              </p>
            </div>
          </div>
          {next && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-mist rounded-xl p-3">
              <Clock size={16} className="text-muted-foreground" aria-hidden />
              <span className="text-muted-foreground">Prochaine échéance :</span>
              <strong className="text-navy">{fmtDate(next.dueDate)} — {fmtTND(next.amount)}</strong>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <AssetIcon size={16} aria-hidden /> Bien financé
            </h3>
            <p className="font-bold text-navy">{c.asset.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Valeur d'acquisition</p>
                <p className="font-bold text-navy">{fmtTND(c.asset.acquisitionValue)}</p>
              </div>
              {c.asset.residualValue !== undefined && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Valeur résiduelle</p>
                  <p className="font-bold text-navy">{fmtTND(c.asset.residualValue)}</p>
                </div>
              )}
              {c.asset.brand && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Marque / modèle</p>
                  <p className="font-bold text-navy">{c.asset.brand}{c.asset.model ? ` ${c.asset.model}` : ''}</p>
                </div>
              )}
              {c.asset.serial && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">N° série</p>
                  <p className="font-mono text-navy">{c.asset.serial}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} aria-hidden /> Garanties & assurance
            </h3>
            {c.guarantor ? (
              <div className="flex items-start gap-3 text-sm">
                <Landmark size={16} className="text-muted-foreground mt-0.5" aria-hidden />
                <div>
                  <p className="font-bold text-navy">{c.guarantor.name}</p>
                  <p className="text-muted-foreground">Caution {c.guarantor.type === 'bank' ? 'bancaire' : c.guarantor.type === 'corporate' ? 'entreprise' : 'personnelle'} — {fmtTND(c.guarantor.guaranteedAmount)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun garant renseigné.</p>
            )}
            {c.insurance && (
              <div className="mt-3 pt-3 border-t border-border text-sm">
                <p className="font-bold text-navy">{c.insurance.provider}</p>
                <p className="text-muted-foreground">Police {c.insurance.policyNumber} · expire le {fmtDate(c.insurance.expiryDate)} · couverture {fmtTND(c.insurance.coverageAmount)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {c.litigationCaseId && (
        <Link
          to={`/litigation/${c.litigationCaseId}`}
          className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--crimson))] hover:underline"
        >
          <FileText size={16} aria-hidden /> Dossier contentieux lié : {c.litigationCaseId}
        </Link>
      )}
    </div>
  );
}

/* ───────────────────────── Schedule ───────────────────────── */

function ScheduleTab({ c }: { c: LeasingContract }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
              <th scope="col" className="text-left p-4">N°</th>
              <th scope="col" className="text-left p-4">Échéance</th>
              <th scope="col" className="text-right p-4">Capital</th>
              <th scope="col" className="text-right p-4">Intérêts</th>
              <th scope="col" className="text-right p-4">Montant</th>
              <th scope="col" className="text-right p-4">Payé</th>
              <th scope="col" className="text-left p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {c.installments.map((i) => {
              const st = INSTALLMENT_CONFIG[i.status];
              return (
                <tr key={i.id} className="border-b border-border hover:bg-mist transition-colors">
                  <td className="p-4 text-sm font-mono text-muted-foreground">{i.number}</td>
                  <td className="p-4 text-sm font-medium text-navy whitespace-nowrap">
                    {fmtDate(i.dueDate)}
                    {i.daysLate > 0 && <span className="ml-2 text-xs font-bold text-red-600">J+{i.daysLate}</span>}
                  </td>
                  <td className="p-4 text-sm text-right font-mono">{i.principal.toLocaleString('fr-FR')}</td>
                  <td className="p-4 text-sm text-right font-mono">{i.interest.toLocaleString('fr-FR')}</td>
                  <td className="p-4 text-sm text-right font-mono font-bold">{i.amount.toLocaleString('fr-FR')}</td>
                  <td className="p-4 text-sm text-right font-mono text-muted-foreground">
                    {i.paidAmount.toLocaleString('fr-FR')}
                    {i.paidDate ? ` (${fmtDate(i.paidDate)})` : ''}
                  </td>
                  <td className="p-4">
                    <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap', st.cls)}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Actions & alerts ───────────────────────── */

function ActionsTab({ c }: { c: LeasingContract }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">Historique des actions</h3>
        {c.actions.length === 0 && <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>}
        <div className="space-y-3">
          {c.actions.map((a) => (
            <div key={a.id} className="p-3 bg-mist rounded-xl text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', CHANNEL_CONFIG[a.channel].color)}>
                  {CHANNEL_CONFIG[a.channel].label}
                </span>
                <span className="text-xs text-muted-foreground">{fmtDate(a.date)} · {a.agent}</span>
              </div>
              <p className="mt-2 font-medium text-navy">{OUTCOME_LABELS[a.outcome]}</p>
              {a.notes && <p className="text-muted-foreground text-xs mt-1">{a.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">Alertes</h3>
        {c.notifications.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte sur ce contrat.</p>}
        <div className="space-y-3">
          {c.notifications.map((n) => (
            <div key={n.id} className={cn('p-3 rounded-xl border text-sm flex items-start gap-2.5', SEVERITY_CLS[n.severity] ?? SEVERITY_CLS.info)}>
              {n.severity === 'critical' ? <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden /> : <Clock size={16} className="shrink-0 mt-0.5" aria-hidden />}
              <div>
                <p className="font-bold">{NOTIFICATION_CONFIG[n.type]?.label ?? n.type}</p>
                <p className="opacity-90">{n.message}</p>
                <p className="text-xs mt-1 opacity-75">{fmtDate(n.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Documents ───────────────────────── */

function DocumentsTab({ c, onGenerate }: { c: LeasingContract; onGenerate: (t: LeasingTemplateKey) => void }) {
  const templates = Object.keys(LEASING_TEMPLATE_LABELS) as LeasingTemplateKey[];
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">Générer un document</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t}
              onClick={() => onGenerate(t)}
              className="text-left p-4 rounded-xl border border-border hover:border-crimson hover:shadow-md transition-all group"
            >
              <FileDown size={20} className="text-[hsl(var(--crimson))] mb-2" aria-hidden />
              <p className="text-sm font-bold text-navy group-hover:text-[hsl(var(--crimson))]">{LEASING_TEMPLATE_LABELS[t]}</p>
              <p className="text-xs text-muted-foreground mt-1">{LEASING_TEMPLATE_DESCRIPTIONS[t]}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">Documents du dossier</h3>
        {c.documents.length === 0 && <p className="text-sm text-muted-foreground">Aucun document pour le moment.</p>}
        <div className="divide-y divide-border">
          {c.documents.map((d) => (
            <div key={d.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-muted-foreground shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.category} · {fmtDate(d.date)}{d.size ? ` · ${d.size}` : ''}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-mist text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                {d.status === 'signed' || d.status === 'filed' ? <CheckCircle2 size={12} aria-hidden /> : <Download size={12} aria-hidden />}
                {d.status === 'draft' ? 'Brouillon' : d.status === 'sent' ? 'Envoyé' : d.status === 'signed' ? 'Signé' : 'Classé'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {c.termination && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-3">Résiliation anticipée</h3>
          <p className="text-sm text-muted-foreground">{c.termination.reason}</p>
          <p className="text-sm mt-2">
            Indemnité : <strong className="text-navy">{fmtTND(c.termination.indemnityAmount)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
