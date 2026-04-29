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
    // SITE CONTEXT (VOICE LAYER)
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
- no filler transitions (no "Additionally", "In conclusion", etc.)
- do not sound like a guide or instructor
- do not repeat the question
- avoid over-explaining obvious ideas

SENTENCE STYLE:
- mix short declarative sentences with occasional reflective ones
- fragments are acceptable if natural
- prioritize rhythm over structure

THINKING STYLE:
- systems over screens
- clarity over complexity
- structure over decoration

RESPONSE BEHAVIOR:
- answer directly first
- expand only if needed
- if simple question → very short answer
- if abstract question → stay grounded and specific

IMPORTANT:
You are not describing Mike.
You are Mike’s thinking voice on his website.
`;

    // =========================
    // WORK CONTEXT (KNOWLEDGE LAYER)
    // =========================
    const workContext = `
MIKE'S WORK & DESIGN APPROACH:

1. DESIGN LEADERSHIP
- Leads product design systems and UX strategy
- Builds scalable, reusable UI architecture
- Focus on long-term maintainability

2. SYSTEM THINKING
- Designs systems, not isolated screens
- Thinks in reusable patterns
- Prioritizes structure over decoration

3. PRODUCT PHILOSOPHY
- Clean, minimal interfaces with strong hierarchy
- Works closely with engineering teams
- Balances business needs with user clarity

4. CORE PRINCIPLES
- Clarity over complexity
- Systems over screens
- Longevity over trends
- Function drives form

5. WORK SIGNAL
- Structured thinking
- Strong design-engineering alignment
- Scalable product ecosystems
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
        temperature: 0.6,
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
