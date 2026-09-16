# P1-4 — Canal email réel : relances envoyées depuis RecovTN

> Statut : implémenté (code + edge functions + migration). Envois réels actifs dès que
> l'opérateur a appliqué la migration, déployé les fonctions et renseigné les secrets
> (section 1). Sans configuration, l'application reste honnête : le dialogue d'envoi
> affiche « Canal non configuré » au lieu d'échouer silencieusement.

## 1. Mise en route opérateur (~15 min)

1. **Appliquer la migration** (table `relance_envois` + RLS) :
   ```bash
   supabase db push   # inclut supabase/migrations/20260916000002_relance_envois.sql
   ```
2. **Déclarer les secrets** des edge functions :
   ```bash
   supabase secrets set \
     RESEND_API_KEY=re_xxx \
     EMAIL_FROM="Recouvrement <relances@votre-domaine.tn>" \
     EMAIL_WEBHOOK_SECRET=whsec_xxx
   ```
   `RESEND_API_KEY` s'obtient sur [resend.com/api-keys](https://resend.com/api-keys),
   `EMAIL_WEBHOOK_SECRET` dans Resend → Webhooks → Signing secret (préfixe `whsec_`).
   Vérifiez votre domaine d'envoi dans Resend (SPF/DKIM) avant d'envoyer en production ;
   sans domaine vérifié, Resend n'autorise que l'adresse de test du compte.
3. **Déployer les fonctions** :
   ```bash
   supabase functions deploy send-email email-webhook
   ```
4. **Enregistrer le webhook** dans Resend → Webhooks → Add endpoint :
   - URL : `https://<project-ref>.supabase.co/functions/v1/email-webhook`
   - Événements : `email.sent`, `email.delivered`, `email.delivery_delayed`,
     `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, `email.failed`
5. Tester depuis une fiche dossier réelle → **Envoyer un email** → vérifier la ligne
   `sent` puis `delivered` dans la timeline « Activité ».

## 2. Architecture

```
Fiche dossier ── Envoyer un email ─┐
  src/components/dossiers/EnvoyerEmailDialog.tsx
  3 modèles FR (src/lib/email-templates.ts)     │  supabase.functions.invoke('send-email')
                                                ▼
                              supabase/functions/send-email        supabase/functions/email-webhook
                              - auth requise (JWT utilisateur)     - vérifie signature Svix
                              - crée relance_envois (queued)       - met à jour relance_envois
                              - POST api.resend.com/emails           (statut + opened_at…)
                              - statut sent + resend_id              - jamais d'erreur 500 :
                              - 503 CANAL_NON_CONFIGURE si secrets    échec de vérif = 401, OK = 200
                                manquants                            (évite les retries infinis)
                                                │
                                                ▼
                              table relance_envois (RLS : owner = created_by)
                              colonnes : dossier_id, canal, destinataire, sujet, statut,
                              resend_id, tracking_id, opened_at, clicked_at, error…
                                                │
                                                ▼
                              Fiche dossier → timeline « Activité » (src/lib/messaging.ts)
```

## 3. Contrat `send-email`

- Requête : `{ dossier_id, to, sujet, corps, template?, save_contact_email? }`.
- Réponse succès 200 : `{ envoi_id, resend_id, statut: 'sent' }`.
- Erreurs typées (affichées telles quelles dans le dialogue) :
  - `401 NON_AUTHENTIFIE` — session expirée, reconnectez-vous.
  - `403 DOSSIER_INACCESSIBLE` — dossier hors périmètre (RLS) ou inexistant.
  - `503 CANAL_NON_CONFIGURE` — secrets Resend manquants → voir section 1.
  - `422` — email destinataire invalide (`DESTINATAIRE_INVALIDE`).
  - `502 ENVOI_REFUSE` — Resend a rejeté l'envoi (détail dans `detail`, stocké dans
    `relance_envois.error`, statut `failed`).
- Dossiers de démo : le bouton est désactivé sur la fiche (les IDs de démo ne sont
  pas des UUID et ne passeraient pas la RLS).

## 4. Contrat `email-webhook`

- Headers Svix vérifiés : `svix-id`, `svix-timestamp`, `svix-signature` avec
  `EMAIL_WEBHOOK_SECRET` (HMAC-SHA256 sur `id.timestamp.corps-brut`).
- Correspondance : `payload.data.email_id` → `relance_envois.resend_id`.
- Mapping : `email.delivered → delivered`, `email.opened → opened`
  (+ `opened_at`), `email.clicked → clicked` (+ `clicked_at`),
  `email.bounced → bounced`, `email.complained → complained`,
  `email.failed → failed` (+ `error`), `email.delivery_delayed → delayed`.
- Idempotent par construction : chaque événement écrase le statut, pas d'insert.

## 5. Sécurité & conformité

- La clé Resend ne vit que côté serveur (secrets Supabase), jamais exposée au front.
- `send-email` exige un JWT valide et vérifie l'accès RLS au dossier avant d'envoyer.
- Le webhook n'écrit qu'à partir d'événements signés par Resend (Svix).
- Données stockées : destinataire, sujet, statut, timestamps d'ouverture/clic —
  pas de corps de message conservé (le corps transite uniquement vers Resend).
- Pistes P2 : opt-out / liste de désinscription par débiteur, pièces jointes
  (factures PDF), DKIM dédié, conservation configurable.

## 6. Roadmap autres canaux (SMS / WhatsApp)

Non implémentés en P1 — l'architecture est prête (`canal` generic, table unique) :
- **SMS Tunisie** : passer par un agrégateur local (ex. Afilnet, Tunisie Telecom
  Bulk SMS) ou Twilio ; même pattern : `send-sms` + webhook de statut.
- **WhatsApp Business** : via la Cloud API Meta (template validé obligatoire pour
  les notifications) ou un BSP agréé ; même pattern : `send-whatsapp` + webhook.
- Dans les deux cas : ajouter le statut au type `statut_envoi`, réutiliser
  `relance_envois` + la timeline, ajouter un dialogue d'envoi par canal.
