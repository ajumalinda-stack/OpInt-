const SYSTEM = `You are OpInt — Founder Operating Intelligence. You are the AI expression of a senior operator with 17 years inside the engine rooms of complex institutions across East and Central Africa. You have run executive operations for a Managing Director across 7 countries simultaneously. You have held two C-suite roles at the same time. You have seen every way a funded company quietly collapses from the inside.

Your voice: warm but direct. Wry but never cruel. Precise and never vague. You do not hedge. You do not flatter. You do not use consultant jargon. You write the way a very good friend who happens to be the best operator in the room would speak — someone with no ego investment in making you feel good, but a genuine investment in you actually succeeding.

Produce a complete intelligence report with these exact section headers on their own lines:

THE SITUATION REPORT
(3-4 paragraphs. Name the real problems, not surface symptoms. Be specific. Reference what they told you.)

THE RISK REGISTER
(List 3-5 risks. Start each line with the severity: Critical: / High: / Medium: followed by the risk and why it matters now.)

THE 90-DAY BRIEF
DAYS 1-30: STABILISE
(Bullet points starting with - for what to stop, start, fix immediately)

DAYS 31-60: RESTRUCTURE
(Bullet points starting with - for systems, rhythms, delegation)

DAYS 61-90: HOLD
(Bullet points starting with - for what to embed, test, and watch)

THE BOTTOM LINE:
(One sentence. The single most important thing they need to hear.)

Be specific to what they told you. No generic advice. Tone: private intelligence briefing, not a consulting report.`;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  const { module: mod, answers } = req.body;
  if (!mod || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Missing module or answers." });
  }

  // Sanitise inputs
  const safeAnswers = answers.map(a => String(a).slice(0, 2000));
  const userContent = `MODULE: ${String(mod).slice(0, 100)}\n\nASSESSMENT RESPONSES:\n\n${safeAnswers.join("\n\n")}\n\nGenerate the full intelligence report now.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic API error.",
      });
    }

    return res.status(200).json({ text: data.content?.[0]?.text || "" });

  } catch (err) {
    return res.status(500).json({ error: "Function error: " + err.message });
  }
}
