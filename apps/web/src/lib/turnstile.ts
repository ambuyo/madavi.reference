export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (import.meta.env.DEV) return true;

  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json();
  return data.success === true;
}
