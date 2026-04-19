import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Standard',
    price: '499',
    desc: 'Pour les agences de recouvrement et petites institutions.',
    features: ["Jusqu'à 500 dossiers", 'Gestion contentieux de base', 'Reporting mensuel', 'Support email', '1 utilisateur Admin'],
    featured: false,
  },
  {
    name: 'Business',
    price: '1 299',
    desc: 'La solution complète pour les banques de taille moyenne.',
    features: ['Dossiers illimités', 'Workflow contentieux avancé', 'Espace Avocats & Huissiers', 'Reporting BCT automatisé', 'Support prioritaire 24/7', '5 utilisateurs'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur mesure',
    desc: 'Infrastructure dédiée pour les grandes institutions bancaires.',
    features: ['Déploiement On-Premise possible', 'API & Intégration Core Banking', 'IA Prédictive avancée', 'Audit de conformité trimestriel', 'Account Manager dédié', 'Utilisateurs illimités'],
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-paper-soft">
      <div className="container-atr">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="eyebrow mb-5 block">Tarification</span>
          <h2 className="h-display mb-6">
            Un investissement rentable dès le premier dossier
          </h2>
          <p className="text-slate text-[17px] font-light">
            Choisissez le plan qui correspond à la taille de votre portefeuille de créances.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                'relative p-10 rounded-sm transition-all duration-300 flex flex-col',
                plan.featured
                  ? 'bg-charcoal text-white shadow-xl'
                  : 'bg-white border border-border hover:shadow-lg'
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-10 bg-crimson text-white text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                  Recommandé
                </div>
              )}

              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.2em] mb-5', plan.featured ? 'text-crimson' : 'text-crimson')}>
                {plan.name}
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif-display text-5xl">{plan.price}</span>
                {plan.price !== 'Sur mesure' && (
                  <span className={cn('text-sm font-light', plan.featured ? 'text-white/60' : 'text-slate')}>
                    TND / mois
                  </span>
                )}
              </div>

              <p className={cn('text-[15px] mb-8 leading-relaxed font-light', plan.featured ? 'text-white/70' : 'text-slate')}>
                {plan.desc}
              </p>

              <div className={cn('h-px w-full mb-8', plan.featured ? 'bg-white/15' : 'bg-border')} />

              <ul className="space-y-3.5 mb-10 flex-1">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-[14px] font-light leading-relaxed">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className={cn('shrink-0 mt-0.5', plan.featured ? 'text-crimson' : 'text-crimson')}
                    />
                    <span className={plan.featured ? 'text-white/85' : 'text-charcoal'}>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                className={
                  plan.featured
                    ? 'btn-crimson w-full'
                    : 'btn-outline-crimson w-full'
                }
              >
                Choisir ce plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
