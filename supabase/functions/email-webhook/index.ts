import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Resend event type -> relance_envois statut
const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Svix verification: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`. */
async function verifySvix(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(ts)) > 300) return false; // 5 min freshness

  const keyB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const key = await crypto.subtle.importKey("raw", b64ToBytes(keyB64), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${rawBody}`));
  const expected = `v1,${bytesToB64(new Uint8Array(mac))}`;
  return sigHeader.split(" ").includes(expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const secret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    if (!secret) return json({ error: "WEBHOOK_NON_CONFIGURE" }, 503);

    const rawBody = await req.text();
    if (!(await verifySvix(req, rawBody, secret))) {
      console.warn("email-webhook: invalid signature");
      return json({ error: "SIGNATURE_INVALIDE" }, 401);
    }

    const event = JSON.parse(rawBody) as { type?: string; data?: { email_id?: string } };
    const statut = event.type ? STATUS_MAP[event.type] : undefined;
    const providerId = event.data?.email_id;
    if (!statut || !providerId) return json({ ok: true, ignored: true });

    // Service-role client: webhooks carry no user JWT.
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const patch: Record<string, string> = { statut };
    if (statut === "opened") patch.opened_at = new Date().toISOString();
    if (statut === "clicked") patch.clicked_at = new Date().toISOString();
    const { error } = await sb.from("relance_envois").update(patch).eq("provider_id", providerId);
    if (error) console.error("email-webhook update failed", error.message);

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
