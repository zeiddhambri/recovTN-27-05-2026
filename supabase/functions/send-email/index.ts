import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    // ── Auth: the caller must be signed in ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const sb = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: "NON_AUTHENTIFIE" }, 401);

    // ── Input ──
    const { dossier_id, to, subject, html, text, scenario_id, etape_id } = await req.json();
    if (!to || !EMAIL_RE.test(String(to))) return json({ error: "DESTINATAIRE_INVALIDE" }, 400);
    if (!subject || !html) return json({ error: "CONTENU_REQUIS" }, 400);

    // Dossier must belong to the caller (when linked).
    if (dossier_id) {
      const { data: owns } = await sb.from("dossiers").select("id").eq("id", dossier_id).single();
      if (!owns) return json({ error: "DOSSIER_INACCESSIBLE" }, 403);
    }

    // ── Provider config ──
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM");
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      return json({ error: "CANAL_NON_CONFIGURE", message: "RESEND_API_KEY / EMAIL_FROM manquants. Voir docs/CANAUX-EMAIL.md" }, 503);
    }

    // ── Send via Resend ──
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [String(to)],
        subject: String(subject).slice(0, 200),
        html: String(html).slice(0, 200000),
        text: text ? String(text).slice(0, 100000) : undefined,
        tags: [
          { name: "app", value: "recovtn" },
          ...(dossier_id ? [{ name: "dossier_id", value: String(dossier_id).slice(0, 64) }] : []),
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error", resp.status, errText);
      await sb.from("relance_envois").insert({
        user_id: user.id,
        dossier_id: dossier_id ?? null,
        scenario_id: scenario_id ?? null,
        etape_id: etape_id ?? null,
        canal: "email",
        destinataire: String(to),
        sujet: String(subject).slice(0, 200),
        statut: "failed",
        error: `Resend ${resp.status}: ${errText.slice(0, 500)}`,
      });
      return json({ error: "ENVOI_IMPOSSIBLE", message: "Le fournisseur a refusé l'envoi." }, 502);
    }

    const sent = await resp.json();
    const { data: row, error: insErr } = await sb.from("relance_envois").insert({
      user_id: user.id,
      dossier_id: dossier_id ?? null,
      scenario_id: scenario_id ?? null,
      etape_id: etape_id ?? null,
      canal: "email",
      destinataire: String(to),
      sujet: String(subject).slice(0, 200),
      statut: "sent",
      provider_id: sent.id ?? null,
    }).select("id").single();
    if (insErr) throw new Error(insErr.message);

    return json({ id: row.id, provider_id: sent.id ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
