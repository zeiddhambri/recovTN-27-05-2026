# RecovTN — Pilotage du recouvrement

Plateforme SaaS de gestion du recouvrement de créances, pensée pour les **banques, IMF et sociétés de recouvrement tunisiennes** : dossiers, relances multicanal, scoring de risque, contentieux, leasing, décision crédit / IFRS 9 assistée par IA, veille réglementaire BCT/CTAF, analytics et reporting.

> Voir [`AUDIT-PRODUIT-UX.md`](./AUDIT-PRODUIT-UX.md) pour l'audit produit, le benchmark concurrentiel et la roadmap.

## Stack

- **Frontend :** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui, React Router, TanStack Query, Recharts, Framer Motion
- **Backend :** Supabase (PostgreSQL + Auth + Realtime + Edge Functions Deno)
- **IA :** extraction documentaire (leasing, dossiers, contentieux) et moteurs d'analyse crédit / IFRS 9 via Supabase Edge Functions

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner les clés Supabase
npm run dev            # http://localhost:5173
```

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Serveur de développement                 |
| `npm run build`     | Build de production                      |
| `npm run lint`      | ESLint                                   |
| `npm run test`      | Tests unitaires (Vitest)                 |
| `npm run seed:demo` | Injecte un jeu de démonstration (dossiers) |

## Structure

```
src/
  pages/            # 1 route = 1 page (chargées en lazy dans App.tsx)
  components/
    dashboard/      # Layout + sidebar applicative
    landing/        # Landing page publique
    dossiers|leasing|litigation|relance/  # Modales & widgets métier
    ui/             # Design system shadcn/ui (ne pas modifier à la main)
  contexts/         # Auth (Supabase)
  integrations/     # Client + types Supabase générés
  lib/              # scoring, relance, mocks de démo, générateurs PDF
supabase/
  functions/        # credit-decision, ifrs9-engine, extract-*
  migrations/       # Schéma SQL versionné
```

## Conventions

- Les écrans affichant des données simulées **doivent** inclure `<DemoBanner />` (`src/components/DemoBanner.tsx`).
- `sky` / `gold` sont des alias legacy vers le rouge corporate : ne pas les utiliser pour une sémantique info/alerte (préférer `blue-*` / `amber-*` explicites).
- Toute PR est vérifiée par la CI (lint + tests + build).

## Déploiement

Build statique (`dist/`) : `npm run build`, puis servir via n'importe quel hébergeur statique. Renseigner les 3 variables `VITE_SUPABASE_*` côté hébergeur.
