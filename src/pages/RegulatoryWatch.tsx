import { useState } from 'react';
import { ShieldCheck, Search, Plus, ExternalLink, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Circular {
  id: string;
  source: 'BCT' | 'CTAF';
  reference: string;
  title: string;
  summary: string;
  date: string;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

const mockCirculars: Circular[] = [
  { id: '1', source: 'BCT', reference: '2024-05', title: 'Nouvelles normes de provisionnement des créances douteuses', summary: 'Définition des nouveaux taux de provisionnement applicables aux créances classées 3 et 4 pour l\'exercice 2024.', date: '2024-03-15' },
  { id: '2', source: 'CTAF', reference: '2023-12', title: 'Directives sur la vigilance PPE', summary: 'Mise à jour des procédures de KYC et de surveillance des transactions pour les PPE nationales et étrangères.', date: '2023-11-20' },
  { id: '3', source: 'BCT', reference: '2024-02', title: 'Reporting trimestriel des créances compromises', summary: 'Nouvelles obligations de reporting trimestriel pour les créances classées 4 et 5.', date: '2024-01-10' },
  { id: '4', source: 'CTAF', reference: '2024-01', title: 'Lutte anti-blanchiment : nouvelles mesures', summary: 'Renforcement des contrôles internes et obligations de déclaration de soupçon.', date: '2024-02-05' },
];

const mockChecklists: Record<string, ChecklistItem[]> = {
  '1': [
    { id: 'a', task: 'Mettre à jour les taux de provisionnement dans le SI', completed: true },
    { id: 'b', task: 'Former les équipes au nouveau barème', completed: false },
    { id: 'c', task: 'Préparer le rapport de conformité Q1 2024', completed: false },
  ],
  '2': [
    { id: 'd', task: 'Réviser la liste des PPE nationales', completed: true },
    { id: 'e', task: 'Mettre à jour les procédures KYC', completed: true },
    { id: 'f', task: 'Former le personnel front-office', completed: false },
  ],
};

export default function RegulatoryWatch() {
  const [activeTab, setActiveTab] = useState<'circulars' | 'checklists'>('circulars');
  const [selectedCircularId, setSelectedCircularId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockCirculars.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Veille Réglementaire</h1>
          <p className="text-muted-foreground mt-1">Circulaires BCT/CTAF et check-lists de conformité.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all shadow-lg shadow-sky/20">
          <Plus size={18} />
          Ajouter une circulaire
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une circulaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'circulars', label: 'Circulaires' },
            { key: 'checklists', label: 'Check-lists' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'circulars' | 'checklists')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.key ? "bg-navy text-white" : "bg-card border border-border text-muted-foreground hover:bg-mist"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'circulars' ? (
        <div className="space-y-4">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedCircularId(selectedCircularId === c.id ? null : c.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    c.source === 'BCT' ? "bg-sky/10 text-sky" : "bg-gold/10 text-gold"
                  )}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        c.source === 'BCT' ? "text-sky" : "text-gold"
                      )}>
                        {c.source} {c.reference}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                    </div>
                    <p className="font-bold text-navy text-sm mb-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.summary}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted-foreground shrink-0" />
              </div>

              {selectedCircularId === c.id && mockChecklists[c.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Check-list de conformité</h4>
                  <div className="space-y-2">
                    {mockChecklists[c.id].map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-mist rounded-xl">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          item.completed ? "bg-green-500 text-white" : "bg-border"
                        )}>
                          {item.completed && <CheckCircle2 size={12} />}
                        </div>
                        <span className={cn("text-sm", item.completed ? "text-muted-foreground line-through" : "text-navy font-medium")}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {mockCirculars.filter(c => mockChecklists[c.id]).map((c) => {
            const items = mockChecklists[c.id];
            const completed = items.filter(i => i.completed).length;
            const total = items.length;
            const pct = Math.round((completed / total) * 100);

            return (
              <div key={c.id} className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky">{c.source} {c.reference}</span>
                    <p className="font-bold text-navy text-sm">{c.title}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full",
                    pct === 100 ? "text-green-500 bg-green-50" : pct > 50 ? "text-gold bg-gold/10" : "text-red-500 bg-red-50"
                  )}>
                    {pct === 100 ? <CheckCircle2 size={12} /> : pct > 50 ? <Clock size={12} /> : <AlertTriangle size={12} />}
                    {pct}%
                  </div>
                </div>
                <div className="h-2 bg-mist rounded-full overflow-hidden">
                  <div className="h-full bg-sky rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{completed}/{total} tâches complétées</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
