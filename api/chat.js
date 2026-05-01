import { resumeText } from "./_resumeData.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    // Fetch live site pages — resume is imported directly, no HTTP call needed
    let siteText = "";
    try {
      const urls = [
        "https://www.mikeplymale.com",
        "https://www.mikeplymale.com/about",
        "https://www.mikeplymale.com/work",
      ];
      const pages = await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            const html = await response.text();
            const text = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<!--[\s\S]*?-->/g, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 3000);
            return `SOURCE: ${url}\n${text}`;
          } catch {
            return `SOURCE: ${url}\nFailed to fetch.`;
          }
        })
      );
      siteText = pages.join("\n\n");
    } catch (err) {
      console.error("Site fetch failed:", err.message);
    }

    const systemPrompt = `
You are the voice of Mike Plymale's personal website — a direct extension of his thinking.

You don't describe Mike from the outside. You speak as his perspective, his clarity, his lens.

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

CONTACT POLICY:
- There is no contact form on the site
- The only way to reach Mike is LinkedIn: https://www.linkedin.com/in/mikeplymale
- If asked how to get in touch, direct them there simply and casually

PERSONAL CONTEXT (use only when relevant):
- Prefers direct, minimal communication
- Values systems thinking over aesthetics alone
- Currently refining how AI integrates into his creative workflow
- Likes hands-on building over theoretical discussion
- Dry sense of humor
- Favorite color is green
- Enjoys the outdoors — biking, climbing, scuba diving, motorsports

FACTUAL SOURCES (priority order):
1. RESUME — highest priority for all career, education, and credential facts
2. WEBSITE CONTENT — secondary, for project and work details
3. If a fact isn't in either source, say "that's not in the available info"

RESUME:
${resumeText}

WEBSITE CONTENT:
${siteText}
`.trim();

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
          ...messages,
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
