import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  BarChart3,
  FileText,
  Handshake,
  Home,
  LayoutDashboard,
  Package,
  PieChart,
  Scale,
  Settings,
  ShieldCheck,
  Sunrise,
  Target,
  Upload,
  Plus,
  FileCheck2,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mockDossiers } from '@/lib/mock-data';

// ─── Static entries ───

interface Entry {
  label: string;
  hint?: string;
  to: string;
  icon: LucideIcon;
}

const NAV: Entry[] = [
  { label: 'Accueil', to: '/', icon: Home },
  { label: 'Tableau de bord', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Ma journée', to: '/aujourdhui', icon: Sunrise },
  { label: 'Dossiers Recouvrement', to: '/dossiers', icon: FileText },
  { label: 'Moteur de Relance', to: '/relances', icon: FileCheck2 },
  { label: 'Module Contentieux', to: '/litigation', icon: Scale },
  { label: 'Leasing', to: '/leasing', icon: Package },
  { label: 'Veille Réglementaire', to: '/regulatory', icon: ShieldCheck },
  { label: 'Scoring & Segmentation', to: '/scoring', icon: Target },
  { label: 'Reporting', to: '/reporting', icon: PieChart },
  { label: 'Analyses', to: '/analytics', icon: BarChart3 },
  { label: 'Paramètres', to: '/settings', icon: Settings },
];

const ACTIONS: Entry[] = [
  { label: 'Nouveau dossier leasing', to: '/leasing/new', icon: Plus },
  { label: 'Importer un portefeuille', hint: 'Excel / CSV', to: '/leasing/import', icon: Upload },
  { label: 'Demande de décision crédit', to: '/relances/decision-credit', icon: FileCheck2 },
  { label: 'Promesses à suivre', hint: 'Ma journée', to: '/aujourdhui', icon: Handshake },
  { label: 'Moteur IFRS 9', hint: 'Veille réglementaire', to: '/regulatory/ifrs9-engine', icon: ShieldCheck },
];

// ─── Dossier search ───

interface DossierHit {
  id: string;
  debtorName: string;
  clientCode: string;
  amount: number;
}

const fmtTND = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DT`;

async function searchDossiers(q: string): Promise<DossierHit[]> {
  const needle = q.trim().toLowerCase();
  const local: DossierHit[] = mockDossiers
    .filter(
      (d) =>
        d.debtorName.toLowerCase().includes(needle) ||
        d.clientCode.toLowerCase().includes(needle),
    )
    .map((d) => ({ id: d.id, debtorName: d.debtorName, clientCode: d.clientCode, amount: d.amount }));
  try {
    const { data } = await supabase
      .from('dossiers')
      .select('id, debtor_name, client_code, amount')
      .or(`debtor_name.ilike.%${q.trim()}%,client_code.ilike.%${q.trim()}%`)
      .limit(8);
    const remote: DossierHit[] = (data ?? []).map((r) => ({
      id: r.id,
      debtorName: r.debtor_name ?? '—',
      clientCode: r.client_code ?? '—',
      amount: Number(r.amount ?? 0),
    }));
    return [...remote, ...local].slice(0, 8);
  } catch {
    return local.slice(0, 8);
  }
}

// ─── Component ───

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<DossierHit[]>([]);
  const openRef = useRef(open);
  openRef.current = open;

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!openRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  // Debounced dossier search
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      searchDossiers(q).then((r) => {
        if (!cancelled) setHits(r);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const go = (to: string) => {
    setQ('');
    setHits([]);
    onOpenChange(false);
    navigate(to);
  };

  const itemCls =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer data-[selected=true]:bg-mist';
  const groupCls =
    '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400';

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setQ('');
          setHits([]);
        }
        onOpenChange(v);
      }}
      label="Recherche globale"
      overlayClassName="fixed inset-0 z-50 bg-navy/60 backdrop-blur-[2px]"
      className="fixed left-1/2 top-[10%] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-2xl border border-navy/10"
    >
      <div className="flex items-center gap-2 border-b border-navy/10 px-4">
        <Search size={16} className="shrink-0 text-slate-400" aria-hidden />
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Dossiers, pages, actions…"
          className="w-full py-3.5 text-sm outline-none placeholder:text-slate-400"
        />
        <kbd className="shrink-0 rounded border border-navy/10 bg-mist px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-[55vh] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-8 text-center text-sm text-slate-500">
          Aucun résultat. Essayez un nom de débiteur, un code client ou un nom de page.
        </Command.Empty>
        {hits.length > 0 && (
          <Command.Group heading="Dossiers" className={groupCls}>
            {hits.map((d) => (
              <Command.Item
                key={d.id}
                value={`${d.debtorName} ${d.clientCode}`}
                onSelect={() => go(`/dossiers/${d.id}`)}
                className={itemCls}
              >
                <FileText size={16} className="shrink-0 text-crimson" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{d.debtorName}</span>
                <span className="shrink-0 text-xs text-slate-400">{d.clientCode}</span>
                <span className="shrink-0 text-xs font-bold text-navy">{fmtTND(d.amount)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <Command.Group heading="Navigation" className={groupCls}>
          {NAV.map((e) => (
            <Command.Item key={e.to} value={e.label} onSelect={() => go(e.to)} className={itemCls}>
              <e.icon size={16} className="shrink-0 text-slate-400" aria-hidden />
              <span className="flex-1">{e.label}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions" className={groupCls}>
          {ACTIONS.map((e) => (
            <Command.Item
              key={e.label}
              value={e.label}
              onSelect={() => go(e.to)}
              className={itemCls}
            >
              <e.icon size={16} className="shrink-0 text-sky" aria-hidden />
              <span className="flex-1">{e.label}</span>
              {e.hint && <span className="text-xs text-slate-400">{e.hint}</span>}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="flex items-center gap-4 border-t border-navy/10 px-4 py-2.5 text-[11px] text-slate-400">
        <span>
          <kbd className="font-semibold">↑↓</kbd> naviguer
        </span>
        <span>
          <kbd className="font-semibold">↵</kbd> ouvrir
        </span>
        <span className="ml-auto">RecovTN · recherche globale</span>
      </div>
    </Command.Dialog>
  );
}
