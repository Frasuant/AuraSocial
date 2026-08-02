/**
 * reCAPTCHA v2 verification.
 *
 * Uses Google's test keys by default (always pass).
 * Replace RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET with real keys for production.
 * Get keys at: https://www.google.com/recaptcha/admin
 */

// Google's official test keys (always pass verification)
export const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const RECAPTCHA_SECRET = "6LeIxAcTAAAAAGG-vFI1TnSPxvi1dYy2kU5z5qN";

/**
 * Verify a reCAPTCHA token server-side.
 * Returns true if the token is valid.
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("[recaptcha] verification error:", err);
    // Fail open in case Google is unreachable (don't block all users)
    return true;
  }
}
