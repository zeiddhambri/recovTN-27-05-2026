# Audit Produit & UX — RecovTN
### Plateforme SaaS de pilotage du recouvrement (banques & IMF tunisiennes)
**Date :** 16 septembre 2026 · **Périmètre :** landing page + application (13 routes protégées) · **Méthode :** revue de code complète + benchmark marché

> **État d'avancement (16/09/2026) :**
> - **P0 implémenté, vérifié et poussé** (commit `4281403`).
> - **P1-1 « Ma journée » + P1-2 fiche dossier 360° + P1-3 promesses suivies implémentés** : routes `/aujourdhui` et `/dossiers/:id`, notes et promesses persistées (tables `dossier_notes`, `payment_promises` + RLS), recommandation next-best-action transparente, page d'accueil post-login = file priorisée.
> - Restent : P1-4 canaux réels, P1-5 recherche globale, P1-6 onboarding, puis P2.

---

## 1. Résumé exécutif

**RecovTN** est une plateforme de gestion du recouvrement de créances : dossiers, relances multicanal, scoring de risque, suivi contentieux, leasing, moteur de décision crédit / IFRS 9 (IA), veille réglementaire BCT/CTAF, analytics et reporting.

**Verdict en une phrase :** le produit a une **couverture fonctionnelle impressionnante pour son stade** et une **vraie différenciation locale** (BCT/CTAF, IFRS 9, leasing tunisien, extraction IA de documents), mais il souffre du syndrome classique du MVP : **données simulées partout, parcours débiteur inexistant, et frictions UX qui empêchent la conversion démo → client payant**.

| Axe | Note | Commentaire |
|---|---|---|
| Couverture fonctionnelle | ★★★★☆ | 8 modules réels, edge functions IA, génération PDF |
| Design visuel | ★★★★☆ | Landing soignée ; dashboard moderne mais en rupture de style |
| UX / utilisabilité | ★★☆☆☆ | Liens morts, non responsive, pas d'états vides, mocks omniprésents |
| Performance & qualité tech | ★★☆☆☆ | Pas de code-splitting, pas de CI, 1 seul test, build non vérifié |
| Accessibilité | ★★☆☆☆ | `lang="en"`, contrastes limites, navigation clavier partielle |
| Adéquation marché (vs leaders) | ★★☆☆☆ | Manque le standard n°1 : **portail débiteur self-service + paiement** |

**Les 3 chantiers qui changent tout :**
1. **Portail débiteur self-service** (lien magique → voir sa dette → payer / échéancier) — c'est ce qui fait vendre Upflow, TrueAccord et Chaser.
2. **Sortir du « tout-mocké »** : brancher les données réelles (Supabase existe déjà) + bandeau « démo » explicite + seed de démonstration.
3. **File de travail agent** (« Ma journée » priorisée) au lieu de 11 menus plats et de tableaux passifs.

---

## 2. Ce qui a été audité

| Zone | Fichiers / routes |
|---|---|
| Landing | `LandingPage`, `Navbar`, `Hero`, `Problem`, `Features`, `Pricing`, `Footer` |
| Auth | `Auth.tsx`, `AuthContext`, `ProtectedRoute` |
| App | `/dashboard`, `/dossiers`, `/relances`, `/relances/decision-credit`, `/litigation`, `/litigation/:id`, `/leasing`, `/leasing/new`, `/leasing/import`, `/leasing/:id`, `/regulatory`, `/regulatory/ifrs9-engine`, `/scoring`, `/reporting`, `/analytics`, `/settings` |
| Backend | 5 edge functions Supabase (`ifrs9-engine`, `credit-decision`, `extract-leasing`, `extract-dossier`, `extract-contentieux`), 7 migrations |
| Libs | `scoring.ts`, `relance.ts`, `mock-data.ts`, `leasing-mock.ts`, `litigation-mock.ts`, `analytics-mock.ts`, PDF generators |

---

## 3. Forces actuelles — ce qui crée de la valeur

