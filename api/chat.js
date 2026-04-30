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
    // LINKS (EDIT THESE)
    // =========================
    const links = {
      linkedin: "https://www.linkedin.com/in/mikeplymale/",
      projects: "https://www.mikeplymale.com/work"
    };

    // =========================
    // HARD FACT OVERRIDE (education only)
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
      lowerMessage.includes("degree");

    if (isEducationQuery) {
      return res.status(200).json({
        reply: `${facts.school}. ${facts.degree}, minor in ${facts.minor}.`
      });
    }

    // =========================
    // PROJECT DETECTION
    // =========================
    const isProjectQuery =
      lowerMessage.includes("project") ||
      lowerMessage.includes("work") ||
      lowerMessage.includes("case study") ||
      lowerMessage.includes("portfolio");

    if (isProjectQuery) {
      return res.status(200).json({
        reply: `I’ve worked across product design systems and UX strategy projects focused on scalable interfaces and long-term product architecture.

You can explore the work here: ${links.projects}`
      });
    }

    // =========================
    // EXPERIENCE / BACKGROUND
    // =========================
    const isExperienceQuery =
      lowerMessage.includes("experience") ||
      lowerMessage.includes("background") ||
      lowerMessage.includes("career") ||
      lowerMessage.includes("resume");

    if (isExperienceQuery) {
      return res.status(200).json({
        reply: `I work as an Executive Creative Director focused on design systems, UX strategy, and product thinking across cross-functional teams.

More detail here: ${links.linkedin}`
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

        siteText = (contextData.pages || [])
          .map((p) => `URL: ${p.url}\nCONTENT:\n${p.text}`)
          .join("\n\n---\n\n");

        resumeText = `
EDUCATION:
Ringling College of Art and Design — Bachelor of Fine Arts
Minor: Photography and Motion Design

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
    // SYSTEM PROMPT
    // =========================
    const systemPrompt = `
You are Mike writing on his personal website.

Style:
- calm, minimal, direct
- short sentences
- human tone
- no AI framing

Use provided context. Do not invent facts.
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
                systemPrompt +
                "\n\nWEBSITE:\n" +
                siteText +
                "\n\nRESUME:\n" +
                resumeText,
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
