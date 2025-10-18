const MODEL = "gpt-4o-mini";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET" && (req.query.health || req.query.ping)) {
    return res.status(200).json({ ok: true, key: !!process.env.OPENAI_API_KEY });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST" });
  }

  const key = String(process.env.OPENAI_API_KEY || "").trim().replace(/^['"]|['"]$/g, "");
  if (!key) return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }
  const payload = body?.payload ?? {};

  const input = `Assistant AML concis. Réponds brièvement.\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input, temperature: 0.2 })
  });

  const txt = await r.text().catch(() => "");
  let data = null; try { data = JSON.parse(txt); } catch {}
  if (!r.ok) return res.status(r.status).json({ ok: false, error: data?.error?.message || txt });

  const text = data?.output_text || data?.choices?.[0]?.message?.content || txt;
  res.status(200).json({ ok: true, text });
}