### 3.1 Couverture métier rare à ce stade de maturité
- **Cycle complet de la créance** : amiable → relances → promesse → contentieux → clôture, avec 6 statuts normalisés et niveaux de gestion (recouvreur / directeur / comité).
- **Module contentieux le plus abouti** (`LitigationDetail.tsx`, ~670 lignes) : timeline, documents, audiences, financier, notes + génération PDF de modèles d'actes côté client. C'est un vrai différenciateur.
- **Module leasing complet** : portefeuille, échéanciers, impayés, alertes critiques, import multi-formats (Excel/CSV/PDF) avec **extraction IA** via edge function.
- **Moteurs IA déjà branchés** : `ifrs9-engine` (analyse crédit 5 piliers, buckets, SPPI, ASRC, forward-looking) et `credit-decision`, avec garde-fous anti-discrimination explicites dans les prompts — bon réflexe conformité.
- **Veille BCT/CTAF + reporting régulateur** : positionnement « conformité tunisienne » que les acteurs globaux (Upflow, Kolleno) ne couvrent pas.

### 3.2 Stack technique saine
- React 18 + TypeScript + Vite + Tailwind + **shadcn/ui** (design system cohérent et accessible par défaut via Radix).
- **Supabase** : auth, temps réel (`postgres_changes` sur les dossiers), edge functions Deno. Le socle scale.
- Validation **zod** côté auth, erreurs d'auth mappées en messages clairs, `ProtectedRoute` avec redirection `from`.
- `cmdk`, `recharts`, `framer-motion`, `react-query` déjà installés : les briques des futures features sont là.

### 3.3 Landing page crédible
- Direction artistique assumée (serif éditorial + crimson, inspirée Atradius), hero avec preuve visuelle, grille de 6 modules, section démo avec formulaire. Le discours « pensé pour les banques et IMF tunisiennes » est clair et différenciant.

---

## 4. Faiblesses — frictions, manques, risques

### 4.1 🔴 Bloquant démo/vente : l'application est largement simulée
C'est le problème n°1. Un prospect qui clique s'en rend compte en 5 minutes :

| Page | Constat |
|---|---|
| `Dashboard` | KPI, dossiers récents, audiences **codés en dur**, dates **2024** (périmées) |
| `Reporting` | 100 % de données statiques ; boutons « Export PDF » / « Rapport BCT » **sans action** |
| `Scoring` | Calculé uniquement sur `mockDossiers` |
| `Analytics` | Alimentée par `analytics-mock.ts` ; le bouton « Analyse IA » est un **`setTimeout` de 1,5 s** qui affiche un texte pré-écrit |
| `Settings` | Utilisateurs mockés ; le changement de rôle affiche un faux message de succès **sans rien persister** |
| `RegulatoryWatch` | 4 circulaires de 2023-2024 en dur, checklist non persistée |
| `Dossiers` | Seule page branchée à Supabase… mais **mélange dossiers réels + mocks** sans distinction |

> **Risque :** moment « c'est du faux » en démo = confiance détruite. Pire : un utilisateur qui croit que le changement de rôle a fonctionné (faux succès) est un bug de sécurité fonctionnelle.

### 4.2 🔴 Navigation et liens cassés
- **`Dashboard` → lien « Voir l'agenda » pointe vers `/legal`, route qui n'existe pas** → page 404. C'est le premier écran après connexion.
- **Sidebar : 11 entrées plates, sans regroupement**, sans recherche, avec « Accueil » (= landing publique) mélangé aux modules métier. Coût cognitif élevé dès l'arrivée.
- **Hiérarchie incohérente** : le moteur IFRS 9 est caché sous `/regulatory/ifrs9-engine`, la décision crédit sous `/relances/decision-credit` — deux pépites IA enterrées à 2 niveaux sans entrée visible dans la sidebar.
- **Landing déconnectée du produit** : la navbar annonce « Services, Conseils & pratiques, Publications, À propos » (vocabulaire d'assureur-crédit, copié d'Atradius) alors que le produit vend des modules SaaS ; l'ancre `#about` n'existe pas ; les onglets du hero ne sont pas cliquables ; le formulaire de démo fait `preventDefault()` (ne part nulle part) ; le bouton recherche et le sélecteur « FR » sont inertes.

