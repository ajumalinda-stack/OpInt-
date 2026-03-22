export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const emailKey = process.env.RESEND_API_KEY;

  if (!emailKey) {
    console.log('No RESEND_API_KEY found');
    return res.status(200).json({ sent: false, reason: 'No email key configured' });
  }

  const { subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: 'Missing subject or body' });
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
    console.log('Resend response:', JSON.stringify(emailData));

    if (emailData.id) {
      return res.status(200).json({ sent: true, id: emailData.id });
    } else {
      return res.status(200).json({ sent: false, error: emailData });
    }

  } catch (err) {
    console.log('Email function error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
