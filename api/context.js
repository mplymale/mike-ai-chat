export default async function handler(req, res) {
  try {
    const urls = [
      "https://www.mikeplymale.com/about",
      "https://www.mikeplymale.com/work",
      "https://www.mikeplymale.com"
    ];

    const resumeUrl = "https://www.mikeplymale.com/your-resume.pdf"; // <-- CHANGE THIS

    // fetch HTML pages
    const pages = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        const html = await response.text();

        const text = html
          .replace(/<script[^>]*>.*?<\/script>/gs, "")
          .replace(/<style[^>]*>.*?<\/style>/gs, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);

        return { url, text };
      })
    );

    // fetch resume PDF as text
    let resumeText = "";

    try {
      const pdfRes = await fetch(resumeUrl);

      const arrayBuffer = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // lightweight PDF text extraction
      resumeText = buffer.toString("utf-8").replace(/\s+/g, " ").slice(0, 6000);
    } catch (err) {
      resumeText = "Resume not available";
    }

    res.status(200).json({
      pages,
      resume: resumeText
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
