import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreVertical, Eye, Copy, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { mockDossiers, statusConfig, type DossierComplet } from '@/lib/mock-data';
import { classificationConfig, calculerScore } from '@/lib/scoring';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import NouveauDossierModal from '@/components/dossiers/NouveauDossierModal';
import DemoBanner from '@/components/DemoBanner';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DossierRow = Database['public']['Tables']['dossiers']['Row'];
type DossierStatus = DossierComplet['status'];

const allStatuses = ['all', 'a_relancer', 'en_relance', 'promesse_paiement', 'partiellement_paye', 'paye', 'contentieux'] as const;
const PAGE_SIZE = 8;

function dbRowToDossier(r: DossierRow): DossierComplet {
  const scoring = {
    montant: Number(r.amount),
    ancienneteJours: 30,
    tauxPaiementHistorique: 50,
    tauxReactivite: 50,
    typologieClient: 'pme' as const,
  };
  const valid = (allStatuses as readonly string[]).includes(r.status ?? '');
  return {
    id: r.id,
    clientCode: r.client_code,
    debtorName: r.debtor_name,
    amount: Number(r.amount),
    status: (valid ? r.status : 'a_relancer') as DossierStatus,
    managementLevel: r.management_level || 'recouvreur',
    agent: r.assigned_to || 'Non assigné',
    date: (r.due_date || r.created_at || '').slice(0, 10),
    scoring,
    scoringResult: calculerScore(scoring),
    typologieClient: 'pme',
  };
}

