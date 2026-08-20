const { accountForUser, authenticatedUser, json, required, stripe, updateAccount } = require("./_backend");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido" });
  try {
    const user = await authenticatedUser(req);
    if (!user) return json(res, 401, { error: "Entre na sua conta para assinar" });
    const account = await accountForUser(user.id);
    if (!account) return json(res, 409, { error: "Complete seu perfil antes de assinar" });
    let customerId = account.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe("customers", { email: user.email, "metadata[user_id]": user.id });
      customerId = customer.id;
      await updateAccount(user.id, { stripe_customer_id: customerId });
    }
    const base = required("APP_URL").replace(/\/$/, "");
    const session = await stripe("checkout/sessions", {
      mode: "subscription", customer: customerId, client_reference_id: user.id,
      "line_items[0][price]": required("STRIPE_PRICE_ID"), "line_items[0][quantity]": 1,
      "metadata[user_id]": user.id, "subscription_data[metadata][user_id]": user.id,
      success_url: `${base}/estudo.html?checkout=success#radio`, cancel_url: `${base}/estudo.html?checkout=cancelled#perfil`, allow_promotion_codes: "true"
    });
    return json(res, 200, { url: session.url });
  } catch (error) {
    console.error("checkout_error", error.message);
    return json(res, 500, { error: "Nao foi possivel iniciar a assinatura" });
  }
};
