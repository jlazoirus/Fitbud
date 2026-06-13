// Proxy serverless para la API de Anthropic (Vercel).
// La API key vive SOLO aquí (variable de entorno ANTHROPIC_API_KEY en Vercel).
// Nunca se envía al navegador ni se guarda en GitHub.
const ALLOWED_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el servidor (Vercel → Environment Variables)." });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const userText = body.userText;
    if (!userText) {
      res.status(400).json({ error: "Falta 'userText'." });
      return;
    }
    const model = ALLOWED_MODELS.includes(body.model)
      ? body.model
      : (ALLOWED_MODELS.includes(process.env.ANTHROPIC_MODEL) ? process.env.ANTHROPIC_MODEL : DEFAULT_MODEL);
    const maxTokens = Math.min(Math.max(parseInt(body.maxTokens, 10) || 512, 1), 2048);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: typeof body.system === "string" ? body.system : "",
        messages: [{ role: "user", content: String(userText) }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: (data && data.error && data.error.message) || ("Error " + r.status) });
      return;
    }
    const text = (data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