export default function Dossiers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dbDossiers, setDbDossiers] = useState<DossierComplet[]>([]);
  const [source, setSource] = useState<'mine' | 'examples'>('mine');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DossierComplet | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('dossiers').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erreur de chargement', description: error.message, variant: 'destructive' });
      return;
    }
    setDbDossiers((data || []).map(dbRowToDossier));
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel('dossiers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dossiers' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, source]);

  const base = source === 'mine' ? dbDossiers : mockDossiers;

  const filtered = useMemo(
    () =>
      base.filter((d) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          d.debtorName.toLowerCase().includes(q) || d.clientCode.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [base, searchQuery, statusFilter]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'Copié', description: `Code ${code} copié dans le presse-papiers.` });
    } catch {
      toast({ title: 'Copie impossible', variant: 'destructive' });
    }
  };

  const changeStatus = async (d: DossierComplet, status: DossierStatus) => {
    const { error } = await supabase.from('dossiers').update({ status }).eq('id', d.id);
    if (error) {
      toast({ title: 'Échec de la mise à jour', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Statut mis à jour', description: `${d.clientCode} → ${statusConfig[status].label}` });
    load();
  };

  const scoreRingColor = (score: number) =>
    score >= 70 ? 'hsl(0,84%,60%)' : score >= 40 ? 'hsl(38,92%,50%)' : 'hsl(142,76%,36%)';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Gestion Des Dossiers Recouvrement</h1>
          <p className="text-muted-foreground mt-1">Gérez vos dossiers de recouvrement et suivez les actions en cours.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all shadow-lg shadow-sky/20"
        >
          <Plus size={18} />
          Nouveau dossier
        </button>
      </div>

      {/* Source tabs: real data vs examples — never silently mixed */}
      <div className="flex items-center gap-1 bg-secondary rounded-full p-1 w-fit" role="tablist" aria-label="Source des dossiers">
        <button
          role="tab"
          aria-selected={source === 'mine'}
          onClick={() => setSource('mine')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-all',
            source === 'mine' ? 'bg-card shadow text-navy' : 'text-muted-foreground hover:text-navy'
          )}
        >
          Mes dossiers ({dbDossiers.length})
        </button>
        <button
          role="tab"
          aria-selected={source === 'examples'}
          onClick={() => setSource('examples')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-all',
            source === 'examples' ? 'bg-card shadow text-navy' : 'text-muted-foreground hover:text-navy'
          )}
        >
          Exemples ({mockDossiers.length})
        </button>
      </div>

      {source === 'examples' && (
        <DemoBanner text="Dossiers d'exemple en lecture seule — les modifications de statut sont désactivées sur ces lignes." />
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="text"
            placeholder="Rechercher un dossier..."
            aria-label="Rechercher un dossier"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                statusFilter === s ? 'bg-navy text-white' : 'bg-card border border-border text-muted-foreground hover:bg-mist'
              )}
            >
              {s === 'all' ? 'Tous' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th scope="col" className="text-left p-4">Code</th>
                <th scope="col" className="text-left p-4">Débiteur</th>
                <th scope="col" className="text-left p-4">Montant</th>
                <th scope="col" className="text-left p-4">Agent</th>
                <th scope="col" className="text-left p-4">Statut</th>
                <th scope="col" className="text-left p-4">Score</th>
                <th scope="col" className="text-left p-4">Classification</th>
                <th scope="col" className="text-left p-4">Date</th>
                <th scope="col" className="text-left p-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => {
                const cls = classificationConfig[d.scoringResult.classification];
                const isReal = source === 'mine';
                return (
                  <tr key={d.id} className="border-b border-border hover:bg-mist transition-colors">
                    <td className="p-4 text-sm font-mono text-muted-foreground">{d.clientCode}</td>
                    <td className="p-4 font-bold text-sm text-navy">{d.debtorName}</td>
                    <td className="p-4 text-sm font-mono">{d.amount.toLocaleString('fr-FR')} TND</td>
                    <td className="p-4 text-xs text-muted-foreground">{d.agent}</td>
                    <td className="p-4">
                      <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap', statusConfig[d.status].color)}>
                        {statusConfig[d.status].label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-black"
                        style={{ borderColor: scoreRingColor(d.scoringResult.score) }}
                        title={`Score ${d.scoringResult.score}/100 — ${d.scoringResult.recommandation}`}
                      >
                        {d.scoringResult.score}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap', cls.bgClass, cls.colorClass)}>
                        {cls.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">{d.date}</td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 hover:bg-mist rounded-lg transition-colors"
                            aria-label={`Actions pour ${d.clientCode}`}
                          >
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{d.clientCode}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setPreview(d)}>
                            <Eye size={14} className="mr-2" /> Aperçu du dossier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyCode(d.clientCode)}>
                            <Copy size={14} className="mr-2" /> Copier le code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger disabled={!isReal}>
                              Changer de statut {!isReal && '(exemple)'}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-52">
                              {allStatuses
                                .filter((s): s is DossierStatus => s !== 'all')
                                .map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    disabled={s === d.status}
                                    onClick={() => changeStatus(d, s)}
                                  >
                                    {statusConfig[s].label}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center">
              <FolderOpen size={26} className="text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-bold text-navy">Aucun dossier trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                {source === 'mine'
                  ? 'Créez votre premier dossier ou ajustez les filtres.'
                  : 'Aucun exemple ne correspond à ces filtres.'}
              </p>
            </div>
            {source === 'mine' && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all"
              >
                <Plus size={16} /> Nouveau dossier
              </button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur{' '}
              {filtered.length} dossier{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border hover:bg-mist disabled:opacity-40 transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-navy px-2">
                {currentPage} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="p-2 rounded-lg border border-border hover:bg-mist disabled:opacity-40 transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick preview */}
      <Dialog open={preview !== null} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-md">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.debtorName}</DialogTitle>
                <DialogDescription className="font-mono">{preview.clientCode}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-mist rounded-xl p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Montant</dt>
                  <dd className="font-black text-navy">{preview.amount.toLocaleString('fr-FR')} TND</dd>
                </div>
                <div className="bg-mist rounded-xl p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut</dt>
                  <dd>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', statusConfig[preview.status].color)}>
                      {statusConfig[preview.status].label}
                    </span>
                  </dd>
                </div>
                <div className="bg-mist rounded-xl p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score risque</dt>
                  <dd className="font-black text-navy">{preview.scoringResult.score}/100</dd>
                </div>
                <div className="bg-mist rounded-xl p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agent</dt>
                  <dd className="font-bold text-navy text-xs pt-1">{preview.agent}</dd>
                </div>
              </dl>
              <p className="text-sm text-muted-foreground bg-blue-50 border border-blue-100 rounded-xl p-3">
                {preview.scoringResult.recommandation}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NouveauDossierModal open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}
