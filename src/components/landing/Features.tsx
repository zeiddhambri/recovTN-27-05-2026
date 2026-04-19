import { motion } from 'framer-motion';
import { Database, Scale, BarChart3, Bell, Users, Search, ArrowRight } from 'lucide-react';

const features = [
  { icon: Database, title: 'Gestion des dossiers', desc: 'Centralisation de tous les crédits classifiés avec historique complet et workflow de régularisation.' },
  { icon: Scale, title: 'Suivi contentieux', desc: 'Agenda judiciaire intégré, alertes de délais, et tableau de bord avocats/huissiers.' },
  { icon: BarChart3, title: 'Reporting automatisé', desc: 'Génération automatique des rapports comité de recouvrement et régulateur BCT en un clic.' },
  { icon: Bell, title: 'Veille réglementaire', desc: 'Veille automatisée des circulaires BCT/CTAF avec check-lists de mise en conformité.' },
  { icon: Users, title: 'Espace intervenants', desc: 'Portail sécurisé pour les avocats partenaires et huissiers avec accès granulaire.' },
  { icon: Search, title: 'Scoring & analytics', desc: "Scoring de recouvrement basé sur l'historique pour prioriser les actions à fort ROI." },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="container-atr">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20">
          <div className="lg:col-span-5">
            <span className="eyebrow mb-5 block">Nos services</span>
            <h2 className="h-display">
              Une expertise complète au service du recouvrement bancaire
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-4">
            <p className="text-slate text-[17px] leading-[1.7] font-light mb-6">
              RecovTN couvre le cycle complet de la créance — de la première alerte
              à la clôture du dossier contentieux. Nos modules s'adaptent à la taille
              et à la maturité de votre institution.
            </p>
            <a href="#pricing" className="inline-flex items-center gap-2 text-crimson text-[13px] font-semibold uppercase tracking-wider">
              Découvrir nos offres <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="group bg-white p-10 hover:bg-paper-soft transition-colors duration-300 cursor-pointer"
              >
                <Icon className="text-crimson mb-6" size={32} strokeWidth={1.4} />
                <h3 className="font-serif-display text-[22px] text-charcoal mb-3 group-hover:text-crimson transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate text-[15px] leading-relaxed font-light">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
