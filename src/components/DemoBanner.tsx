import { FlaskConical } from 'lucide-react';

interface DemoBannerProps {
  /** Override the default message when a page mixes real + demo data. */
  text?: string;
}

/**
 * Persistent, honest marker shown on every screen that renders
 * demonstration (mock) data instead of live data.
 */
export default function DemoBanner({ text }: DemoBannerProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
    >
      <FlaskConical size={16} className="shrink-0" aria-hidden />
      <p>{text ?? 'Données de démonstration — connectez vos sources de données pour passer en mode réel.'}</p>
    </div>
  );
}
