export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "https://www.mikeplymale.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {

    // =========================
    // HARDCODED RESUME (source of truth)
    // =========================
    const resume = {

      identity: {
        name: "Mike Plymale",
        title: "Executive Creative Director",
        location: "Acworth, Georgia",
        website: "https://www.mikeplymale.com",
        linkedin: "https://www.linkedin.com/in/mikeplymale/",
        email: "mike.plymale@gmail.com",
      },

      summary: `Over two decades of award-winning experience leading diverse creative teams 
in crafting impactful brand experiences. Expertise spans agency, consulting, and in-house 
creative environments. Specializes in blending emerging trends with human-centered design. 
Passionate about staying hands-on, fostering growth, and pushing boundaries.`,

      experience: [
        {
          title: "Executive Creative Director",
          company: "Alloy | Look Listen",
          location: "Atlanta, GA",
          dates: "06/2024 – Present",
          highlights: [
            "Built and scaled a high-performing UX/Product and Creative/Brand design team",
            "Defined and led creative vision across enterprise and retail client portfolios",
            "Partnered with leadership to shape company strategy and expand design capabilities",
            "Led end-to-end delivery across complex digital and product initiatives",
            "95% client retention rate",
            "Reduced project turnaround time by over 50% through design systems and UX methodologies",
            "Led enterprise design system creation for a major financial services client",
            "Established a consultative framework prioritizing business outcomes over project delivery",
          ],
        },
        {
          title: "Group Design Director, Sr. Manager",
          company: "Sagepath Reply",
          location: "Atlanta, GA",
          dates: "03/2020 – 05/2024",
          highlights: [
            "Established and nurtured the UX/Product design team, driving 10 consecutive years of revenue growth",
            "95% client retention rate with expanded new client acquisition",
            "Collaborated with executive leadership to align product design with company goals",
            "Co-led daily SCRUM, grooming sessions, and sprint planning",
            "Managed Veritiv account: 15 dev sprints, 650+ design comps, 803 tickets, 70+ components",
            "Resulted in 35% reduction in bounce rates and 21% increase in page visits",
            "Portfolio of 15+ retail clients with 325% average sales increase",
          ],
        },
        {
          title: "Creative Director, Sr. Agency Manager",
          company: "Perficient Digital",
          location: "Atlanta, GA",
          dates: "11/2017 – 03/2020",
          highlights: [
            "Co-created streamlined processes for strategy, design, and UX",
            "20% reduction in project turnaround time",
            "20% increase in client conversion rates",
            "Championed user-centric design with integrated user research and testing",
          ],
        },
        {
          title: "Creative Director, Experience Architecture & Strategy",
          company: "State Farm",
          location: "Atlanta, GA",
          dates: "10/2015 – 11/2017",
          highlights: [
            "Led creative strategy in the CROM (Customer Retention and Opportunity Management) vertical",
            "Managed governance for the entire UX practice",
            "Championed data-driven insights and user research to inform design",
            "Co-led functional grooming sessions for Salesforce products",
          ],
        },
        {
          title: "Associate Creative Director",
          company: "Sagepath",
          location: "Atlanta, GA",
          dates: "04/2014 – 10/2015",
          highlights: [
            "Provided strategic creative direction and management for the creative team",
            "Restructured UX and design workflows for improved efficiency",
            "Spearheaded new business pitches and client acquisition",
            "Designed the Floorvana Native App for Shaw Floors — won a Davey Award",
          ],
        },
      ],

      education: [
        {
          degree: "Bachelor of Fine Arts — Graphic and Interactive Communications",
          school: "Ringling College of Art & Design",
          location: "Sarasota, FL",
          years: "2002 – 2006",
        },
        {
          degree: "Minor — Photography & Digital Imaging",
          school: "Ringling College of Art & Design",
          location: "Sarasota, FL",
          years: "2002 – 2006",
        },
      ],

      certifications: [
        "CUA – Certified Usability Analyst (HFI)",
        "Webflow Certification",
        "Adobe Premiere Pro (Stackskills)",
        "Adobe Photoshop Masterclass (Stackskills)",
        "OWD – Open Water Diver (PADI)",
      ],

      skills: [
        "Creative & Design Direction",
        "Art Direction",
        "UX Strategy",
        "Photography & Post Production",
        "Cinematography & Editing",
        "Motion Design & Theory",
        "Digital & Communication Strategy",
        "Information Design",
        "Identity & Branding",
      ],

      awards: [
        { award: "Davey Award", project: "Floorvana App" },
        { award: "Addy Gold", project: "USMC Xbox Brand Experience" },
        { award: "Addy Gold", project: "USMC YouTube Brand Channel" },
        { award: "W3 Best in Show", project: "Marines.com" },
        { award: "W3 Gold – General Gov Site", project: "Marines.com" },
        { award: "W3 Silver – User Experience", project: "Marines.com" },
        { award: "W3 Silver – Website Features", project: "Marines.com" },
        { award: "Webby Award", project: "Marines.com" },
        { award: "Webby Award", project: "Denon100.com" },
        { award: "Perspectives Magazine Feature", project: "Fluid & Form Series" },
        { award: "Addy Award", project: "Home Depot Racing Website" },
        { award: "Pagecrush.com – Featured Site and Interview", project: "" },
        { award: "Heidelberg USA Award", project: "Gevity Annual Report" },
        { award: "The Best of Ringling", project: "Expressive Typography Book" },
        { award: "Embracing Our Differences", project: "Exhibition Design" },
      ],

    };

    // =========================
    // SERIALIZE RESUME TO TEXT
    // (clean string for the AI system prompt)
    // =========================
    const resumeText = `
=== MIKE PLYMALE — RESUME (SOURCE OF TRUTH) ===

IDENTITY:
Name: ${resume.identity.name}
Title: ${resume.identity.title}
Location: ${resume.identity.location}
Website: ${resume.identity.website}
LinkedIn: ${resume.identity.linkedin}

SUMMARY:
${resume.summary}

EXPERIENCE:
${resume.experience.map(job => `
${job.title} | ${job.company} | ${job.location} | ${job.dates}
${job.highlights.map(h => `  - ${h}`).join("\n")}
`).join("\n")}

EDUCATION:
${resume.education.map(e => `  - ${e.degree}, ${e.school}, ${e.location} (${e.years})`).join("\n")}

CERTIFICATIONS:
${resume.certifications.map(c => `  - ${c}`).join("\n")}

SKILLS:
${resume.skills.map(s => `  - ${s}`).join("\n")}

AWARDS:
${resume.awards.map(a => `  - ${a.award}${a.project ? ` — ${a.project}` : ""}`).join("\n")}
`.trim();

    // =========================
    // LIVE SQUARESPACE PAGES
    // =========================
    const urls = [
      "https://www.mikeplymale.com",
      "https://www.mikeplymale.com/about",
      "https://www.mikeplymale.com/work",
    ];

    const pages = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          const html = await response.text();
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000);
          return { url, text };
        } catch (err) {
          return { url, text: `Failed to fetch: ${err.message}` };
        }
      })
    );

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      pages,
      resumeText,
      resume, // structured object (optional future use)
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
