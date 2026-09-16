import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Accueil', href: '#top' },
    { name: 'Approche', href: '#problem' },
    { name: 'Modules', href: '#features' },
    { name: 'Tarifs', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border'
          : 'bg-white/80 backdrop-blur-sm'
      )}
    >
      <div className="container-atr flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2" aria-label="RecovTN — accueil">
          <span className="text-crimson text-2xl" aria-hidden>✦</span>
          <div className="leading-none">
            <div className="font-serif-display text-2xl text-charcoal tracking-tight">RecovTN</div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[13px] font-medium text-charcoal hover:text-crimson transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link
            to="/auth"
            className="hidden sm:flex items-center gap-2 text-[13px] font-medium text-charcoal hover:text-crimson transition-colors"
          >
            <User size={16} aria-hidden />
            Connexion
          </Link>
          <a href="#contact" className="hidden md:inline-flex btn-crimson !px-5 !py-2.5 text-[13px]">
            Demander une démo
          </a>
          <button
            className="lg:hidden text-charcoal p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-border p-6 flex flex-col gap-1 lg:hidden shadow-lg"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-charcoal py-3 border-b border-border last:border-0"
              >
                {link.name}
              </a>
            ))}
            <Link
              to="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn-crimson mt-4 w-full"
            >
              Se connecter
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
