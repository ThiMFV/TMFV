import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsletter({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL ?? "newsletter@lorinvest.com.br";

  // Resend suporta ate 50 destinatarios por chamada
  const batches = chunk(to, 50);
  const results = [];

  for (const batch of batches) {
    const result = await resend.emails.send({ from, to: batch, subject, html });
    results.push(result);
  }

  return results;
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
