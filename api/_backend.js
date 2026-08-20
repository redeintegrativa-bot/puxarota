function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nao configurado`);
  return value;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function stripe(path, values) {
  const body = new URLSearchParams();
  Object.entries(values || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") body.append(key, String(value)); });
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: "POST", headers: { Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Falha na comunicacao com a Stripe");
  return result;
}

async function supabase(path, options = {}) {
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${required("SUPABASE_URL")}/rest/v1/${path}`, { ...options, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...(options.headers || {}) } });
  const responseText = await response.text();
  const result = responseText ? JSON.parse(responseText) : null;
  if (!response.ok) throw new Error(result?.message || result?.error || "Falha no banco de dados");
  return result;
}

async function authenticatedUser(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${required("SUPABASE_URL")}/auth/v1/user`, { headers: { apikey: required("SUPABASE_ANON_KEY"), Authorization: authorization } });
  return response.ok ? response.json() : null;
}

async function accountForUser(userId) {
  const rows = await supabase(`puxarota_accounts?user_id=eq.${encodeURIComponent(userId)}&select=*`);
  return rows?.[0] || null;
}

async function accountForCustomer(customerId) {
  const rows = await supabase(`puxarota_accounts?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=*`);
  return rows?.[0] || null;
}

async function updateAccount(userId, values) {
  const rows = await supabase(`puxarota_accounts?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify(values) });
  return rows?.[0] || null;
}

module.exports = { accountForCustomer, accountForUser, authenticatedUser, json, rawBody, required, stripe, updateAccount };
