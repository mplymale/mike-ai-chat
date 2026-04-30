module.exports = async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const lower = message.toLowerCase();

    const links = {
      linkedin: "https://www.linkedin.com/in/mikeplymale",
      work: "https://www.mikeplymale.com/work"
    };

    // =========================
    // HARD FACT (ONLY EDUCATION)
    // =========================
    const isEducation =
      lower.includes("college") ||
      lower.includes("school") ||
      lower.includes("degree") ||
      lower.includes("education");

    if (isEducation) {
      return res.status(200).json({
        reply:
          "Ringling College of Art and Design — Bachelor of Fine Arts, Photography and Motion Design."
      });
    }

    // =========================
    // BASE URL + CONTEXT
    // =========================
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://mike-ai-chat.vercel.app";

    let siteText = "";
    let resumeText = "";

    try {
      const resContext = await fetch(`${baseUrl}/api/context`);
      if (resContext.ok) {
        const data = await resContext.json();

        siteText = (data.pages || [])
          .map(p => `URL: ${p.url}\n${p.text}`)
          .join("\n\n---\n\n");

        resumeText = `
Executive Creative Director
Ringling College of Art and Design
BFA - Photography and Motion Design
`;
      }
    } catch {
      siteText = "";
    }

    // =========================
    // SYSTEM PROMPT (MINIMAL, NOT OVER-CONSTRAINED)
    // =========================
    const systemPrompt = `
You are Mike writing on his personal website.

Write naturally, like a human thinking out loud.
No canned phrasing. No templates. No bullet-point behavior.

Use the website context when relevant.

Keep answers grounded, specific, and human.

WEBSITE:
${siteText}

RESUME:
${resumeText}
`;

    // =========================
    // OPENAI
    // =========================
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await aiRes.json();
    let reply = data?.choices?.[0]?.message?.content || "";

    // =========================
    // LIGHTWEIGHT LINK ENRICHMENT (NO CANNED TEXT)
    // =========================
    if (lower.includes("project") || lower.includes("work") || lower.includes("portfolio")) {
      reply += `\n\nMore work: ${links.work}`;
    }

    if (lower.includes("experience") || lower.includes("career") || lower.includes("background")) {
      reply += `\n\nMore experience: ${links.linkedin}`;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
};
