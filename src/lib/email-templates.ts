// French dunning email templates. Variables are resolved client-side
// from the dossier, then HTML-escaped before sending.

export interface TemplateVars {
  debiteur: string;
  code: string;
  montant: string;
  echeance: string;
}

export interface EmailTemplate {
  id: string;
  label: string;
  description: string;
  subject: (v: TemplateVars) => string;
  body: (v: TemplateVars) => string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain-text body -> minimal branded HTML email. */
export function toHtmlEmail(body: string): string {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">
${paragraphs}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
<p style="font-size:12px;color:#6b7280;margin:0;">Message envoyé dans le cadre du suivi de votre dossier. Pour toute question, répondez directement à cet email.</p>
</body></html>`;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'rappel_echeance',
    label: 'Rappel avant échéance',
    description: 'Ton courtois, avant la date limite.',
    subject: (v) => `Rappel — échéance ${v.montant} (${v.code})`,
    body: (v) => `Bonjour ${v.debiteur},

Nous vous rappelons que l'échéance de ${v.montant} relative au dossier ${v.code} arrive le ${v.echeance}.

Si le règlement est déjà effectué, veuillez ne pas tenir compte de ce message. Dans le cas contraire, nous vous remercions de procéder au paiement avant cette date afin d'éviter tout frais supplémentaire.

Cordialement,
L'équipe Recouvrement`,
  },
  {
    id: 'relance_j1',
    label: 'Relance J+1',
    description: 'Premier rappel après dépassement.',
    subject: (v) => `Relance — paiement en retard de ${v.montant} (${v.code})`,
    body: (v) => `Bonjour ${v.debiteur},

Sauf erreur de notre part, le montant de ${v.montant} (dossier ${v.code}, échéance ${v.echeance}) nous semble toujours impayé à ce jour.

Nous vous invitons à régulariser votre situation dans les plus brefs délais. Si vous rencontrez une difficulté, contactez-nous afin d'étudier ensemble un échéancier adapté.

Cordialement,
L'équipe Recouvrement`,
  },
  {
    id: 'mise_en_demeure_douce',
    label: 'Mise en demeure amiable',
    description: 'Ton ferme, avant transfert contentieux.',
    subject: (v) => `Mise en demeure — dossier ${v.code} (${v.montant})`,
    body: (v) => `Bonjour ${v.debiteur},

Malgré nos précédentes relances, le montant de ${v.montant} (dossier ${v.code}) demeure impayé.

Par ce message valant mise en demeure amiable, nous vous demandons de procéder au règlement sous 8 jours. Passé ce délai, votre dossier sera transmis à notre service contentieux, avec application des pénalités et frais de recouvrement prévus contractuellement.

Pour éviter cette escalade, contactez-nous dès réception de ce message.

Cordialement,
L'équipe Recouvrement`,
  },
];
