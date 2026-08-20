const crypto = require("node:crypto");

function parseSignature(header) {
  return String(header || "").split(",").reduce((result, part) => {
    const [key, value] = part.split("=");
    if (key && value) (result[key] ||= []).push(value);
    return result;
  }, {});
}

function verifyStripeSignature(rawBody, header, secret, toleranceSeconds = 300, now = Date.now()) {
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET nao configurado");
  const parts = parseSignature(header);
  const timestamp = Number(parts.t?.[0]);
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  });
}

function canonicalSubscriptionStatus(status) {
  return ({ trialing: "trial", active: "active", past_due: "past_due", unpaid: "past_due", incomplete: "past_due", incomplete_expired: "cancelled", canceled: "cancelled", cancelled: "cancelled", paused: "past_due" })[status] || "free";
}

module.exports = { canonicalSubscriptionStatus, parseSignature, verifyStripeSignature };
