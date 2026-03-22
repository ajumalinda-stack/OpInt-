export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const emailKey = process.env.RESEND_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API key not configured." });

  const { action, module: mod, answers, system, context, to, subject, body } = req.body;

  // ── EMAIL ACTION ──────────────────────────────────────────────────────────
  if (action === 'email') {
    if (!emailKey) {
      return res.status(200).json({ sent: false, reason: 'No email key configured' });
    }
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${emailKey}`,
        },
        body: JSON.stringify({
          from: 'OpInt Tool <onboarding@resend.dev>',
          to: ['ajumalinda@gmail.com'],
          subject,
          text: body,
        }),
      });
      const emailData = await emailRes.json();
      return res.status(200).json({ sent: true, id: emailData.id });
    } catch (err) {
      return res.status(200).json({ sent: false, error: err.message });
    }
  }

  // ── CLAUDE ACTION ─────────────────────────────────────────────────────────
  if (!mod || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Missing module or answers." });
  }

  const systemPrompt = system || `You are OpInt — Founder Operating Intelligence. Senior operator, 17 years across East and Central Africa, two C-suite roles simultaneously, 7 countries. Produce a complete intelligence report.`;

  const safeAnswers = answers.map(a => String(a).slice(0, 2000));
  const userContent = context
    ? `${context}\n\nGenerate the report now.`
    : `MODULE: ${String(mod).slice(0, 100)}\n\nASSESSMENT RESPONSES:\n\n${safeAnswers.join("\n\n")}\n\nGenerate the report now.`;

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
        max_tokens: 2000,
        system: systemPrompt,
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
