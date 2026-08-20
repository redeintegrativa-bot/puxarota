const { canonicalSubscriptionStatus, verifyStripeSignature } = require("./_stripe-utils");
const { accountForCustomer, json, rawBody, required, updateAccount } = require("./_backend");

async function updateFromSubscription(subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const account = customerId ? await accountForCustomer(customerId) : null;
  const userId = subscription.metadata?.user_id || account?.user_id;
  if (!userId) return;
  await updateAccount(userId, {
    stripe_customer_id: customerId || account?.stripe_customer_id,
    stripe_subscription_id: subscription.id,
    subscription_status: canonicalSubscriptionStatus(subscription.status),
    subscription_current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido" });
  try {
    const body = await rawBody(req);
    if (!verifyStripeSignature(body, req.headers["stripe-signature"], required("STRIPE_WEBHOOK_SECRET"))) return json(res, 400, { error: "Assinatura invalida" });
    const event = JSON.parse(body);
    const object = event.data?.object || {};
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await updateFromSubscription(object);
    } else if (event.type === "checkout.session.completed" && object.mode === "subscription") {
      const userId = object.metadata?.user_id || object.client_reference_id;
      if (userId) await updateAccount(userId, {
        stripe_customer_id: typeof object.customer === "string" ? object.customer : object.customer?.id,
        stripe_subscription_id: typeof object.subscription === "string" ? object.subscription : object.subscription?.id,
        subscription_status: "active"
      });
    } else if (event.type === "invoice.payment_failed") {
      const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
      const account = customerId ? await accountForCustomer(customerId) : null;
      if (account) await updateAccount(account.user_id, { subscription_status: "past_due" });
    }
    return json(res, 200, { received: true });
  } catch (error) {
    console.error("stripe_webhook_error", error.message);
    return json(res, 400, { error: "Webhook rejeitado" });
  }
};
