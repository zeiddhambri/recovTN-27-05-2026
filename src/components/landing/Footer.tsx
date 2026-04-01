import { Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink pt-24 pb-12 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-16 mb-20">
          <div className="lg:col-span-2">
            <a href="#" className="text-3xl font-extrabold tracking-tighter mb-8 block font-syne">
              <span className="text-sky">Recov</span>TN
            </a>
            <p className="text-gray-500 max-w-md leading-relaxed mb-10">
              La première plateforme LegalTech tunisienne dédiée à l'optimisation du recouvrement bancaire. Nous aidons les institutions financières à réduire leurs NPL grâce à l'innovation technologique.
            </p>
            <div className="flex gap-4">
              {[Linkedin, Twitter, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-sky transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Navigation</h4>
            <ul className="space-y-4">
              {['Problème', 'Fonctionnalités', 'Comment ça marche', 'Tarifs', 'Blog'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-8">Contact</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <MapPin size={18} className="text-sky shrink-0" />
                <span className="text-gray-400 text-sm leading-relaxed">Immeuble Carthage, Les Berges du Lac 1, 1053 Tunis, Tunisie</span>
              </li>
              <li className="flex gap-4">
                <Phone size={18} className="text-sky shrink-0" />
                <span className="text-gray-400 text-sm">+216 71 000 000</span>
              </li>
              <li className="flex gap-4">
                <Mail size={18} className="text-sky shrink-0" />
                <span className="text-gray-400 text-sm">contact@recovtn.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-600">
            © 2026 RecovTN. Tous droits réservés. Développé pour le secteur bancaire tunisien.
          </p>
          <div className="flex gap-8 items-center">
            <div className="flex gap-2 items-center grayscale opacity-30">
              <div className="text-[10px] font-bold uppercase tracking-widest">Certifié</div>
              <div className="bg-white text-ink px-2 py-0.5 rounded font-black text-[8px]">ISO 27001</div>
              <div className="bg-white text-ink px-2 py-0.5 rounded font-black text-[8px]">GDPR</div>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Confidentialité</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Mentions Légales</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
