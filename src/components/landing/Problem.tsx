import { motion } from 'framer-motion';
import { AlertCircle, Clock, FileText, Lock } from 'lucide-react';

export default function Problem() {
  const problems = [
    { icon: <FileText className="text-sky" />, title: "Dossiers dispersés", desc: "Les équipes juridiques jonglent entre Excel, emails et documents Word sans vue centralisée." },
    { icon: <Clock className="text-sky" />, title: "Délais non contrôlés", desc: "Les actions prescriptibles passent à travers les mailles du filet faute de rappels automatisés." },
    { icon: <AlertCircle className="text-sky" />, title: "Reporting manuel", desc: "Préparer les rapports pour les comités mobilise des journées entières de travail répétitif." },
    { icon: <Lock className="text-sky" />, title: "Risque de conformité", desc: "Les exigences BCT/CTAF évoluent. Sans alerte, le risque de non-conformité est permanent." }
  ];

  return (
    <section id="problem" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sky font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Le Problème</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy leading-tight mb-6 font-syne">
              Le recouvrement bancaire tunisien fonctionne encore à l'ère papier
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Chaque point de NPL non géré représente des millions de dinars en provisions supplémentaires. Les banques tunisiennes perdent une efficacité précieuse à cause de processus archaïques.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {problems.map((p, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky/5 flex items-center justify-center shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm mb-1">{p.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-navy rounded-[2rem] p-10 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky via-gold to-sky" />
              
              <h3 className="text-white font-bold text-xl mb-8 font-syne">Taux NPL — Comparatif régional 2024</h3>
              
              <div className="space-y-8">
                {[
                  { flag: "🇹🇳", country: "Tunisie", pct: "13.4%", width: "65%", color: "from-red-500 to-red-400", textColor: "text-red-400", delay: 0 },
                  { flag: "🇲🇦", country: "Maroc", pct: "8.1%", width: "40%", color: "from-sky to-sky-light", textColor: "text-sky-light", delay: 0.2 },
                  { flag: "🇫🇷", country: "France", pct: "3.2%", width: "18%", color: "from-green-500 to-green-400", textColor: "text-green-400", delay: 0.4 },
                ].map((item) => (
                  <div key={item.country}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">{item.flag} {item.country}</span>
                      <span className={`${item.textColor} font-bold`}>{item.pct}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: item.width }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: item.delay }}
                        className={`h-full bg-gradient-to-r ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 italic">
                  "RecovTN aide à réduire ce coût de manière systématique en automatisant les workflows de recouvrement."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
