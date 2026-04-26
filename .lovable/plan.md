## Module Leasing — Plan d'implémentation (Frontend mock)

Aligné sur les patterns existants du module Litigation (mêmes conventions UI, mêmes helpers, mock store en mémoire). **Aucune intégration backend** — données seedées dans `src/lib/leasing-mock.ts`.

---

### 📦 1. Data layer & mock — `src/lib/leasing-mock.ts`

Définition des types TS et seed de **12 contrats** réalistes (TND, débiteurs tunisiens) couvrant tous les statuts.

**Types principaux :**
- `LeasingStatus` : `active | late | recovery | early_termination | litigation | closed_paid | written_off | asset_recovered`
- `AssetType` : `vehicle | equipment | real_estate | it_hardware | industrial | other` (mapping icône Lucide : `Car / Factory / Building2 / Monitor / Settings / Package`)
- `LeasingContract` : id, lessee (réutilise format debtor de litigation-mock), lessor, dates (start/end/firstDueDate), asset (type, brand, model, serial, value, description), financials (monthlyRent, interestRate, deposit, terminationFormula, remainingCapital), guarantor, insurance (provider, policy, expiryDate), riskScore (0-100), agent
- `LeasingInstallment` : id, dueDate, amount (principal+interest+fees), status (`pending | paid | partial | late`), paidAmount, paidDate, daysLate
- `LeasingAction` : id, date, type (`call|sms|email|whatsapp|letter|visit`), channel, outcome, agent, notes
- `LeasingTermination` : id, requestDate, reason, indemnityAmount (formule de calcul appliquée), assetReturn (status, date, condition), guarantorActivated
- `LeasingDocument` : réutilise pattern de `CaseDocument` + templates leasing
- `LeasingNotification` : type alerte (`overdue_d1|overdue_d8|overdue_d30|overdue_d60|insurance_expiry|maturity_warning|broken_promise`), severity, contractId

