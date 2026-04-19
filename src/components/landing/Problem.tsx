import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import cardAmiable from '@/assets/card-amiable.jpg';
import cardContact from '@/assets/card-contact.jpg';
import cardContentieux from '@/assets/card-contentieux.jpg';

const cards = [
  {
    img: cardAmiable,
    title: 'Recouvrement amiable',
    desc: "Notre volonté : résoudre l'impayé à l'amiable pour vous éviter une procédure judiciaire parfois longue et coûteuse.",
    href: '#features',
    cta: 'En savoir plus',
  },
  {
    img: cardContentieux,
    title: 'Recouvrement judiciaire',
    desc: "Si l'amiable n'aboutit pas, nos experts juridiques pilotent la procédure contentieuse en lien avec notre réseau d'avocats.",
    href: '#features',
    cta: 'En savoir plus',
  },
  {
    img: cardContact,
    title: 'Nous contacter',
    desc: 'Par téléphone +216 71 000 000 ou par email : contact@recovtn.com',
    href: '#contact',
    cta: 'Prendre contact',
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 lg:py-32 bg-paper-soft">
      <div className="container-atr">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-16">
          <div className="lg:col-span-6">
            <h2 className="h-display mb-0">
              Obtenez le paiement de vos factures impayées, en Tunisie, à l'international
            </h2>
          </div>
          <div className="lg:col-span-6 lg:pt-3">
            <p className="text-slate text-[17px] leading-[1.7] font-light">
              Nous pouvons recouvrer vos créances en retard de paiement dans le monde entier
              via notre réseau&nbsp;: plus de 300 collaborateurs et plus de 450 avocats partenaires.
              Une action amiable sera toujours privilégiée pour obtenir des résultats rapides.
              Si nécessaire, une procédure judiciaire sera recommandée.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((c, i) => (
            <motion.a
              key={i}
              href={c.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group block bg-white overflow-hidden rounded-sm shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-mist">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  width={864}
                  height={704}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-7 lg:p-8">
                <h3 className="font-serif-display text-2xl text-charcoal mb-3 group-hover:text-crimson transition-colors">
                  {c.title}
                </h3>
                <p className="text-slate text-[15px] leading-relaxed mb-6 font-light">
                  {c.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-crimson text-[13px] font-semibold uppercase tracking-wider">
                  {c.cta}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
