// /api/logs.js
// View all chat questions logged to Upstash
// Access at: https://mike-ai-chat.vercel.app/api/logs?secret=YOUR_SECRET

const SECRET = process.env.LOGS_SECRET || "mikeplymale-logs";
const MAX_ENTRIES = 200;

export default async function handler(req, res) {
  // Simple secret key protection — not accessible by the public
  if (req.query.secret !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const url   = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      return res.status(500).json({ error: "KV not configured" });
    }

    // Fetch latest entries from Redis list
    const response = await fetch(`${url}/lrange/chat-questions/0/${MAX_ENTRIES - 1}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    const entries = (data.result || []).map(e => {
      try {
        const parsed = typeof e === "string" ? JSON.parse(e) : e;
        return parsed;
      } catch {
        return { question: e, timestamp: "", ip: "" };
      }
    });

    // Return as clean HTML for easy reading in browser
    const rows = entries.map(e => `
      <tr>
        <td style="color:#aaa;white-space:nowrap;padding:6px 12px;">${e.timestamp || ""}</td>
        <td style="padding:6px 12px;">${e.question || e.raw || JSON.stringify(e)}</td>
        <td style="color:#666;padding:6px 12px;">${e.ip || ""}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chat Questions</title>
        <style>
          body { background:#1a1a1a; color:#fff; font-family:Arial,sans-serif; padding:40px; }
          h1 { color:#b08d43; margin-bottom:8px; }
          p { color:#888; margin-bottom:24px; }
          table { width:100%; border-collapse:collapse; font-size:14px; }
          th { text-align:left; color:#b08d43; padding:6px 12px; border-bottom:1px solid #333; }
          tr:hover td { background:#272727; }
          td { border-bottom:1px solid #222; }
        </style>
      </head>
      <body>
        <h1>Chat Questions</h1>
        <p>${entries.length} most recent questions</p>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Question</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
