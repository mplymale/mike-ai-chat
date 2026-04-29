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
    // 🔥 HARD FACT OVERRIDE (FIXED + SMARTER)
    // =========================
    const lowerMessage = message.toLowerCase();

    const facts = {
      school: "Ringling College of Art and Design",
      degree: "Bachelor of Fine Arts",
      minor: "Photography and Motion Design",
      location: "Sarasota, FL",
    };

    if (
      lowerMessage.includes("college") ||
      lowerMessage.includes("school") ||
      lowerMessage.includes("education") ||
      lowerMessage.includes("degree")
    ) {
      let reply = "";

      if (lowerMessage.includes("where")) {
        reply = `${facts.school} in ${facts.location}.`;
      } 
      else if (lowerMessage.includes("degree")) {
        reply = `${facts.degree}.`;
      } 
      else if (lowerMessage.includes("minor")) {
        reply = `${facts.minor}.`;
      } 
      else if (
        lowerMessage.includes("study") ||
        lowerMessage.includes("what did")
      ) {
        reply = `${facts.degree}, with a minor in ${facts.minor}.`;
      } 
      else {
        // natural fallback (not robotic)
        reply = `Ringling College of Art and Design. BFA, minor in Photography and Motion Design.`;
      }

      return res.status(200).json({ reply });
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

        resumeText = `
EDUCATION:
Ringling College of Art and Design — Bachelor of Fine Arts
Minor in Photography and Motion Design
Sarasota, FL

ROLE:
Executive Creative Director

FOCUS:
Design systems, UX strategy, product thinking, leadership
`;
      }
    } catch (err) {
      siteText = "Context fetch failed.";
    }

    // =========================
    // VOICE
    // =========================
    const siteContext = `
You are Mike’s voice.

Write like you're thinking, not presenting.

- short, clear sentences
- no filler
- no over-explaining
- answer first, expand only if needed
`;

    // =========================
    // OPENAI REQUEST
    // =========================
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content:
                siteContext +
                "\n\nRESUME:\n" +
                resumeText +
                "\n\nWEBSITE:\n" +
                siteText,
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
