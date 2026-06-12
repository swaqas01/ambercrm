// Vercel serverless function: securely proxies AI requests to Anthropic.
// The API key is read from an environment variable and NEVER reaches the browser.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel env vars" });
  try {
    const { system, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "messages required" });
    // basic input cap so a stray client can't send huge payloads
    const total = JSON.stringify(messages).length + String(system || "").length;
    if (total > 60000) return res.status(413).json({ error: "request too large" });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5", // low-cost model: ideal for CRM search & summaries
        max_tokens: 700,
        system: String(system || "").slice(0, 30000),
        messages: messages.slice(-12),
      }),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
