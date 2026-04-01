import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Brain, Sparkles, TrendingUp, Target, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const COLORS = ['#2E6BE6', '#D4A843', '#EF4444', '#10B981', '#8B5CF6'];

const statusData = [
  { name: 'Phase 1', value: 85 },
  { name: 'Phase 2', value: 47 },
  { name: 'Litige', value: 42 },
  { name: 'Clos', value: 78 },
];

const levelData = [
  { name: 'Recouvreur', amount: 1200000 },
  { name: 'Directeur', amount: 2800000 },
  { name: 'Comité', amount: 4500000 },
];

const trendData = [
  { month: 'Jan', recouvrement: 820000, nouveaux: 12 },
  { month: 'Fév', recouvrement: 950000, nouveaux: 8 },
  { month: 'Mar', recouvrement: 1100000, nouveaux: 15 },
  { month: 'Avr', recouvrement: 880000, nouveaux: 10 },
  { month: 'Mai', recouvrement: 1250000, nouveaux: 7 },
  { month: 'Jun', recouvrement: 1400000, nouveaux: 11 },
];

export default function Analytics() {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiAnalysis("📊 Analyse du portefeuille :\n\n• Le taux de recouvrement a augmenté de 15% sur les 6 derniers mois\n• 42 dossiers en litige nécessitent une attention prioritaire\n• Le niveau Comité concentre 53% de l'encours total\n• Recommandation : prioriser les dossiers Phase 2 avec montant > 100k TND pour maximiser le taux de récupération\n• Le taux NPL est en baisse de 0.3% par rapport au trimestre précédent");
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Analyses & Intelligence</h1>
          <p className="text-muted-foreground mt-1">Insights basés sur vos données de recouvrement.</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg",
            isAnalyzing ? "bg-muted text-muted-foreground" : "bg-gradient-to-r from-sky to-cobalt text-white shadow-sky/20 hover:scale-105"
          )}
        >
          {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
          {isAnalyzing ? "Analyse en cours..." : "Analyse IA"}
        </button>
      </div>

      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-navy to-cobalt rounded-3xl p-8 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <Brain size={24} className="text-gold" />
            <h3 className="text-lg font-bold font-syne">Analyse IA du portefeuille</h3>
          </div>
          <pre className="text-sm text-white/80 whitespace-pre-wrap font-dm leading-relaxed">{aiAnalysis}</pre>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={5}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}: <strong className="text-navy">{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Encours par niveau de gestion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} TND`} />
              <Bar dataKey="amount" fill="hsl(var(--sky))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border lg:col-span-2">
          <h3 className="text-lg font-bold text-navy mb-6 font-syne">Tendance de recouvrement (6 mois)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} TND`} />
              <Area type="monotone" dataKey="recouvrement" stroke="hsl(var(--sky))" fill="hsl(var(--sky))" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Taux de Recouvrement", value: "32%", icon: TrendingUp, trend: "+5% vs trimestre précédent" },
          { label: "Montant Moyen Dossier", value: "94,500 TND", icon: Target, trend: "252 dossiers actifs" },
          { label: "Délai Moyen Clôture", value: "45 jours", icon: Download, trend: "-8 jours vs moyenne" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-3xl p-6 shadow-sm border border-border"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky/10 flex items-center justify-center text-sky mb-4">
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-navy mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.trend}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
