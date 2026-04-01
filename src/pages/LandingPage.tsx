import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="relative">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky to-gold z-[60] origin-left"
        style={{ scaleX }}
      />

      <Navbar />
      
      <main>
        <Hero />
        
        <div className="bg-mist py-8 overflow-hidden border-y border-border">
          <div className="flex whitespace-nowrap animate-marquee">
            {[1, 2, 3, 4].map((_) => (
              <div key={_} className="flex items-center gap-16 px-8">
                <span className="text-navy/20 font-black text-xl tracking-widest">BANQUE ALPHA</span>
                <span className="text-navy/20 font-black text-xl tracking-widest">FINANCIA</span>
                <span className="text-navy/20 font-black text-xl tracking-widest">LEASING PRO</span>
                <span className="text-navy/20 font-black text-xl tracking-widest">MAGHREB BANK</span>
                <span className="text-navy/20 font-black text-xl tracking-widest">BNA</span>
                <span className="text-navy/20 font-black text-xl tracking-widest">AMEN BANK</span>
              </div>
            ))}
          </div>
        </div>

        <Problem />
        <Features />
        
        <section id="contact" className="py-24 bg-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cobalt/50 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky/10 rounded-full blur-[120px]" />
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight font-syne">
              Prêt à moderniser votre <span className="text-gold italic">recouvrement</span> ?
            </h2>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              Rejoignez les institutions financières qui font confiance à RecovTN pour optimiser leurs processus juridiques et réduire leurs provisions.
            </p>
            
            <form className="max-w-md mx-auto space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="email" 
                  placeholder="votre@email.com" 
                  className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-sky transition-all"
                />
                <button className="bg-gradient-to-r from-gold to-gold-light text-navy px-8 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-gold/20">
                  Demander une démo
                </button>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Aucune carte de crédit requise · Démo personnalisée sous 24h
              </p>
            </form>
          </div>
        </section>

        <Pricing />
      </main>

      <Footer />

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center shadow-2xl hover:bg-sky transition-all z-40 transform hover:-translate-y-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
    </div>
  );
}
