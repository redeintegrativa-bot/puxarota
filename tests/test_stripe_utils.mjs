import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import stripeUtils from "../api/_stripe-utils.js";

const { canonicalSubscriptionStatus, verifyStripeSignature } = stripeUtils;

test("normaliza estados da Stripe para o acesso do app", () => {
  assert.equal(canonicalSubscriptionStatus("trialing"), "trial");
  assert.equal(canonicalSubscriptionStatus("active"), "active");
  assert.equal(canonicalSubscriptionStatus("past_due"), "past_due");
  assert.equal(canonicalSubscriptionStatus("canceled"), "cancelled");
  assert.equal(canonicalSubscriptionStatus("desconhecido"), "free");
});

test("aceita somente assinatura autentica e recente", () => {
  const secret = "whsec_teste";
  const timestamp = 1_700_000_000;
  const body = JSON.stringify({ id: "evt_1" });
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  assert.equal(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, 300, timestamp * 1000), true);
  assert.equal(verifyStripeSignature(`${body}x`, `t=${timestamp},v1=${signature}`, secret, 300, timestamp * 1000), false);
  assert.equal(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, 300, (timestamp + 301) * 1000), false);
});
