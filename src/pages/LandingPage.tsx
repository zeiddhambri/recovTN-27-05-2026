import { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';
import { ArrowUp, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function LandingPage() {
  return (
    <div id="top" className="relative bg-white">
      <Navbar />

      <main>
        <Hero />
        <Problem />
        <Features />

        {/* CTA Section — Demande de démo */}
        <section id="contact" className="py-24 lg:py-32 bg-white border-t border-border">
          <div className="container-atr">
            <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
              <div className="lg:col-span-7">
                <span className="eyebrow mb-5 block">Demande de démo</span>
                <h2 className="h-display">
                  Découvrez RecovTN sur votre portefeuille — démo personnalisée sous 48h
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-slate text-[16px] font-light leading-relaxed">
                  Présentez-nous votre contexte (banque, IMF, société de recouvrement)
                  et le volume de dossiers à piloter. Nous vous proposons une démo
                  ciblée des modules pertinents.
                </p>
              </div>
            </div>

            <DemoForm />
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

const inputCls =
  'w-full px-5 py-4 rounded-sm bg-paper-soft border border-border text-charcoal placeholder:text-slate/70 focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/15 transition-colors';

function DemoForm() {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    const { error } = await supabase
      .from('demo_requests')
      .insert({ name: name.trim(), institution: institution.trim() || null, email: email.trim() });
    setStatus(error ? 'error' : 'sent');
  };

  if (status === 'sent') {
    return (
      <div role="status" className="max-w-4xl flex items-start gap-4 p-6 rounded-sm bg-green-50 border border-green-200">
        <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="font-serif-display text-xl text-charcoal mb-1">Demande bien reçue, merci {name.split(' ')[0]} !</p>
          <p className="text-slate text-[15px] font-light">
            Notre équipe vous recontactera sous 48h ouvrées pour planifier votre démo personnalisée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="grid md:grid-cols-12 gap-4 max-w-4xl" onSubmit={submit}>
      <div className="md:col-span-4">
        <label htmlFor="demo-name" className="sr-only">Nom et prénom</label>
        <input
          id="demo-name"
          type="text"
          required
          autoComplete="name"
          placeholder="Nom et prénom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="md:col-span-4">
        <label htmlFor="demo-institution" className="sr-only">Institution</label>
        <input
          id="demo-institution"
          type="text"
          autoComplete="organization"
          placeholder="Institution"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="md:col-span-4">
        <label htmlFor="demo-email" className="sr-only">Email professionnel</label>
        <input
          id="demo-email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email professionnel"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="md:col-span-12">
        <button type="submit" disabled={status === 'sending'} className="btn-crimson md:col-span-4 mt-2 disabled:opacity-60">
          {status === 'sending' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" aria-hidden /> Envoi en cours…
            </span>
          ) : (
            'Demander une démo'
          )}
        </button>
        {status === 'error' && (
          <p role="alert" className="mt-3 text-sm text-crimson">
            L'envoi a échoué. Réessayez dans un instant ou écrivez-nous directement à{' '}
            <a className="underline font-medium" href="mailto:contact@recovtn.tn">contact@recovtn.tn</a>.
          </p>
        )}
      </div>
    </form>
  );
}
