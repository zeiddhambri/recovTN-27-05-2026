import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Pricing() {
  const plans = [
    {
      name: "Standard", price: "499",
      desc: "Pour les agences de recouvrement et petites institutions.",
      features: ["Jusqu'à 500 dossiers", "Gestion contentieux de base", "Reporting mensuel", "Support email", "1 utilisateur Admin"],
      featured: false
    },
    {
      name: "Business", price: "1,299",
      desc: "La solution complète pour les banques de taille moyenne.",
      features: ["Dossiers illimités", "Workflow contentieux avancé", "Espace Avocats & Huissiers", "Reporting BCT automatisé", "Support prioritaire 24/7", "5 utilisateurs"],
      featured: true
    },
    {
      name: "Enterprise", price: "Sur mesure",
      desc: "Infrastructure dédiée pour les grandes institutions bancaires.",
      features: ["Déploiement On-Premise possible", "API & Intégration Core Banking", "IA Prédictive avancée", "Audit de conformité trimestriel", "Account Manager dédié", "Utilisateurs illimités"],
      featured: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-sky font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Tarification</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6 font-syne">
            Un investissement rentable dès le premier dossier
          </h2>
          <p className="text-muted-foreground text-lg">
            Choisissez le plan qui correspond à la taille de votre portefeuille de créances.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "relative p-10 rounded-[2.5rem] transition-all duration-500",
                plan.featured
                  ? "bg-navy text-white shadow-2xl scale-105 z-10 border-transparent"
                  : "bg-card text-foreground border border-border hover:shadow-xl"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold-light text-navy text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg">
                  Plus Populaire
                </div>
              )}

              <div className={cn("text-xs font-bold uppercase tracking-widest mb-4", plan.featured ? "text-sky-light" : "text-sky")}>
                {plan.name}
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black">{plan.price}</span>
                {plan.price !== "Sur mesure" && <span className={cn("text-sm", plan.featured ? "text-white/40" : "text-muted-foreground")}>TND / mois</span>}
              </div>

              <p className={cn("text-sm mb-8 leading-relaxed", plan.featured ? "text-white/60" : "text-muted-foreground")}>
                {plan.desc}
              </p>

              <div className={cn("h-px w-full mb-8", plan.featured ? "bg-white/10" : "bg-border")} />

              <ul className="space-y-4 mb-10">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-medium">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.featured ? "bg-sky/20 text-sky-light" : "bg-sky/5 text-sky")}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={cn(
                "w-full py-4 rounded-full font-bold transition-all transform hover:-translate-y-1",
                plan.featured
                  ? "bg-gradient-to-r from-sky to-cobalt text-white shadow-xl shadow-sky/20"
                  : "border-2 border-navy text-navy hover:bg-navy hover:text-white"
              )}>
                Choisir ce plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
