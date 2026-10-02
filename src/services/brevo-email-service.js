// FR-26 caregiver email delivery via the Brevo transactional email REST API.
//
// PROTOTYPE-ONLY WARNING: VITE_BREVO_API_KEY is bundled into the browser
// JavaScript. Anyone can read it from devtools/network requests. This is
// acceptable for a demo/prototype but must never be used in production —
// a real deployment needs a server (Cloud Function, Vercel/Netlify function,
// etc.) to keep the API key off the client.
export async function sendCaregiverEmail({ to, subject, text }) {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;
  const senderEmail = import.meta.env.VITE_BREVO_SENDER_EMAIL;
  const senderName = import.meta.env.VITE_BREVO_SENDER_NAME || "MedMate";
  if (!apiKey || !senderEmail) {
    throw new Error("Brevo is not configured (missing VITE_BREVO_API_KEY or VITE_BREVO_SENDER_EMAIL).");
  }
  if (!to) throw new Error("No caregiver email on file.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Brevo request failed (${response.status}): ${body.slice(0, 200)}`);
  }
}
