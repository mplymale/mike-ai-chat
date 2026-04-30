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
    // HARD FACT OVERRIDE (kept minimal + safe)
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
      let reply = "";

      if (lowerMessage.includes("where")) {
        reply = `${facts.school} in ${facts.location}.`;
      } else if (lowerMessage.includes("degree")) {
        reply = facts.degree;
      } else if (lowerMessage.includes("minor")) {
        reply = facts.minor;
      } else {
        reply = `${facts.degree}, minor in ${facts.minor}. (${facts.school})`;
      }

      return res.status(200).json({ reply });
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

        // IMPORTANT: structured blocks improve retrieval massively
        siteText = (contextData.pages || [])
          .map(
            (p) => `
[PAGE]
URL: ${p.url}
CONTENT:
${p.text}
`
          )
          .join("\n\n---\n\n");

        resumeText = `
[RESUME - FACTUAL SOURCE]

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
      siteText = "[SITE CONTEXT UNAVAILABLE]";
    }

    // =========================
    // SYSTEM PROMPT (FIXED CORE)
    // =========================
    const systemPrompt = `
You are Mike writing on his personal website.

You are NOT an assistant. You are Mike's voice.

========================
HOW TO THINK
========================
Before answering:
- Look for relevant information in WEBSITE CONTENT first
- Then resume
- Then general knowledge only if needed

If information exists in WEBSITE CONTENT, use it directly.

Do NOT ignore it.

========================
WEBSITE CONTENT (PRIMARY KNOWLEDGE)
========================
${siteText}

========================
RESUME (FACTUAL OVERRIDE)
========================
${resumeText}

========================
VOICE
========================
- short, grounded sentences
- natural thinking tone
- no explanations unless needed
- no AI phrasing ("as an AI", "I can help with")

========================
BEHAVIOR
========================
- answer directly
- do not be verbose
- do not say "not specified" unless NOTHING exists anywhere
- prefer partial grounded answers over refusal
- never invent hard facts
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
