import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "First Mate <onboarding@resend.dev>";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

/**
 * Falls back to logging the email to the console when RESEND_API_KEY isn't
 * configured, so the auth flows are exercisable in local dev before a real
 * Resend account is wired up.
 */
async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  await client.emails.send({ from: FROM_ADDRESS, to, subject, text });
}

export function sendOtpEmail(to: string, code: string): Promise<void> {
  return sendEmail(
    to,
    "Your First Mate login code",
    `Your login code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  );
}

export function sendMagicLinkEmail(to: string, link: string): Promise<void> {
  return sendEmail(
    to,
    "Your First Mate sign-in link",
    `Sign in to First Mate: ${link}\n\nThis link expires in 15 minutes. If you didn't request this, you can ignore this email.`,
  );
}
