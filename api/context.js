export default async function handler(req, res) {
  try {
    const urls = [
      "https://www.mikeplymale.com/about",
      "https://www.mikeplymale.com/work",
      "https://www.mikeplymale.com"
    ];

    const pages = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        const html = await response.text();

        // strip HTML → plain text
        const text = html
          .replace(/<script[^>]*>.*?<\/script>/gs, "")
          .replace(/<style[^>]*>.*?<\/style>/gs, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);

        return {
          url,
          text
        };
      })
    );

    res.status(200).json({ pages });

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch site content",
      details: error.message
    });
  }
}
