import { useState } from 'react';
import { Search, Plus, Filter, FileText, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Dossier {
  id: string;
  clientCode: string;
  debtorName: string;
  amount: number;
  status: 'phase1' | 'phase2' | 'litige' | 'clos';
  managementLevel: string;
  date: string;
}

const mockDossiers: Dossier[] = [
  { id: '1', clientCode: 'RCV-2024-001', debtorName: 'SOCIETE ALPHA SARL', amount: 145000, status: 'phase2', managementLevel: 'directeur', date: '2024-03-15' },
  { id: '2', clientCode: 'RCV-2024-002', debtorName: 'BEN SALEM AHMED', amount: 22000, status: 'litige', managementLevel: 'comite', date: '2024-03-14' },
  { id: '3', clientCode: 'RCV-2024-003', debtorName: 'GLOBAL TECH TUNISIE', amount: 890000, status: 'phase1', managementLevel: 'recouvreur', date: '2024-03-13' },
  { id: '4', clientCode: 'RCV-2024-004', debtorName: 'KARIM ENTERPRISES', amount: 56000, status: 'clos', managementLevel: 'directeur', date: '2024-03-12' },
  { id: '5', clientCode: 'RCV-2024-005', debtorName: 'MEDITERANEE INVEST', amount: 320000, status: 'phase1', managementLevel: 'recouvreur', date: '2024-03-11' },
  { id: '6', clientCode: 'RCV-2024-006', debtorName: 'TUNISAIR HANDLING', amount: 78000, status: 'phase2', managementLevel: 'directeur', date: '2024-03-10' },
  { id: '7', clientCode: 'RCV-2024-007', debtorName: 'CARTHAGE CEMENT', amount: 1200000, status: 'litige', managementLevel: 'comite', date: '2024-03-09' },
  { id: '8', clientCode: 'RCV-2024-008', debtorName: 'STAR ASSURANCES', amount: 45000, status: 'phase1', managementLevel: 'recouvreur', date: '2024-03-08' },
];

const statusColors: Record<string, string> = {
  phase1: 'text-sky bg-sky/10',
  phase2: 'text-gold bg-gold/10',
  litige: 'text-red-500 bg-red-50',
  clos: 'text-green-500 bg-green-50',
};

const statusLabels: Record<string, string> = {
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  litige: 'Litige',
  clos: 'Clos',
};

export default function Dossiers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = mockDossiers.filter(d => {
    const matchesSearch = d.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) || d.clientCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Gestion Des Dossiers Recouvrement</h1>
          <p className="text-muted-foreground mt-1">Gérez vos dossiers de recouvrement et suivez les actions en cours.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all shadow-lg shadow-sky/20">
          <Plus size={18} />
          Nouveau dossier
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'phase1', 'phase2', 'litige', 'clos'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                statusFilter === s ? "bg-navy text-white" : "bg-card border border-border text-muted-foreground hover:bg-mist"
              )}
            >
              {s === 'all' ? 'Tous' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="text-left p-4">Code</th>
                <th className="text-left p-4">Débiteur</th>
                <th className="text-left p-4">Montant</th>
                <th className="text-left p-4">Niveau</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border hover:bg-mist transition-colors"
                >
                  <td className="p-4 text-sm font-mono text-muted-foreground">{d.clientCode}</td>
                  <td className="p-4 font-bold text-sm text-navy">{d.debtorName}</td>
                  <td className="p-4 text-sm font-mono">{d.amount.toLocaleString()} TND</td>
                  <td className="p-4 text-xs text-muted-foreground capitalize">{d.managementLevel}</td>
                  <td className="p-4">
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", statusColors[d.status])}>
                      {statusLabels[d.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{d.date}</td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-mist rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
