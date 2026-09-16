import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM = `Tu es un analyste senior en recouvrement de créances pour une banque tunisienne.
Tu reçois des indicateurs agrégés du portefeuille (taux de recouvrement, DSO, performance agents, efficacité des canaux, pyramide des âges).
Produis une synthèse exécutive en FRANÇAIS, concise et actionnable :

- Commence par "Synthèse IA du portefeuille" (sans emoji).
- 4 à 6 puces maximum, chacune avec un chiffre précis issu des données fournies.
- Termine par UNE recommandation opérationnelle chiffrée (réallocation d'effort, escalade, canal).
- N'invente JAMAIS de chiffres absents des données. Si une donnée manque, dis-le explicitement.
- Ton neutre et professionnel, montants en TND.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { summary } = await req.json();
    if (!summary) {
      return new Response(JSON.stringify({ error: "summary requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquante");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Indicateurs du portefeuille (JSON):\n${String(summary).slice(0, 12000)}` },
        ],
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte, réessayez." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ analysis: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
