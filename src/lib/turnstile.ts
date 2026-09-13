/**
 * Server-side Turnstile verification. Turnstile is free (20 widgets/account),
 * no card required. Get keys: dashboard → Turnstile → Add widget.
 * Fail closed in production; in dev without keys, allow (documented).
 */

export async function verifyTurnstile(token: string | null | undefined, remoteip?: string): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (remoteip) form.append("remoteip", remoteip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
