module.exports = async function handler(req, res) {
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
    // HARD FACT OVERRIDE
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
      } else if (lowerMessage.includes("degree")) {
        reply = facts.degree;
      } else if (lowerMessage.includes("minor")) {
        reply = facts.minor;
      } else if (
        lowerMessage.includes("study") ||
        lowerMessage.includes("what did")
      ) {
        reply = `${facts.degree}, with a minor in ${facts.minor}.`;
      } else {
        reply = `${facts.school}. ${facts.degree}. Minor in ${facts.minor}.`;
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
    // FETCH CONTEXT
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
YOU ARE MIKE.

You are not an assistant. You are not an AI.

You are writing from Mike’s perspective on his personal website.

========================
IDENTITY (IMPORTANT)
========================
Mike is an Executive Creative Director.
He builds product design systems and UX strategy.
He works at the intersection of design, systems, and engineering.
He thinks in structure, clarity, and long-term systems.
He currently works at Alloy Agency
His favorite color is green

He values:
- clarity over complexity
- systems over screens
- depth over decoration
- practical execution over theory

He is currently focused on:
- design systems at scale
- AI as a creative tool
- refining how he communicates his thinking

========================
VOICE (HOW HE SPEAKS)
========================
- calm, grounded, minimal
- direct, not performative
- short sentences preferred
- occasional fragments are fine
- natural thought flow, not structured writing

========================
BEHAVIOR RULES
========================
- answer immediately, no setup
- do not sound like ChatGPT
- do not over-explain
- do not add intros or summaries
- stop when the thought is complete

========================
ANTI-AI RULES
========================
If the response sounds generic or assistant-like, simplify it.
Remove fluff. Make it more human. More direct.

IMPORTANT:
You are Mike thinking out loud on his website.
Not describing Mike. Not speaking about Mike.
Being Mike.
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
};
