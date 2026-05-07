import { useEffect, useMemo, useState } from 'react';
import { X, Scale, User, Wallet, Gavel, Shield, FileText, Calendar, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Lawyer = { id: string; name: string; firm: string | null };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'precontentieux', label: 'Précontentieux' },
  { value: 'contentieux', label: 'Contentieux' },
  { value: 'recouvrement_force', label: 'Recouvrement forcé' },
];

const COURT_LEVELS = [
  { value: 'tpi', label: 'Tribunal de Première Instance' },
  { value: 'appel', label: "Cour d'Appel" },
  { value: 'cassation', label: 'Cassation' },
];

const GUARANTEES = [
  { value: 'aucune', label: 'Aucune garantie' },
  { value: 'hypotheque', label: 'Hypothèque' },
  { value: 'nantissement', label: 'Nantissement' },
  { value: 'caution', label: 'Caution personnelle' },
];

// Frais de justice estimés (Tunisie, ordre de grandeur indicatif)
function estimateLegalFees(amount: number) {
  if (!amount || amount <= 0) return 0;
  // Droit proportionnel ~1% + droits de plaidoirie forfaitaires + greffe
  const proportional = amount * 0.01;
  const fixed = 150; // greffe + timbres
  const pleading = Math.max(80, Math.min(amount * 0.005, 1500));
  return Math.round((proportional + fixed + pleading) * 1000) / 1000;
}

// Prescription tunisienne : 5 ans (créances commerciales courantes), 15 ans (jugements)
function prescriptionAlert(dateStr: string | undefined): { level: 'ok' | 'warn' | 'danger'; msg: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const years = (Date.now() - d.getTime()) / (365.25 * 86400000);
  if (years >= 5) {
    return { level: 'danger', msg: `⚠ Délai de prescription quinquennale dépassé (${years.toFixed(1)} ans). Risque de prescription — interrompre sans délai.` };
  }
  if (years >= 4) {
    return { level: 'warn', msg: `Attention : ${(5 - years).toFixed(1)} an(s) avant prescription quinquennale (créances commerciales).` };
  }
  if (years >= 14) {
    return { level: 'danger', msg: `⚠ Approche de la prescription trentenaire/quinquagénaire — vérifier le régime applicable.` };
  }
  return { level: 'ok', msg: `Reconnaissance valide depuis ${years.toFixed(1)} an(s). Délai confortable.` };
}

export default function NouveauDossierContentieuxModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [debtorName, setDebtorName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState('precontentieux');
  const [lawyerId, setLawyerId] = useState<string>('');
  const [courtLevel, setCourtLevel] = useState('tpi');
  const [guarantee, setGuarantee] = useState('aucune');
  const [recommendation, setRecommendation] = useState('');
  const [observations, setObservations] = useState('');
  const [lastAck, setLastAck] = useState('');

  useEffect(() => {
    if (!open) return;
    supabase.from('lawyers').select('id,name,firm').order('name').then(({ data }) => {
      if (data) setLawyers(data as Lawyer[]);
    });
  }, [open]);

  const estimatedFees = useMemo(() => estimateLegalFees(amount), [amount]);
  const presc = useMemo(() => prescriptionAlert(lastAck), [lastAck]);

  if (!open) return null;

  const reset = () => {
    setDebtorName(''); setAmount(0); setStatus('precontentieux');
    setLawyerId(''); setCourtLevel('tpi'); setGuarantee('aucune');
    setRecommendation(''); setObservations(''); setLastAck('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Vous devez être connecté.'); return; }
    if (!debtorName.trim()) { toast.error('Le nom du débiteur est requis.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('dossiers_contentieux').insert({
      user_id: user.id,
      debtor_name: debtorName.trim(),
      amount,
      status,
      lawyer_id: lawyerId || null,
      court_level: courtLevel,
      guarantee,
      recommendation: recommendation.trim() || null,
      observations: observations.trim() || null,
      last_acknowledgment_date: lastAck || null,
      estimated_legal_fees: estimatedFees,
    });
    setSubmitting(false);

    if (error) { toast.error(`Erreur : ${error.message}`); return; }
    toast.success('Dossier contentieux créé avec succès.');
    reset();
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-3xl bg-[#0d1117] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Scale size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nouveau dossier contentieux</h2>
              <p className="text-xs text-slate-400">Créer un dossier juridique avec affectation et stratégie.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Débiteur */}
          <Field icon={User} label="Nom du débiteur / Client *">
            <input
              value={debtorName}
              onChange={(e) => setDebtorName(e.target.value)}
              placeholder="Ex: Ahmed Ben Salem"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field icon={Wallet} label="Montant de la créance (TND) *">
              <input
                type="number" min={0} step="0.001"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
              />
            </Field>
            <Field icon={Gavel} label="Statut initial *">
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field icon={User} label="Avocat chargé">
              <select value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500">
                <option value="">Sélectionner un avocat</option>
                {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}{l.firm ? ` — ${l.firm}` : ''}</option>)}
              </select>
            </Field>
            <Field icon={Scale} label="Niveau du dossier *">
              <select value={courtLevel} onChange={(e) => setCourtLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500">
                {COURT_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field icon={Shield} label="Garanties *">
              <select value={guarantee} onChange={(e) => setGuarantee(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500">
                {GUARANTEES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field icon={FileText} label="Recommandation initiale">
              <input
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Ex: Mise en demeure envoyée"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
              />
            </Field>
          </div>

          <Field icon={Calendar} label="Date de la dernière reconnaissance de dette">
            <input
              type="date" value={lastAck}
              onChange={(e) => setLastAck(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
            />
          </Field>

          {/* Auto-computed */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider">
                <Sparkles size={13} className="text-amber-400" /> Frais de justice estimés
              </div>
              <p className="text-xl font-bold text-amber-300 mt-1">
                {estimatedFees.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Droit proportionnel + plaidoirie + greffe (estimation).</p>
            </div>
            {presc && (
              <div className={`rounded-lg p-3 border flex gap-2 items-start ${
                presc.level === 'danger' ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' :
                presc.level === 'warn' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' :
                'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              }`}>
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Alerte de prescription</p>
                  <p className="text-xs mt-1">{presc.msg}</p>
                </div>
              </div>
            )}
          </div>

          <Field icon={FileText} label="Observations">
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
              placeholder="Notes libres sur le dossier, contexte, stratégie..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 resize-none"
            />
          </Field>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Créer le dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
        <Icon size={13} className="text-slate-400" /> {label}
      </label>
      {children}
    </div>
  );
}