### 4.3 🔴 Non responsive : le dashboard est inutilisable sur mobile
- `AppSidebar` : `fixed w-64` + `main ml-64` **sans breakpoint**. Sur mobile, la sidebar recouvre l'écran sans moyen de la fermer et le contenu est poussé hors-champ.
- Tableaux (`Dossiers`, 9 colonnes) avec scroll horizontal brut, pas de version cartes, pas de colonnes adaptatives.
- Or les agents de recouvrement et huissiers travaillent **sur le terrain** : c'est un cas d'usage mobile par nature (les leaders ont tous une app ou PWA agent).

### 4.4 🟠 Rupture d'identité entre landing et produit
- Landing : serif éditorial, crimson, coins carrés (`rounded-sm`), ton institutionnel.
- App : `font-syne` forcée en serif via `!important`, coins énormes (`rounded-[2.5rem]`), navy/crème, ton startup.
- Symptôme technique révélateur : les tokens `sky` et `gold` sont **aliased vers le rouge crimson** (`--sky: 354 87% 44%`), donc « À relancer » (bleu attendu) et « À surveiller » (ambre attendu) s'affichent… en rouge. La sémantique couleur du scoring est cassée : un client « à surveiller » ressemble à un client « à risque ». À corriger en restaurant une palette sémantique (vert / ambre / rouge).

### 4.5 🟠 UX : tableaux passifs, pas de parcours d'action
- Page `Dossiers` : le bouton `⋮` (MoreVertical) **n'ouvre aucun menu**. Aucune action possible depuis la liste (relancer, assigner, promettre, transférer). Aucun tri, aucune pagination, aucune action de masse.
- Pas d'**états vides** (« Aucun dossier » → page blanche de tableau), pas d'états d'erreur réseau, pas de squelettes de chargement (le composant `skeleton` existe mais n'est pas utilisé).
- Pas de **recherche globale** (pourtant `cmdk` est installé), pas de notifications, pas de fil d'activité, pas de rappels d'échéances.
- Page IFRS 9 : **~30 champs sur un seul formulaire**, sans sections repliables, sans sauvegarde brouillon, sans assistant pas-à-pas. Abandon quasi garanti.
- Pas d'**onboarding** : un nouvel utilisateur arrive sur un dashboard à zéros/dates 2024 sans checklist, sans visite guidée, sans données d'exemple seedées.

### 4.6 🟠 Fonctionnalités manquantes vs standard du marché
Mapping face aux leaders (détail §6) :

| Capacité standard | RecovTN | Leaders |
|---|---|---|
| Portail débiteur self-service 24/7 | ❌ | TrueAccord, Upflow, Chaser, Quadient |
| Paiement en ligne / échéancier self-service | ❌ | Tous (cartes, prélèvement, plans) |
| Envoi réel email/SMS/WhatsApp | ❌ (scénarios simulés) | Kolleno, Receeve, Ameyo |
| Promesse de paiement suivie (rappels, rupture) | ❌ (statut seul) | Upflow, HighRadius |
| File de travail agent priorisée (worklist) | ❌ | HighRadius, Billtrust, Gaviti |
| Gestion des contestations (disputes) | ❌ | Kolleno, Billtrust |
| Historique unifié + inbox partagée | ❌ | Upflow, HighRadius |
| Intégrations comptables/ERP | ❌ | Tous (1-clic : QuickBooks, Xero, Sage, NetSuite) |
| A/B testing des messages | ❌ | Receeve, Symend |
| Audit trail réglementaire réel | ❌ | Katabat, TrueAccord |
| Rôles & permissions effectifs | ❌ (badge « Admin » hardcodé, RLS à vérifier) | Tous |

