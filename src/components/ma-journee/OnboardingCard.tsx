import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, PartyPopper, X } from 'lucide-react';
import {
  fetchOnboardingProgress,
  isOnboardingHidden,
  hideOnboarding,
  type OnboardingProgress,
} from '@/lib/onboarding';

export default function OnboardingCard({ userId }: { userId: string }) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [hidden, setHidden] = useState(() => isOnboardingHidden(userId));

  useEffect(() => {
    if (hidden) return;
    fetchOnboardingProgress()
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [hidden]);

  if (hidden || !progress) return null;

  const handleHide = () => {
    hideOnboarding(userId);
    setHidden(true);
  };

  return (
    <section
      aria-label="Premiers pas"
      className="relative overflow-hidden rounded-2xl border border-navy/10 bg-white p-5 sm:p-6 shadow-sm"
    >
      <button
        onClick={handleHide}
        aria-label="Masquer les premiers pas"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-mist hover:text-navy transition"
      >
        <X size={16} aria-hidden />
      </button>

      <div className="flex flex-wrap items-center gap-3 pr-8">
        {progress.allDone ? (
          <PartyPopper size={22} className="text-crimson" aria-hidden />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
            {progress.doneCount}/{progress.total}
          </span>
        )}
        <div>
          <h2 className="font-syne text-lg font-bold text-navy">
            {progress.allDone
              ? 'Premier euro recouvré — bravo !'
              : 'Bienvenue — vos premiers pas vers le premier euro recouvré'}
          </h2>
          <p className="text-sm text-slate-500">
            {progress.allDone
              ? 'Vous maîtrisez le cycle complet : portefeuille, qualification, relance, encaissement.'
              : 'Chaque étape se valide automatiquement dès que vous l\'accomplissez vraiment.'}
          </p>
        </div>
      </div>

      {!progress.allDone && (
        <>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-mist"
            role="progressbar"
            aria-valuenow={progress.doneCount}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          >
            <div
              className="h-full rounded-full bg-crimson transition-all"
              style={{ width: `${(progress.doneCount / progress.total) * 100}%` }}
            />
          </div>

          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {progress.steps.map((s) => (
              <li
                key={s.id}
                className={`flex gap-3 rounded-xl border p-3.5 ${
                  s.done ? 'border-green-200 bg-green-50/50' : 'border-navy/10 bg-mist/40'
                }`}
              >
                {s.done ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                    <Check size={14} aria-hidden />
                  </span>
                ) : (
                  <Circle size={24} className="shrink-0 text-slate-300" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.detail}</p>
                  {!s.done && (
                    <Link
                      to={s.to}
                      className="mt-1.5 inline-block text-xs font-bold text-sky hover:underline"
                    >
                      {s.cta} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
