import { motion } from 'framer-motion';
import { Play, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-navy">
      <div className="absolute inset-0 hero-grid animate-grid opacity-20" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky/10 border border-sky/20 text-sky-light text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-sky animate-pulse" />
            LegalTech Leader · Tunisie & Maghreb
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight font-syne">
            Transformez votre <span className="text-gold italic">recouvrement</span> en avantage compétitif
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
            RecovTN est la première plateforme SaaS tunisienne dédiée à la gestion intelligente des créances douteuses et du contentieux bancaire. Conçue pour les banques, par des experts du droit.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="group bg-gradient-to-r from-sky to-cobalt text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-sky/20">
              Essai Gratuit
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 rounded-full border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-white/5 transition-all">
              <Play size={20} fill="currentColor" />
              Voir la démo
            </button>
          </div>

          <div className="mt-16 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
            <span className="text-white font-bold text-sm tracking-widest uppercase">Trusted by</span>
            <div className="flex gap-6 items-center">
              <div className="text-white font-black text-xl">BNA</div>
              <div className="text-white font-black text-xl">AMEN</div>
              <div className="text-white font-black text-xl">BIAT</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 bg-navy/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-white/10 rounded-full" />
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Taux NPL</div>
                  <div className="text-2xl font-bold text-white">13.4%</div>
                  <div className="text-[10px] text-red-400 mt-1">▲ +0.2% vs Q3</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Recouvrement</div>
                  <div className="text-2xl font-bold text-gold">8.2M TND</div>
                  <div className="text-[10px] text-green-400 mt-1">▲ +15% objectif</div>
                </div>
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky/20 flex items-center justify-center text-sky text-xs font-bold">#{i}</div>
                      <div className="space-y-1">
                        <div className="h-2 w-24 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-16 bg-white/10 rounded-full" />
                      </div>
                    </div>
                    <div className="h-4 w-12 bg-white/10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 bg-gold p-4 rounded-2xl shadow-xl z-20"
          >
            <ShieldCheck className="text-navy" size={32} />
          </motion.div>
          
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -left-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl z-20"
          >
            <div className="text-white font-bold text-xl">98%</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">Conformité BCT</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