**Helpers exportés :**
- `STATUS_CONFIG` (label/color/bg/ring par statut — palette teal/amber/orange/red/green/gray/purple)
- `ASSET_TYPE_CONFIG` (icône + label)
- `findLeasingContract(id)`, `totalOverdue(c)`, `nextInstallment(c)`, `recoveryRate(c)`, `daysOverdue(c)`
- `generatePaymentSchedule(...)` pour le wizard (calcul amortissement linéaire)
- `LEASING_AGENTS` (réutilise les noms d'agents existants pour cohérence)

**Seed :** 12 contrats répartis : 4 actifs sains, 2 en retard léger (<30j), 2 en recouvrement (>60j), 1 résiliation en cours, 2 contentieux (avec leasingCaseId pointant vers un dossier litigation), 1 soldé. Chaque contrat avec 12-36 échéances générées, 3-8 actions, 2-4 documents, 1-3 notifications.

---

### 🧭 2. Navigation & routing

**`src/App.tsx`** — Ajouter 7 routes sous `DashboardLayout` :
```
/leasing                       → Leasing (overview)
/leasing/new                   → LeasingNew (wizard)
/leasing/:id                   → LeasingDetail (avec tabs internes)
```
Les sous-routes (`/installments`, `/actions`, `/termination`, `/litigation`, `/documents`) seront gérées **via param `?tab=`** dans `LeasingDetail` plutôt que par routing nested — plus simple et cohérent avec le pattern Litigation. Si vous préférez des vraies routes nested, dites-le, on ajustera.

**`src/components/dashboard/AppSidebar.tsx`** — Insérer entre "Module Contentieux" (`/litigation`) et "Veille Réglementaire" (`/regulatory`) :
```tsx
{ name: 'Leasing', icon: Package, path: '/leasing' }
```
Couleur d'accent **teal (#0D9488)** appliquée via une variante locale (badge, état actif) — l'accent teal sera visible sur les badges status et le hover, l'item sidebar gardant le bleu sky du système pour ne pas casser l'identité visuelle (à confirmer si vous voulez surcharger).

---

### 📊 3. Page `/leasing` — `src/pages/Leasing.tsx`

**Header** : titre "Portefeuille Leasing" + sous-titre + CTA `Nouveau Contrat` (Link vers `/leasing/new`).

**5 KPI Cards** (grid responsive) :
1. **Contrats Actifs** — count + breakdown par AssetType (mini-stack horizontal)
2. **Encours Total** — somme `remainingCapital` + mini-trend SVG sparkline
3. **Loyers en Retard** — nombre d'échéances `late` + montant + badge rouge animé si retard >60j
4. **Taux de Recouvrement** — `RadialBarChart` Recharts (gauge 0-100%)
5. **Résiliations en Cours** — count + total indemnités

**Layout 2 colonnes (lg:grid-cols-3) :**

**Colonne gauche (lg:col-span-2)** — table de contrats :
- Filtres (search, status pills, asset type select, agent select, date range, sort) + bouton Export CSV
- Table : Contrat | Bien (icône+modèle) | Statut (badge) | Capital Restant | Loyer | Prochain Loyer | Retard (j) | Score Risque (mini bar) | Agent | Actions (dropdown)
- Row actions : Voir détail / Nouvelle action / Générer doc / Initier résiliation / Passer en contentieux

**Colonne droite** — 3 widgets :
- **Échéances à venir 30j** — liste compacte (date, contrat, montant)
- **Répartition par type d'actif** — `PieChart` donut Recharts
- **Alertes prioritaires** — liste des notifications `severity: critical` avec icône pulsante

---

### 🪄 4. Page `/leasing/new` — `src/pages/LeasingNew.tsx`

Wizard 5 étapes avec stepper visuel en haut, state local `useState`, validation par étape, persistance finale dans le store mock (push dans `leasingContracts`).

**Step 1 — Preneur & Contrat** : Sélecteur débiteur (combobox sur seed existant), n° contrat (auto-généré `LEAS-2024-XXXX`), bailleur (select), dates (start/end/first-due), fréquence paiement (mensuel/trimestriel)

**Step 2 — Bien financé** : Type (cards cliquables avec icône Lucide), description, marque/modèle/n° série, valeur d'acquisition

**Step 3 — Conditions financières** : Loyer mensuel, taux d'intérêt, dépôt de garantie, formule de résiliation (radio : capital restant / capital + 3 loyers / forfait), **preview de l'amortissement** (mini-table 6 premiers loyers + total)

**Step 4 — Garanties & Assurance** : Garant (nom, type, montant), assurance (compagnie, n° police, date d'expiration), zone d'upload (mock — affiche juste les fichiers en local state)

**Step 5 — Récapitulatif** : Résumé full + table échéancier complet généré + bouton `Créer le contrat` qui push dans le store et redirige vers `/leasing/:id`

---

### 🗂️ 5. Page `/leasing/:id` — `src/pages/LeasingDetail.tsx`

**Sticky Header** : N° contrat + nom preneur + badge statut + score risque (gauge mini) + KPIs clés (capital restant, loyer mensuel, prochain due, jours retard).

**Action buttons** (sticky right) : Relancer · Nouveau acte · Générer doc · Résilier · Contentieux · Modifier.

**6 onglets** (state local `activeTab`) :

#### Onglet 1 — Vue d'Ensemble
Grid 2 colonnes : Infos contrat / Détails du bien / Conditions financières / Garanties & assurance / Mini-charts (amortissement + paiements vs prévu) / Résumé retards.

#### Onglet 2 — Échéancier
Table des installments (Date · Loyer · Principal · Intérêts · Statut · Date paiement · Montant payé · Solde restant).
Modal d'enregistrement de paiement (mark as paid, partial), bulk actions (sélection multiple), footer avec totaux.

#### Onglet 3 — Actions de Recouvrement
Timeline verticale (réutilise le pattern Litigation) + modal "Nouvelle action" (canal, date, résultat, notes) + mini-chart efficacité par canal (BarChart horizontal).

#### Onglet 4 — Résiliation Anticipée
Workflow visuel (4 étapes : Demande → Calcul indemnité → Restitution bien → Activation garant). Calcul automatique de l'indemnité selon `terminationFormula`. Tracking restitution du bien (statut, date, état). Bouton "Activer garant" (mock).

#### Onglet 5 — Contentieux
Si `litigationCaseId` existe → afficher card avec lien vers `/litigation/:id`. Sinon → bouton "Créer dossier contentieux" qui crée un `LitigationCase` mock pré-rempli depuis le contrat et redirige.

#### Onglet 6 — Documents
Grid de documents (réutilise le pattern Litigation Documents tab) + modal de génération PDF avec templates leasing : `Mise en demeure leasing`, `Lettre de résiliation`, `PV de restitution`. Drop zone d'upload (visuel uniquement). Génération PDF via `@react-pdf/renderer` (déjà installé) — extension de `src/lib/litigation-pdf.tsx` ou nouveau `src/lib/leasing-pdf.tsx`.

---

### 📈 6. Intégration Analytics — `src/pages/Analytics.tsx`

Ajouter un onglet **"Leasing"** dans la barre du haut (à côté de l'existant) :
- KPIs : taux recouvrement leasing, ratio retard, ancienneté moyenne, capital restant, taux résiliation anticipée
- Charts : Retard par type d'actif (BarChart) · Courbe amortissement portefeuille (Area) · Matrice de risque (heatmap risque×ancienneté) · Funnel recouvrement leasing · Calendrier maturités (timeline horizontale)

Données alimentées depuis `leasing-mock.ts` via helpers dédiés ajoutés dans `src/lib/analytics-mock.ts` (ou nouveau `leasing-analytics.ts`).

---

### 🔔 7. Alertes & intégrations transverses

**Notifications leasing** (mock — affichées dans les widgets concernés ; pas de centre de notification global existant détecté, donc on ajoute une **DropdownMenu cloche** dans le `DashboardLayout` header avec filtre catégorie "🏷️ Leasing"). Si vous préférez ne pas créer de centre de notif maintenant, on se limite aux widgets dans la page `/leasing`.

**Module Litigation** (`src/pages/Litigation.tsx`) :
- Ajouter colonne / badge **"LEASING"** sur les cases qui ont un `sourceLeasingId`
- Permettre filtre "Origine : Leasing"

**Dashboard principal** (`src/pages/Dashboard.tsx`) :
- Nouvelle card mini-KPI "Leasing" (contrats actifs + encours)
- Section "Dossiers leasing urgents" (top 3 retards >60j)
- Alertes assurance qui expirent (<30j)

**Module Dossiers / Débiteur** : ajouter onglet "Contrats Leasing" listant les contrats du débiteur sélectionné. (À confirmer — `Dossiers.tsx` n'a pas été audité ; possible petit refactor nécessaire si pas de page detail debtor.)

---

### 🎨 8. Design system (cohérence)

- **Accent teal** `#0D9488` ajouté en variable CSS (`--teal: 174 84% 32%`) dans `src/index.css` + classe utilitaire `text-teal / bg-teal`
- **STATUS_CONFIG** mappe chaque statut sur (Tailwind class) :
  - active → teal · late → amber · recovery → orange · litigation → red · closed_paid → green · written_off → gray · asset_recovered → purple
- **Icônes** : Lucide uniquement (Car, Factory, Building2, Monitor, Settings, Package)
- **Micro-interactions** :
  - Compteurs de retard animés (framer-motion `animate` sur changement)
  - Gauge de risque animée (Recharts RadialBar avec animation prop)
  - Confetti à l'enregistrement d'un paiement (lib `canvas-confetti` à ajouter — léger, ~1Ko gz)
  - Progress bars fluides (framer-motion `animate width`)
  - Pulse CSS sur alertes critiques
- **Responsive** : grilles `lg:grid-cols-3 md:grid-cols-2` ; tablette → colonnes empilées ; mobile → cartes verticales (table de contrats devient liste de cards). Onglets de la fiche contrat passent en select sur mobile.

---

### 📁 Fichiers créés / modifiés (récap)

**Créés :**
- `src/lib/leasing-mock.ts`
- `src/lib/leasing-pdf.tsx`
- `src/pages/Leasing.tsx`
- `src/pages/LeasingNew.tsx`
- `src/pages/LeasingDetail.tsx`
- (optionnel) `src/lib/leasing-analytics.ts`

**Modifiés :**
- `src/App.tsx` — 3 routes
- `src/components/dashboard/AppSidebar.tsx` — entrée Leasing
- `src/components/dashboard/DashboardLayout.tsx` — bell de notifications (si validé)
- `src/pages/Analytics.tsx` — onglet Leasing
- `src/pages/Litigation.tsx` — badge LEASING + filtre origine
- `src/pages/Dashboard.tsx` — mini-KPI leasing + section urgents
- `src/index.css` — variable `--teal`
- `package.json` — ajout `canvas-confetti` (optionnel)

---

### ⚠️ Points à confirmer avant implémentation

1. **Routing** : sous-onglets `/leasing/:id/installments` etc. en **vraies routes nested** ou en **tabs internes** (?tab=installments) ? — Plan actuel : tabs internes (plus simple, cohérent avec Litigation).
2. **Centre de notifications global** : on l'ajoute dans le layout (cloche header) ou on se limite aux widgets dans la page Leasing ?
3. **Onglet "Contrats Leasing" dans Dossiers** : confirmer si on l'inclut dans cette itération ou on le reporte (dépend de l'état actuel de `Dossiers.tsx`).
4. **Confetti** : OK pour ajouter `canvas-confetti` (~3Ko) ou on s'en tient à une animation framer-motion ?

Sinon, implémentation directe dès approbation.