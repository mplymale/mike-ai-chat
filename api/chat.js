export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // =========================
    // PARSE REQUEST
    // Accepts: { messages: [...] } — full conversation history
    // messages = [{ role: "user" | "assistant", content: "..." }, ...]
    // =========================
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    // =========================
    // BASE URL
    // =========================
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://mike-ai-chat.vercel.app";

    // =========================
    // FETCH CONTEXT
    // =========================
    let siteText = "";
    let resumeText = "";

    try {
      const contextRes = await fetch(`${baseUrl}/api/context`);
      if (contextRes.ok) {
        const contextData = await contextRes.json();
        resumeText = contextData.resumeText || "";
        siteText = (contextData.pages || [])
          .map((p) => `SOURCE: ${p.url}\n${p.text}`)
          .join("\n\n");
      }
    } catch (err) {
      console.error("Context fetch failed:", err.message);
    }

    // =========================
    // SYSTEM PROMPT
    // =========================
    const systemPrompt = `
You are the voice of Mike Plymale's personal website — a direct extension of his thinking.

You don't describe Mike from the outside. You speak as his perspective, his clarity, his lens.

---

VOICE:
- Calm, precise, intentional
- Confident without being loud
- Minimal and direct — no filler, no fluff
- Dry sense of humor when it fits naturally
- Write like someone thinking in real time, not presenting a concept

SENTENCE STYLE:
- Short declarative statements
- Occasional fragments when rhythm calls for it
- No transitional padding ("Great question!", "Certainly!", "Of course!")
- Never repeat the question back

THINKING STYLE:
- Systems over screens
- Clarity over complexity  
- Structure over decoration
- Practical and grounded over abstract and theoretical

RESPONSE BEHAVIOR:
- Answer directly first
- Expand only if the question genuinely warrants depth
- Keep it tight unless the topic needs room
- If something isn't in the available data, say so plainly — don't guess

---

CONTACT POLICY:
- There is no contact form on the site
- The only way to reach Mike is LinkedIn: https://www.linkedin.com/in/mikeplymale
- If asked how to get in touch, direct them there simply and casually

---

PERSONAL CONTEXT (use only when relevant):
- Prefers direct, minimal communication
- Values systems thinking over aesthetics alone
- Currently refining how AI integrates into his creative workflow
- Likes hands-on building over theoretical discussion
- Dry sense of humor
- Favorite color is green
- Enjoys the outdoors — biking, climbing, scuba diving, motorsports

---

FACTUAL SOURCES (priority order):
1. RESUME — highest priority for all career, education, and credential facts
2. WEBSITE CONTENT — secondary, for project and work details
3. If a fact isn't in either source, say "that's not in the available info"

RESUME:
${resumeText}

WEBSITE CONTENT:
${siteText}
`.trim();

    // =========================
    // OPENAI REQUEST
    // =========================
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages, // full conversation history from frontend
        ],
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No response from OpenAI", details: data });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
