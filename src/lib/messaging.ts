import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EnvoiRow = Database['public']['Tables']['relance_envois']['Row'];

export interface Envoi {
  id: string;
  dossier_id: string | null;
  canal: string;
  destinataire: string;
  sujet: string | null;
  statut: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

export const ENVOI_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  queued: { label: 'En file', cls: 'text-gray-600 bg-gray-100' },
  sent: { label: 'Envoyé', cls: 'text-blue-600 bg-blue-50' },
  delivered: { label: 'Distribué', cls: 'text-teal-700 bg-teal-50' },
  delayed: { label: 'Retardé', cls: 'text-amber-700 bg-amber-50' },
  opened: { label: 'Ouvert', cls: 'text-green-700 bg-green-50' },
  clicked: { label: 'Cliqué', cls: 'text-green-700 bg-green-50' },
  bounced: { label: 'Rejeté', cls: 'text-red-600 bg-red-50' },
  complained: { label: 'Signalé spam', cls: 'text-red-600 bg-red-50' },
  failed: { label: 'Échec', cls: 'text-red-600 bg-red-50' },
};

export function envoiStatus(statut: string): { label: string; cls: string } {
  return ENVOI_STATUS_CONFIG[statut] ?? { label: statut, cls: 'text-gray-600 bg-gray-100' };
}

function rowToEnvoi(r: EnvoiRow): Envoi {
  return {
    id: r.id,
    dossier_id: r.dossier_id,
    canal: r.canal,
    destinataire: r.destinataire,
    sujet: r.sujet,
    statut: r.statut,
    provider_id: r.provider_id,
    error: r.error,
    created_at: r.created_at,
    opened_at: r.opened_at,
    clicked_at: r.clicked_at,
  };
}

export class ChannelError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function parseFunctionsError(error: unknown, fallback: string): Promise<never> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = (await ctx.clone().json()) as { error?: string; message?: string };
      if (body?.error) throw new ChannelError(body.error, body.message || fallback);
    } catch (e) {
      if (e instanceof ChannelError) throw e;
    }
  }
  const message = error instanceof Error ? error.message : fallback;
  throw new ChannelError('APPEL_FONCTION', message);
}

export interface SendEmailInput {
  dossierId: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
  scenarioId?: string;
  etapeId?: string;
}

export async function sendDossierEmail(input: SendEmailInput): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      dossier_id: input.dossierId,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      scenario_id: input.scenarioId,
      etape_id: input.etapeId,
    },
  });
  if (error) return parseFunctionsError(error, "Échec de l'envoi.");
  return data as { id: string };
}

export async function fetchEnvois(dossierId: string): Promise<Envoi[]> {
  const { data, error } = await supabase
    .from('relance_envois')
    .select('*')
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEnvoi);
}