### 4.7 🟡 Accessibilité & SEO
- `index.html` : `lang="en"` (contenu en français), `<title>Lovable App</title>`, meta description « Lovable Generated Project », image OG vers lovable.dev. **Zéro SEO, zéro partage social propre.**
- Contrastes limites (`text-white/40`, `text-white/60` sur navy), focus clavier peu visible (supprimé par endroits via `focus:outline-none` sans alternative), tableaux sans `scope`, pas de skip-link, formulaires avec labels parfois absents (inputs du formulaire démo sans `<label>`).
- Aucun `aria-live` pour les toasts/validations ; la modale de démo et les dialogs héritent de Radix (bien), mais le reste est artisanal.

### 4.8 🟡 Performance, qualité, sécurité
- **Pas de code-splitting** : `App.tsx` importe les 16 pages en statique → bundle unique incluant `recharts`, `framer-motion`, `@react-pdf`, `xlsx`, `pdfjs-dist`. Temps de chargement initial pénalisé, surtout sur mobile (marché TN).
- Animations `framer-motion` sur **chaque ligne de tableau** (`delay: i * 0.04`) → jank dès ~50 lignes ; pas de virtualisation ni pagination.
- Fonts Google chargées en `@import` CSS (bloquant) ; images hero/cartes non optimisées (pas de `loading="lazy"`, pas de srcset — hero 1920px chargée aussi sur mobile).
- **1 seul test** (`example.test.ts`), pas de CI, `node_modules` absent du snapshot (build non vérifié — et `vite` manquant à l'install = à date le build n'a jamais été validé proprement).
- `.env` **commité dans le repo** (clés Supabase `publishable` — faible risque car publiques par design, mais mauvaise pratique : passer par `.env.example` + secrets d'environnement).
- `24` usages de `any`, types Supabase générés mais contournés (`Record<string, string | number>`, `Analysis = any`) → le typage ne protège plus les flux critiques (IFRS 9, leasing).
- Migrations RLS/policies : à auditer ligne par ligne avant toute mise en production avec des données débiteurs réelles (PII + secret bancaire).

---

## 5. Évaluation de la cohérence

| Dimension | Verdict | Détail |
|---|---|---|
| Design system | 🟠 Moyen | shadcn bien utilisé, mais 2 langages visuels (landing institutionnelle vs app arrondie) + sémantique couleur cassée (sky/gold → rouge) |
| Navigation | 🔴 Faible | 11 items plats, pépites IA enterrées, lien mort `/legal`, ancres landing incohérentes |
| Flux utilisateur | 🔴 Faible | Pas de parcours « arriver → comprendre → agir » : tableaux passifs, CTA sans action, formulaire 30 champs |
| Ton & contenu | 🟠 Moyen | Landing claire, mais vocabulaire Atradius plaqué (« Publications ») et dates 2024 partout = impression d'abandon |
| Tech | 🟢 Bon socle, 🟠 finition | Stack moderne, mais pas de tests/CI/splitting, mocks en prod |

---

## 6. Benchmark — comment les meilleurs résolvent chaque problème

### Les 5 références retenues

| # | Application | Positionnement | Pourquoi elle est une référence |
|---|---|---|---|
| 1 | **Upflow** (FR, leader PME/ETI) | Automatisation du recouvrement B2B | UX la plus aboutie du marché, workflows visuels, portail client, 4,6/5 sur 400+ avis [1](https://www.capterra.com/p/193097/Upflow/) |
| 2 | **Kolleno** (UK, entreprise) | AR automation + IA temps réel | Workflows IA natifs Salesforce/bi-directionnels, dispute management intégré [2](https://www.kolleno.com/the-5-best-debt-collection-software-compatible-with-salesforce/) |
| 3 | **Receeve** (DE, institutions financières) | Orchestration no-code des parcours | Stratégies par segment modifiables sans code, **A/B testing** des messages, adaptation multi-pays [3](https://thecfoclub.com/tools/best-ai-debt-collection-software/) |
| 4 | **TrueAccord** (US, grand volume) | Recouvrement digital-first | **98 % des dettes résolues sans interaction humaine** via portail self-service + moteur ML de personnalisation (canal, moment, contenu) [4](https://skywork.ai/skypage/en/TrueAccord-Deep-Dive-The-Future-of-AI-Powered-Debt-Collection/1972857508676169728) |
| 5 | **HighRadius** (US, enterprise) | Order-to-cash autonome | Priorisation prédictive des comptes, dunning multilingue conforme par pays, cash-application auto [5](https://www.highradius.com/resources/Blog/debt-collection-management-software/) |

Mentions : **Chaser** (relances « qui semblent manuscrites » + portail de paiement, −75 % de DSO revendiqué [6](https://www.chaserhq.com/blog/debt-collection-software)), **Symend** (segmentation comportementale capacité × volonté de payer, +10-15 % de recouvrement [7](https://www.symend.com/blog/debt-collection-software-complete-guide)), **Billtrust/Quadient** (portails + lettrage auto).

### 6.1 Ce que les leaders font différemment, par domaine

**① Le débiteur paie seul, à 23h, sans appeler (TrueAccord, Upflow, Chaser)**
Chaque relance contient un **lien sécurisé vers un portail** : voir sa dette, payer en 1 clic, choisir un échéancier, contester. TrueAccord : 98 % de résolutions sans humain. RecovTN envoie des relances… vers rien : aucun lien, aucun portail, aucun paiement. C'est le plus grand écart fonctionnel.

**② Chaque message mène à une résolution, pas à une impasse (Tratta, Quadient)**
Standard du dunning 2026 : notice digitale → portail/paiement → rappel → SMS → plan de paiement → revue agent **uniquement si le débiteur s'engage sans conclure** [8](https://www.tratta.io/blog/dunning-process-automation-debt-collection). RecovTN a les scénarios (déclencheurs J-5/J+1, multicanal) mais pas les canaux réels ni les pages de destination.

**③ L'agent travaille une file priorisée, pas un tableau (HighRadius, Billtrust, Gaviti)**
Les leaders génèrent une **worklist quotidienne** : « voici vos 20 comptes du jour, triés par espérance de recouvrement », avec next-best-action. RecovTN affiche un tableau trié par date, sans tri ni action. Conséquence : les agents traitent dans l'ordre alphabétique au lieu de l'ordre rentable.

**④ Segmentation comportementale, pas seulement ancienneté (Symend, FICO, Prodigal)**
Le marché segmente sur **capacité × volonté de payer** (modèles de propension), pas sur des seuils fixes. RecovTN : 5 critères à seuils codés en dur (`montant >= 500000 → 85`), non calibrés, non explicables au-delà d'un tooltip. Le score existe mais ne pilote rien (ni la file, ni les scénarios — à peine les relances).

**⑤ Conformité codée dans le moteur (Katabat, TrueAccord)**
Fréquences de contact, horaires, consentements canal, audit trail : **règles exécutées par le système**, pas des documents lus par les agents. RecovTN a la veille BCT/CTAF en affichage, mais aucune règle de conformité exécutée (pas de contrôle « déjà relancé 2× cette semaine », pas de journal d'audit).

**⑥ Intégration 1-clic au système source (tous)**
Upflow/Kolleno/Chaser se branchent en 1 clic à la compta (QuickBooks, Xero, **Sage**, NetSuite). Sans connecteur, RecovTN impose la double saisie → frein d'adoption n°1 en banque/IMF (core banking + Sage très présents en Tunisie).

**⑦ Analytics d'outcomes, pas de volumes (Tratta, Symend)**
Les leaders mesurent **taux de self-cure, coût par euro recouvré, promesses tenues vs rompues, forecast de trésorerie** — pas « e-mails envoyés ». RecovTN mesure des volumes mockés.

**⑧ Onboarding qui mène au premier euro recouvré (Chaser, Upflow)**
Checklist guidée, templates prêts, import assisté, « time-to-first-collected » < 1 semaine. RecovTN : aucune première expérience guidée.

### 6.2 Patterns de design à emprunter (concrets)

| Pattern | Vu chez | Application à RecovTN |
|---|---|---|
| Portail débiteur par lien magique | TrueAccord, Upflow, Chaser | Nouvelle route publique `/p/:token` : dette, payer, échéancier, contester |
| Builder de scénarios visuel + A/B test | Receeve, Gaviti | Remplacer la liste de scénarios par un canvas étapes avec variantes A/B |
| Worklist « Ma journée » | HighRadius, Billtrust | Nouvel écran d'accueil agent : 20 dossiers priorisés + action recommandée + boutons 1-clic |
| Fiche 360° avec timeline unifiée | Upflow, HighRadius | Fusionner relances + paiements + promesses + notes + documents en un seul fil |
| Inbox partagée des réponses | Upflow, Lunos | Réponses email/SMS rattachées au dossier, détection auto promesse/contestation |
| Dispute tracker | Kolleno, Billtrust | Statut « contesté » + workflow de résolution avec SLA |
| Promesse suivie + alerte rupture | HighRadius | PTP = objet daté avec rappels auto J-1/J+1 et ré-escalade |
| Score explicable | FICO, Prodigal | « Pourquoi ce score ? » : contributions par facteur + historique |
| Conformité exécutée | Katabat | Garde-fous dans le moteur : plafonds de contact, quiet hours, journal d'audit |
| Connecteurs 1-clic | Upflow, Chaser | Sage + CSV mappé + API/webhooks documentés |

---

## 7. Plan d'amélioration — recommandations priorisées

Légende : 🔴 P0 = 1-2 semaines (avant toute démo commerciale) · 🟠 P1 = mois 1-2 (valeur) · 🟡 P2 = trimestre (différenciation). Effort : S < 3 j · M 1-2 sem · L 3-6 sem.

### 🔴 P0 — Crédibilité immédiate (ne rien vendre avant ça)

**P0-1. Réparer ou masquer tout ce qui est cassé/faux** (S)
- **Ce qui change :** `/legal` → créer la route Agenda (réutiliser les audiences du module contentieux) ou retirer le lien ; boutons « Export PDF / Rapport BCT » : brancher sur les générateurs PDF existants (`litigation-pdf`, nouveau `reporting-pdf`) ou les remplacer par « Bientôt disponible » désactivé avec tooltip ; menu `⋮` des dossiers : implémenter (Voir / Relancer / Assigner / Promesse / Transférer) avec les modales existantes ; formulaire démo landing : brancher à Supabase (`demo_requests`) + email de notification, avec état de succès.
- **Pourquoi :** chaque CTA mort en démo coûte un deal (pattern inverse du standard « every message leads to resolution »).

**P0-2. Séparer le réel du simulé + seeder une démo honnête** (S)
- **Ce qui change :** bandeau persistant « Données de démonstration » quand la source est mockée ; `Dossiers` : onglets « Mes dossiers (réels) / Exemples » au lieu du mélange silencieux ; script `seed:demo` qui insère 25 dossiers + relances + 1 promesse + 1 contestation datés **cette semaine** (fini les dates 2024) ; `Settings` : brancher les rôles à Supabase ou retirer la persistance illusoire (message « nécessite le plan Entreprise » plutôt qu'un faux succès).
- **Pourquoi :** Upflow/Chaser démo sur données réalistes et datées du jour ; l'honnêteté du seed inspire confiance.

**P0-3. Responsive minimum viable** (M)
- **Ce qui change :** sidebar → drawer mobile (le composant `sheet` shadcn existe déjà) + topbar avec burger sous `lg:` ; tableaux → bascule liste/cartes sur mobile ; hero landing : `srcset`/image réduite + `loading="lazy"` sur les visuels non critiques.
- **Pourquoi :** agents et huissiers sur le terrain ; Google indexe mobile-first.

**P0-4. SEO & accessibilité de base** (S)
- **Ce qui change :** `lang="fr"`, `<title>RecovTN — Pilotage du recouvrement…</title>`, meta description, OG image produit ; restaurer palette sémantique (sky=bleu, gold=ambre, red=rouge) ; labels sur tous les inputs ; focus visibles ; contrastes ≥ 4.5:1 (corriger `white/40`).
- **Pourquoi :** invisible sur Google aujourd'hui ; conformité AA = prérequis appels d'offres bancaires.

**P0-5. Hygiène tech minimale** (S)
- **Ce qui change :** `React.lazy` + `Suspense` sur les 16 routes (gain immédiat : recharts/pdf/xlsx hors du bundle initial) ; CI GitHub (install → lint → test → build) ; `.env.example` + retrait de `.env` du dépôt ; passer les `any` critiques (IFRS 9, leasing) en types Supabase générés.
- **Pourquoi :** le build n'est actuellement pas vérifié ; chaque PR sans CI risque une régression en démo.

### 🟠 P1 — Devenir un outil que les agents ouvrent chaque matin (mois 1-2)

**P1-1. « Ma journée » : file de travail priorisée** (M) — *inspiré HighRadius/Billtrust*
- **Ce qui change :** nouvel écran d'accueil post-login : « Bonjour Leïla, 18 dossiers, 3 urgences, 142 kTND recouvrables cette semaine ». Chaque carte = débiteur, montant, jours de retard, **action recommandée** (« Appeler — a ouvert l'email 2× », « Relancer promesse rompue »), boutons 1-clic (Appeler / SMS / Promesse / Reporter). Tri par `score × montant × récence`, filtres agent/segment. Remplace le dashboard passif comme page par défaut.
- **Pourquoi :** c'est l'écran qui fait adopter (ou pas) par les agents ; traite par rentabilité, pas par date.

**P1-2. Fiche dossier 360° avec timeline unifiée** (M) — *inspiré Upflow/HighRadius*
- **Ce qui change :** route `/dossiers/:id` (aujourd'hui inexistante — seul le contentieux a une fiche) : en-tête (dette, score explicable, segment), **fil unique** (relances envoyées/ouvertes, paiements, promesses, appels, notes, documents), panneau d'action contextuel (« prochaine étape du scénario : SMS J+3 — [Envoyer maintenant] [Modifier] [Passer] »), onglets secondaires (Échéancier / Documents / Conformité).
- **Pourquoi :** fin des allers-retours entre 5 pages ; l'agent agit depuis un seul endroit.

**P1-3. Promesses de paiement suivies** (S/M) — *inspiré HighRadius/Upflow*
- **Ce qui change :** la promesse devient un objet (montant, date, canal) avec rappels auto J-1/J+1, statut (tenue/partielle/rompue), et **ré-escalade automatique** si rompue (retour en file prioritaire + passage au scénario Intensif). KPI « promesses tenues » au dashboard.
- **Pourquoi :** une promesse non suivie = 0 € ; les leaders trackent le taux de tenue comme KPI central.

**P1-4. Canaux réels : email puis SMS/WhatsApp** (M/L) — *inspiré Kolleno/Receeve*
- **Ce qui change :** brancher d'abord l'**email transactionnel** (Resend/Postmark : suivi ouverture/clic, templates MJML, domaine dédié), puis SMS via agrégateur (Twilio ou acteur TN : EverySend/Orange API), WhatsApp via BSP officiel (360dialog/Twilio). Chaque envoi loggé dans la timeline ; gestion des désinscriptions ; **quiet hours** + plafonds (ex. max 3 touches/semaine/dossier) codés dans le moteur (pattern Katabat).
- **Pourquoi :** sans envoi réel, le « moteur de relance » reste une maquette ; c'est le cœur de la valeur.

**P1-5. Recherche globale Cmd+K + notifications** (S) — *brique `cmdk` déjà installée*
- **Ce qui change :** `⌘K` : dossiers, débiteurs, actions (« Nouvelle promesse… », « Aller au scoring »), navigation. Cloche notifications : promesse due aujourd'hui, audience J-7, import terminé, PTP rompue. Centre de notifications avec marquage lu.
- **Pourquoi :** standard SaaS 2026 ; réduit le coût des 11 menus plats.

**P1-6. Onboarding « premier euro recouvré »** (M) — *inspiré Chaser/Upflow*
- **Ce qui change :** checklist en 5 étapes (connecter/importer → vérifier 3 dossiers → activer 1 scénario → envoyer 1 relance test → inviter 1 agent), visite guidée, templates de scénarios prêts (Standard/Intensif/Amiable pré-remplis avec textes FR), import CSV mappé avec prévisualisation (réutiliser `LeasingImport` comme patron UX).
- **Pourquoi :** time-to-value < 1 semaine = critère de choix n°1 des directions financières.

### 🟡 P2 — Différenciation : là où RecovTN peut dépasser les globaux (trimestre)

**P2-1. Portail débiteur self-service `/p/:token`** (L) — *inspiré TrueAccord (98 % sans humain)*
- **Ce qui change :** route publique sécurisée par token signé à usage unique : solde détaillé, **payer en ligne** (intégrer un PSP opérant en Tunisie : CMI/Monetique Tunisie, e-Dinar, virement avec référence auto), **échéancier self-service** (3/6/10× selon règles), **contester** (formulaire → dispute tracker), reçu PDF. Chaque relance contient ce lien. Version FR/AR.
- **Pourquoi :** c'est LE pattern qui a disrupté le marché ; aucun acteur tunisien ne l'offre bien → fenêtre d'opportunité.

**P2-2. Scoring v2 explicable et calibré** (M) — *inspiré FICO/Prodigal*
- **Ce qui change :** panneau « Pourquoi ce score ? » (contribution de chaque facteur, évolution 90 j) ; calibration des seuils sur historique réel (backtest : « les dossiers ≥ 70 représentent x % des pertes ») ; ajout propension à payer (récence d'engagement : ouvertures, visites portail) ; le score pilote la file P1-1 et les scénarios.
- **Pourquoi :** un score non expliqué n'est pas utilisé ; un score calibré devient un actif de pricing.

**P2-3. Disputes + inbox partagée** (M) — *inspiré Kolleno/Upflow/Lunos*
- **Ce qui change :** statut « Contesté » suspendant les relances, workflow de résolution avec SLA et responsables, réponses email/SMS rattachées au dossier, **détection auto** (promesse vs contestation vs accusé) via l'IA existante.
- **Pourquoi :** les contestations traitées vite se recouvrent 2× mieux (benchmark Symend sur la réactivité).

**P2-4. Scénarios v2 : builder visuel + A/B test** (L) — *inspiré Receeve*
- **Ce qui change :** canvas no-code (étapes, délais, conditions score/segment, embranchements « a ouvert / a payé / silence »), variantes A/B par étape avec gagnant auto (taux de paiement, pas taux d'ouverture), bibliothèque de templates FR/AR pré-approuvés juridiquement.
- **Pourquoi :** +10-15 % de recouvrement via l'optimisation continue (données Symend).

**P2-5. Intégrations : Sage + API publique** (L) — *standard Upflow/Kolleno/Chaser*
- **Ce qui change :** connecteur Sage (compta dominante FR/TN) + import incrémental core banking (SFTP/API), **API REST + webhooks documentés** (`dossier.created`, `paiement.reçu`, `promesse.rompue`), page statut et logs d'intégration.
- **Pourquoi :** sans connecteur, double saisie = non-adoption en banque ; l'API ouvre le channel partenaires (éditeurs core banking, cabinets).

**P2-6. Analytics d'outcomes + forecast** (M) — *inspiré Tratta/HighRadius/Tes
...[truncated 2504 chars]