import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';
import { ArrowUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative bg-white">
      <Navbar />

      <main>
        <Hero />
        <Problem />
        <Features />

        {/* CTA Section */}
        <section id="contact" className="py-24 lg:py-32 bg-white border-t border-border">
          <div className="container-atr">
            <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
              <div className="lg:col-span-7">
                <span className="eyebrow mb-5 block">Demande de devis</span>
                <h2 className="h-display">
                  Une facture impayée&nbsp;? Obtenez un devis personnalisé sous 24h
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-slate text-[16px] font-light leading-relaxed">
                  Décrivez-nous votre situation : nos experts vous proposent une stratégie
                  amiable ou judiciaire adaptée, sans engagement.
                </p>
              </div>
            </div>

            <form
              className="grid md:grid-cols-12 gap-4 max-w-4xl"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="Votre nom"
                className="md:col-span-4 px-5 py-4 rounded-sm bg-paper-soft border border-border text-charcoal placeholder:text-slate/70 focus:outline-none focus:border-crimson transition-colors"
              />
              <input
                type="email"
                placeholder="Email professionnel"
                className="md:col-span-4 px-5 py-4 rounded-sm bg-paper-soft border border-border text-charcoal placeholder:text-slate/70 focus:outline-none focus:border-crimson transition-colors"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                className="md:col-span-4 px-5 py-4 rounded-sm bg-paper-soft border border-border text-charcoal placeholder:text-slate/70 focus:outline-none focus:border-crimson transition-colors"
              />
              <button type="submit" className="btn-crimson md:col-span-4 mt-2">
                Demander un devis
              </button>
            </form>
          </div>
        </section>

        <Pricing />
      </main>

      <Footer />

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-crimson text-white flex items-center justify-center shadow-lg hover:bg-crimson-hover transition-all z-40"
        aria-label="Retour en haut"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
