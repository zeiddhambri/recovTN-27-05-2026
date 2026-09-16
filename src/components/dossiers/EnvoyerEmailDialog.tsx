import { useEffect, useState } from 'react';
import { Mail, Send, Loader2, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EMAIL_TEMPLATES, toHtmlEmail, type TemplateVars } from '@/lib/email-templates';
import { sendDossierEmail, ChannelError } from '@/lib/messaging';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  vars: TemplateVars;
  defaultTo: string;
  /** When the typed address differs from the stored one, offer to save it. */
  storedEmail: string | null;
  onSent: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EnvoyerEmailDialog({ open, onOpenChange, dossierId, vars, defaultTo, storedEmail, onSent }: Props) {
  const [to, setTo] = useState(defaultTo);
  const [templateId, setTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saveContact, setSaveContact] = useState(true);
  const [sending, setSending] = useState(false);
  const [channelMissing, setChannelMissing] = useState(false);

  // (Re)fill from template when opened or template changes.
  useEffect(() => {
    if (!open) return;
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? EMAIL_TEMPLATES[0];
    setTo(defaultTo);
    setSubject(tpl.subject(vars));
    setBody(tpl.body(vars));
    setChannelMissing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  const valid = EMAIL_RE.test(to.trim()) && subject.trim().length > 0 && body.trim().length > 0;
  const emailChanged = storedEmail !== to.trim();

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    try {
      await sendDossierEmail({
        dossierId,
        to: to.trim(),
        subject: subject.trim(),
        html: toHtmlEmail(body),
        text: body,
      });
      if (saveContact && emailChanged) {
        const { error } = await supabase.from('dossiers').update({ debtor_email: to.trim() }).eq('id', dossierId);
        if (error) toast({ title: 'Email envoyé, contact non enregistré', description: error.message, variant: 'destructive' });
      }
      toast({ title: 'Email envoyé', description: `Relance envoyée à ${to.trim()}.` });
      onOpenChange(false);
      onSent();
    } catch (err) {
      if (err instanceof ChannelError && err.code === 'CANAL_NON_CONFIGURE') {
        setChannelMissing(true);
        return;
      }
      toast({ title: "Échec de l'envoi", description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} aria-hidden /> Envoyer une relance email
          </DialogTitle>
          <DialogDescription>
            {vars.debiteur} · {vars.code} · {vars.montant}
          </DialogDescription>
        </DialogHeader>

        {channelMissing ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-sm">
            <p className="font-bold text-amber-800 flex items-center gap-2 mb-2">
              <Settings2 size={16} aria-hidden /> Canal email non configuré
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-amber-800">
              <li>Créez un compte Resend et vérifiez votre domaine d’envoi.</li>
              <li>
                Dans Supabase → Edge Functions → Secrets, définissez <code className="font-mono text-xs bg-white px-1 rounded">RESEND_API_KEY</code> et{' '}
                <code className="font-mono text-xs bg-white px-1 rounded">EMAIL_FROM</code> (ex. <code className="font-mono text-xs">Recouvrement &lt;relances@votre-banque.tn&gt;</code>).
              </li>
              <li>Déclarez le webhook Resend vers la fonction <code className="font-mono text-xs bg-white px-1 rounded">email-webhook</code> pour le suivi d’ouverture (voir <code className="font-mono text-xs bg-white px-1 rounded">docs/CANAUX-EMAIL.md</code>).</li>
            </ol>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="email-to" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Destinataire
                </label>
                <input
                  id="email-to"
                  type="email"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="debiteur@exemple.tn"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
                />
                {emailChanged && to.trim() && (
                  <label className="flex items-center gap-2 mt-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveContact}
                      onChange={(e) => setSaveContact(e.target.checked)}
                      className="accent-[hsl(var(--crimson))]"
                    />
                    Enregistrer comme email du débiteur
                  </label>
                )}
              </div>
              <div>
                <label htmlFor="email-template" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Modèle
                </label>
                <select
                  id="email-template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
                >
                  {EMAIL_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {EMAIL_TEMPLATES.find((t) => t.id === templateId)?.description}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="email-subject" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Objet
              </label>
              <input
                id="email-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky"
              />
            </div>

            <div>
              <label htmlFor="email-body" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Message
              </label>
              <textarea
                id="email-body"
                required
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl bg-mist border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={!valid || sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
              {sending ? 'Envoi en cours…' : 'Envoyer la relance'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
