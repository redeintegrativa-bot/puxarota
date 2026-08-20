const { accountForUser, authenticatedUser, json, required, stripe } = require("./_backend");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido" });
  try {
    const user = await authenticatedUser(req);
    if (!user) return json(res, 401, { error: "Entre na sua conta" });
    const account = await accountForUser(user.id);
    if (!account?.stripe_customer_id) return json(res, 409, { error: "Nenhuma assinatura encontrada" });
    const base = required("APP_URL").replace(/\/$/, "");
    const session = await stripe("billing_portal/sessions", { customer: account.stripe_customer_id, return_url: `${base}/estudo.html#perfil` });
    return json(res, 200, { url: session.url });
  } catch (error) {
    console.error("portal_error", error.message);
    return json(res, 500, { error: "Nao foi possivel abrir a assinatura" });
  }
};
