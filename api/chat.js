export default async function handler(req, res) {
  // =========================
  // CORS (Squarespace safe)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // =========================
    // 🔥 HARD FACT OVERRIDE (NEW)
    // =========================
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("college") ||
      lowerMessage.includes("school") ||
      lowerMessage.includes("education") ||
      lowerMessage.includes("degree")
    ) {
      return res.status(200).json({
        reply: "Ringling College of Art and Design. Bachelor of Fine Arts. Minor in Photography and Motion Design.",
      });
    }

    // =========================
    // SAFE BASE URL
    // =========================
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://mike-ai-chat.vercel.app";

    // =========================
    // FETCH CONTEXT (RAG LAYER)
    // =========================
    let siteText = "";
    let resumeText = "";

    try {
      const contextRes = await fetch(`${baseUrl}/api/context`);

      if (contextRes.ok) {
        const contextData = await contextRes.json();

        siteText = (contextData.pages || [])
          .map((p) => `SOURCE: ${p.url}\nCONTENT: ${p.text}`)
          .join("\n\n");

        // ✅ HARD SET RESUME (SOURCE OF TRUTH)
        resumeText = `
=== IDENTITY FACTS (SOURCE OF TRUTH) ===

EDUCATION:
- School: Ringling College of Art and Design
- Degree: Bachelor of Fine Arts
- Location: Sarasota, FL
- Minor: Photography and Motion Design

ROLE:
- Title: Executive Creative Director
- Focus: Design systems, UX strategy, UX leadership

SKILLS:
- Design systems
- UX strategy
- Product thinking
- Team leadership

RULES:
- Only use these facts for education and career questions
- If something is not listed, say "not specified in available data"
`;
      }
    } catch (err) {
      siteText = "Context fetch failed.";
    }

    // =========================
    // VOICE LAYER
    // =========================
    const siteContext = `
You are Mike’s personal website assistant.

You speak as a direct extension of Mike’s thinking and writing style.

PERSONALITY:
- calm, precise, intentional
- confident without being loud
- minimal and direct
- no performative tone

VOICE RULES:
- write like someone thinking in real time
- prefer short, clean sentences
- no filler transitions
- do not sound like a guide or instructor
- do not repeat the question

RESPONSE BEHAVIOR:
- answer directly first
- expand only if needed
- keep answers tight

IMPORTANT:
You are Mike’s thinking voice on his website.
`;

    // =========================
    // PERSONAL CONTEXT
    // =========================
    const personalContext = `
- prefers clarity over complexity
- systems thinker
- enjoys outdoors, diving, motorsports
`;

    // =========================
    // LINKEDIN CONTEXT
    // =========================
    const linkedinContext = `
- Executive Creative Director
- Design systems leader
- UX strategy
- Cross-functional leadership
`;

    // =========================
    // OPENAI REQUEST
    // =========================
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content:
                siteContext +

                "\n\n=== RESUME (HIGHEST AUTHORITY) ===\n" +
                resumeText +

                "\n\n=== LINKEDIN ===\n" +
                linkedinContext +

                "\n\n=== WEBSITE ===\n" +
                siteText +

                "\n\n=== PERSONAL ===\n" +
                personalContext,
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "No response from OpenAI",
        details: data,
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
