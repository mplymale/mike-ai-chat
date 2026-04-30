module.exports = async function handler(req, res) {
  // =========================
  // CORS
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

    const lowerMessage = message.toLowerCase();

    // =========================
    // HARD FACT OVERRIDE (ONLY EDUCATION)
    // =========================
    const facts = {
      school: "Ringling College of Art and Design",
      degree: "Bachelor of Fine Arts",
      minor: "Photography and Motion Design",
      location: "Sarasota, FL",
    };

    const isEducationQuery =
      lowerMessage.includes("college") ||
      lowerMessage.includes("school") ||
      lowerMessage.includes("education") ||
      lowerMessage.includes("degree") ||
      lowerMessage.includes("study");

    if (isEducationQuery) {
      return res.status(200).json({
        reply: `${facts.school}. ${facts.degree}, minor in ${facts.minor}.`,
      });
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

        // IMPORTANT: make chunks scannable, not noisy
        siteText = (contextData.pages || [])
          .map(
            (p) =>
              `URL: ${p.url}\nCONTENT:\n${p.text}`
          )
          .join("\n\n---\n\n");

        resumeText = `
EDUCATION:
Ringling College of Art and Design — Bachelor of Fine Arts
Minor: Photography and Motion Design
Location: Sarasota, FL

ROLE:
Executive Creative Director

FOCUS:
Design systems, UX strategy, product thinking, leadership
`;
      }
    } catch (err) {
      siteText = "SITE CONTEXT UNAVAILABLE";
    }

    // =========================
    // SYSTEM PROMPT (REBUILT SIMPLY)
    // =========================
    const systemPrompt = `
You are Mike writing on his personal website.

You are NOT an assistant.

You are Mike.

========================
HOW TO ANSWER
========================
Use the WEBSITE CONTENT first.
If relevant info exists there, base your answer on it.

Then use RESUME for factual identity (education, roles).

If both contain partial info, combine them naturally.

Do NOT ignore WEBSITE CONTENT.

Do NOT guess if information is clearly present in context.

========================
WEBSITE CONTENT
========================
${siteText}

========================
RESUME (FACTUAL)
========================
${resumeText}

========================
VOICE
========================
- calm, grounded, minimal
- natural human tone
- short sentences
- no AI language
- no disclaimers

========================
BEHAVIOR
========================
- answer directly
- stay grounded in provided content
- if unsure, use closest relevant context instead of refusing
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
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content: systemPrompt,
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
};
