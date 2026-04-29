export default async function handler(req, res) {
  // =========================
  // CORS (Squarespace safe)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // =========================
    // SITE CONTEXT (PERSONALITY LAYER)
    // =========================
    const siteContext = `
You are Mike’s personal website assistant.

Mike is an Executive Creative Director.
He builds product design systems and digital experiences.
He values clarity, systems thinking, and long-term craft.

When responding:
- Speak like you are representing Mike’s thinking
- Be grounded, not hype-driven
- Keep responses specific and human
- Avoid generic AI disclaimers
`;

    // =========================
    // OPENAI REQUEST
    // =========================
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: siteContext
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "No response from OpenAI",
        details: data
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
