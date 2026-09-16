import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import DemoBanner from '@/components/DemoBanner';

const COLORS = ['#0D1B3E', '#2E6BE6', '#D4A843', '#EF4444', '#10B981'];

// TODO(P1): remplacer par les agrégats Supabase (vues matérialisées par statut / niveau / mois).
const statusData = [
  { name: 'Phase 1', value: 85, amount: 1200000 },
  { name: 'Phase 2', value: 47, amount: 2800000 },
  { name: 'Litige', value: 42, amount: 4500000 },
  { name: 'Clos', value: 78, amount: 950000 },
];

const trendData = [
  { month: 'Jan', montant: 2800000, dossiers: 245 },
  { month: 'Fév', montant: 3100000, dossiers: 238 },
  { month: 'Mar', montant: 2950000, dossiers: 252 },
  { month: 'Avr', montant: 3400000, dossiers: 248 },
  { month: 'Mai', montant: 3200000, dossiers: 240 },
  { month: 'Jun', montant: 3650000, dossiers: 255 },
];

const levelData = [
  { name: 'Recouvreur', amount: 1200000, count: 120 },
  { name: 'Directeur', amount: 2800000, count: 85 },
  { name: 'Comité', amount: 4500000, count: 47 },
];

const RANGE_MONTHS: Record<string, number> = { '7d': 1, '30d': 2, '90d': 3, '1y': 6 };

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reporting() {
  const [timeRange, setTimeRange] = useState('30d');

  const trend = useMemo(
    () => trendData.slice(-(RANGE_MONTHS[timeRange] ?? 6)),
    [timeRange]
  );

  const exportCsv = () => {
    downloadCsv(`recovtn-reporting-${timeRange}.csv`, ['section', 'libelle', 'dossiers', 'montant_tnd'], [
      ...statusData.map((s): (string | number)[] => ['statut', s.name, s.value, s.amount]),
      ...levelData.map((l): (string | number)[] => ['niveau_gestion', l.name, l.count, l.amount]),
      ...trend.map((t): (string | number)[] => ['tendance_mensuelle', t.month, t.dossiers, t.montant]),
    ]);
    toast({ title: 'Export téléchargé', description: `recovtn-reporting-${timeRange}.csv` });
  };

  /** Rapport BCT : synthèse des créances par classe, format tableur. */
  const exportBct = () => {
    const classes: (string | number)[][] = [
      ['Classe 0 — Créances courantes', 85, 1200000, 0],
      ['Classe 1 — Créances à surveiller', 47, 2800000, 280000],
      ['Classe 2/3/4 — Créances compromises', 42, 4500000, 2250000],
    ];
    downloadCsv('recovtn-rapport-bct.csv', ['classe_bct', 'nb_dossiers', 'encours_tnd', 'provisions_estimees_tnd'], classes);
    toast({ title: 'Rapport BCT téléchargé', description: 'recovtn-rapport-bct.csv' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Reporting</h1>
          <p className="text-muted-foreground mt-1">Rapports de suivi et indicateurs de performance.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-mist transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={exportBct}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all shadow-lg shadow-sky/20"
          >
            <FileText size={16} />
            Rapport BCT
          </button>
        </div>
      </div>

      <DemoBanner />

      <div className="flex gap-2 flex-wrap">
        {[
          { key: '7d', label: '7 jours' },
          { key: '30d', label: '30 jours' },
          { key: '90d', label: '90 jours' },
          { key: '1y', label: '1 an' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTimeRange(t.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold transition-all',
              timeRange === t.key ? 'bg-navy text-white' : 'bg-card border border-border text-muted-foreground hover:bg-mist'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Encours Total', value: '8.5M TND', color: 'text-navy' },
          { label: 'Recouvré (Période)', value: '1.2M TND', color: 'text-green-500' },
          { label: 'Taux NPL', value: '13.4%', color: 'text-red-500' },
          { label: 'Dossiers Traités', value: '252', color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-6 border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} TND`} />
              <Area type="monotone" dataKey="montant" stroke="hsl(var(--sky))" fill="hsl(var(--sky))" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={5}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border lg:col-span-2">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Encours par niveau de gestion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} TND`} />
              <Bar dataKey="amount" fill="hsl(var(--navy))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
