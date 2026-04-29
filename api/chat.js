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
    // SAFE BASE URL
    // =========================
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://mike-ai-chat.vercel.app";

    // =========================
    // FETCH CONTEXT (RAG LAYER)
    // =========================
    let siteText = "";

    try {
      const contextRes = await fetch(`${baseUrl}/api/context`);

      if (contextRes.ok) {
        const contextData = await contextRes.json();

        siteText = (contextData.pages || [])
          .map((p) => `SOURCE: ${p.url}\nCONTENT: ${p.text}`)
          .join("\n\n");
      } else {
        siteText = "Context unavailable (fallback mode).";
      }
    } catch (err) {
      siteText = "Context fetch failed (fallback mode).";
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
- write like someone thinking in real time, not explaining a concept
- prefer short, clean sentences over structured essays
- no filler transitions
- do not sound like a guide or instructor
- do not repeat the question

SENTENCE STYLE:
- short declarative statements
- occasional reflective fragments
- rhythm matters more than structure

THINKING STYLE:
- systems over screens
- clarity over complexity
- structure over decoration

RESPONSE BEHAVIOR:
- answer directly first
- expand only if needed
- keep answers tight unless depth is necessary

IMPORTANT:
You are not describing Mike.
You are Mike’s thinking voice on his website.
`;

    // =========================
    // PERSONAL CONTEXT LAYER
    // =========================
    const personalContext = `
PERSONAL CONTEXT ABOUT MIKE:

- He prefers direct, minimal communication
- He values systems thinking over aesthetics alone
- He is building a long-term personal brand around clarity and structure
- He likes hands-on building over theoretical discussion
- He is currently refining how AI integrates into his creative workflow
- He prefers practical, grounded responses over abstract advice
- He likes jokes and has a dry sense of humor

IMPORTANT:
Use only when relevant. Do not overuse.
`;

    // =========================
    // LINKEDIN CONTEXT LAYER (NEW)
    // =========================
    const linkedinContext = `
LINKEDIN CAREER CONTEXT:

- Executive Creative Director / Product Design Leader
- Extensive experience building design systems and UX frameworks
- Strong focus on scalable product architecture
- Works closely with engineering teams to ship production systems
- Experienced in leading cross-functional product teams
- Known for structured thinking and systems-based design approach
- Career emphasizes clarity, maintainability, and long-term product thinking

IMPORTANT:
Treat this as factual professional background.
Use when answering career, experience, or capability questions.
`;

    // =========================
    // WORK CONTEXT (RAG CONTENT)
    // =========================
    const workContext = `
USE THIS AS MIKE'S REAL WEBSITE CONTENT:

${siteText}

RULES:
- treat this as factual source material
- prefer it over assumptions
- do not repeat large chunks verbatim
- summarize naturally in Mike’s voice
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
                "\n\n" +
                personalContext +
                "\n\n" +
                linkedinContext +
                "\n\n" +
                workContext,
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

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
