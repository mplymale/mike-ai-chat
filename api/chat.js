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
    // WORK CONTEXT (KNOWLEDGE LAYER)
    // =========================
    const workContext = `
MIKE'S WORK & DESIGN APPROACH:

1. DESIGN LEADERSHIP
- Leads product design systems and UX strategy
- Focuses on scalable, reusable UI architecture
- Prioritizes consistency and long-term maintainability

2. SYSTEM THINKING
- Designs systems, not isolated screens
- Thinks in reusable patterns and components
- Strong focus on structure over decoration

3. PRODUCT PHILOSOPHY
- Clean, minimal interfaces with strong hierarchy
- Works closely with engineering teams for implementation fidelity
- Balances business goals with user clarity

4. CORE PRINCIPLES
- Clarity over complexity
- Systems over screens
- Longevity over trends
- Function drives form

5. SIGNAL OF HIS WORK
- Work reflects structured thinking and design maturity
- Emphasis on scalable product ecosystems
- Strong alignment between design and engineering
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
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: siteContext + "\n\n" + workContext
          },
          {
            role: "user",
            content: message
          }
        ]
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
