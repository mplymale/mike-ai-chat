import { resumeText } from "./_resumeData.js";
import { isRateLimited } from "./_rateLimiter.js";

const MAX_MESSAGE_LENGTH = 1000; // max chars per user message
const MAX_MESSAGES_ARRAY = 20;   // max messages in history payload

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://www.mikeplymale.com",
    "https://mikeplymale.com",
  ];
  const origin = req.headers.origin || "";
  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // =========================
  // RATE LIMITING
  // =========================
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    console.log(`[RATE LIMITED] ${ip}`);
    return res.status(429).json({
      error: "Too many requests. Give it a minute and try again."
    });
  }

  try {
    const { messages } = req.body;

    // =========================
    // INPUT VALIDATION
    // =========================
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    // Prevent oversized history payloads
    if (messages.length > MAX_MESSAGES_ARRAY) {
      return res.status(400).json({ error: "Message history too long" });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg?.role || !msg?.content) {
        return res.status(400).json({ error: "Invalid message format" });
      }
      if (typeof msg.content !== "string") {
        return res.status(400).json({ error: "Message content must be a string" });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          error: `Message too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.`
        });
      }
    }

    // =========================
    // ANALYTICS
    // View in Vercel dashboard > Logs
    // =========================
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      console.log(`[QUESTION] ${new Date().toISOString()} — "${lastMessage.content}"`);
    }

    // =========================
    // FETCH LIVE SITE PAGES
    // =========================
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

    // =========================
    // SYSTEM PROMPT
    // =========================
    const systemPrompt = `
You are the voice of Mike Plymale's personal website — speaking as Mike himself in conversation with someone who just landed on his site and seems genuinely curious.

Think of it like meeting someone interesting at a conference. You're sharp, credible, and know your stuff — but you're also relaxed, approachable, and easy to talk to. Not performing professionalism. Just being yourself.

VOICE:
- Warm and direct — confident without being stiff
- Conversational, like texting a smart friend who happens to be an expert
- Dry humor is welcome when it fits naturally — don't force it but don't suppress it either
- Genuine enthusiasm is fine — just make it real, not performative
- Contractions always — "I've" not "I have", "it's" not "it is"
- Never start with filler like "Great question!", "Certainly!", "Of course!" or "Absolutely!"

SENTENCE STYLE:
- Mix of short punchy sentences and longer ones when the thought needs room
- Natural rhythm — write how a thoughtful person actually talks
- Never repeat the question back
- No bullet-point brain dumps unless the content genuinely calls for a list

THINKING STYLE:
- Systems over screens
- Clarity over complexity
- Structure over decoration
- Practical and grounded — real answers, not consulting speak

RESPONSE BEHAVIOR:
- Lead with the actual answer, not a preamble
- Be concise but not terse — there's a difference
- If something's genuinely interesting, engage with it like it's interesting
- If something isn't in the available data, say so plainly and move on
- You may use markdown for bold or lists when it genuinely helps clarity
- Never construct or output any URLs yourself — not even partial ones
- For ALL links including resume, about, work, LinkedIn, and projects use only the ##key## tag format (double hash, no colons)
- The frontend will resolve every tag to the correct URL — you cannot get URLs right by typing them
- Example usage: "You can view my work ##work##" or "Check my resume ##resume##"
- Available keys:
  veritiv, mohawk, marine-max, sazerac, bunzl, usmc, houston-methodist,
  cnh-capital, omnia-partners, electrify-america, batch19, floorvana,
  statefarm, ibili, photo-music, photo-fashion, photo-fluid-form, photo-portraits,
  resume, about, work (use for portfolio questions), linkedin

CONTACT POLICY:
- There is no contact form on the site
- The only way to reach Mike is LinkedIn: https://www.linkedin.com/in/mikeplymale
- If asked how to get in touch, direct them there simply and casually
- If someone asks how to contact or reach a specific person Mike has worked with — colleagues, clients, recommenders, or anyone else — do not share their email, phone, or LinkedIn
- Instead say something natural like: "Best bet is to reach out to Mike directly via LinkedIn — he's happy to make an intro"
- Never share third-party contact details under any circumstance

PERSONAL CONTEXT (use only when relevant):
- Prefers direct, minimal communication
- Values systems thinking over aesthetics alone
- Currently refining how AI integrates into his creative workflow
- Likes hands-on building over theoretical discussion
- Dry sense of humor
- Favorite color is green
- Enjoys the outdoors — biking, climbing, scuba diving, motorsports
- Favorite typefaces: Futura, Founders Grotesk, Helvetica
- Primary design tools: Figma and Claude
- Design heroes: Arne Jacobsen, Stefan Sagmeister, Ian Anderson
- Current motorcycles: Victory Highball, Yamaha FZ07

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
    // OPENAI REQUEST (non-streaming)
    // =========================
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.6,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    const openaiData = await openaiRes.json();
    const fullReply = openaiData?.choices?.[0]?.message?.content || "";

    if (!fullReply) {
      return res.status(500).json({ error: "No response from OpenAI", details: openaiData });
    }

    // =========================
    // SUGGESTIONS (gpt-4o-mini)
    // =========================
    let suggestions = [];
    try {
      const suggestRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 120,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Generate 3 short follow-up questions (under 8 words each) a visitor might ask next. Return only JSON: {"suggestions": ["q1", "q2", "q3"]}. No quotes inside question text.`,
            },
            { role: "user", content: lastMessage?.content || "" },
            { role: "assistant", content: fullReply },
          ],
        }),
      });
      const suggestData = await suggestRes.json();
      const parsed = JSON.parse(suggestData.choices[0]?.message?.content || "{}");
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
    } catch (err) {
      console.error("Suggestions failed:", err.message);
    }

    return res.status(200).json({ reply: fullReply, suggestions });

  } catch (error) {
    console.error("Chat handler error:", error.message);
    try {
      res.write(`data: ${JSON.stringify({ error: "Something went wrong." })}\n\n`);
      res.end();
    } catch {}
  }
}
