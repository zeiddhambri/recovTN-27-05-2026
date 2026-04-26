import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

export default function LeasingNew() {
  return (
    <div className="space-y-6 pb-12">
      <Link to="/leasing" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[hsl(var(--charcoal))] transition">
        <ArrowLeft size={14} /> Retour au portefeuille
      </Link>
      <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
        <Construction size={32} className="mx-auto text-teal-600 mb-3" />
        <h2 className="font-serif-display text-2xl text-[hsl(var(--charcoal))] mb-2">Wizard nouveau contrat</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Le wizard 5 étapes (Preneur, Bien, Conditions, Garanties, Récap) est prévu pour la prochaine itération.
        </p>
      </div>
    </div>
  );
}
