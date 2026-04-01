import React from 'react';
import { motion } from 'framer-motion';
import { Database, Scale, BarChart3, Bell, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Features() {
  const features = [
    { icon: <Database />, title: "Gestion Des Dossiers Recouvrement", desc: "Centralisation de tous les crédits classifiés avec historique complet et workflow de régularisation." },
    { icon: <Scale />, title: "Gestion Des Dossiers Contentieux", desc: "Agenda judiciaire intégré, alertes de délais, et tableau de bord avocats/huissiers." },
    { icon: <BarChart3 />, title: "Reporting automatisé", desc: "Génération automatique des rapports comité de recouvrement et régulateur BCT en un clic." },
    { icon: <Bell />, title: "Alertes réglementaires", desc: "Veille automatisée des circulaires BCT/CTAF avec check-lists de mise en conformité." },
    { icon: <Users />, title: "Espace intervenants", desc: "Portail sécurisé pour les avocats partenaires et huissiers avec accès granulaire." },
    { icon: <Search />, title: "Analytics & IA", desc: "Scoring de recouvrement basé sur l'historique pour prioriser les actions à fort ROI." }
  ];

  return (
    <section id="features" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-sky font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Notre Solution</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6 font-syne">
            Tout ce dont votre équipe juridique a besoin
          </h2>
          <p className="text-muted-foreground text-lg">
            RecovTN couvre le cycle complet de la créance — de la première alerte à la clôture du dossier contentieux.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-3xl bg-card border border-border hover:border-sky/20 hover:shadow-2xl hover:shadow-sky/5 transition-all relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky to-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              
              <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center text-navy mb-6 group-hover:bg-sky group-hover:text-white transition-all group-hover:scale-110 group-hover:-rotate-3">
                {React.cloneElement(f.icon as React.ReactElement, { size: 28 })}
              </div>
              
              <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-sky transition-colors font-syne">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div className="mt-24 relative">
          <div className="bg-navy rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky via-gold to-sky animate-pulse" />
            
            <div className="flex items-center gap-2 mb-10">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-white/40 text-xs font-mono">recovtn_dashboard_v2.0</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: "Dossiers Actifs", val: "1,248", change: "+12", up: true },
                { label: "Contentieux", val: "412", change: "-5", up: false },
                { label: "Recouvré (MTD)", val: "2.4M", change: "+18%", up: true },
                { label: "Taux Succès", val: "74%", change: "+2%", up: true },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-all">
                  <div className="text-2xl font-bold text-white mb-1">{s.val}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{s.label}</div>
                  <div className={cn("text-xs font-bold", s.up ? "text-green-400" : "text-red-400")}>
                    {s.change} {s.up ? "↑" : "↓"}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
              <div className="grid grid-cols-5 p-4 border-b border-white/10 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                <span className="col-span-2">Débiteur</span>
                <span>Phase</span>
                <span>Montant</span>
                <span>Status</span>
              </div>
              {[
                { name: "SOCIETE ALPHA SARL", phase: "Phase 2", amount: "145k", status: "Actif", color: "text-green-400" },
                { name: "BEN SALEM AHMED", phase: "Contentieux", amount: "22k", status: "Litige", color: "text-red-400" },
                { name: "GLOBAL TECH TUNISIE", phase: "Phase 1", amount: "890k", status: "Négoc.", color: "text-yellow-400" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-5 p-4 border-b border-white/5 text-sm text-white/70 hover:bg-white/5 transition-all">
                  <span className="col-span-2 font-bold">{row.name}</span>
                  <span className="text-white/40">{row.phase}</span>
                  <span className="font-mono">{row.amount} TND</span>
                  <span className={cn("text-xs font-bold", row.color)}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
