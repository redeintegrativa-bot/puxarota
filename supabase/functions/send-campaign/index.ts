import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@puxarota.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

async function isAdmin(sub) {
  if (!SUPABASE_URL || !SERVICE_ROLE || !sub) return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_puxarota_admin`, {
    method: "POST",
    headers: { "apikey": SERVICE_ROLE, "Authorization": `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ check_user: sub })
  });
  if (!response.ok) return false;
  const value = await response.json();
  return value === true;
}

serve(async (request) => {
  if (request.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const claims = decodeJwt(token);
  if (!claims?.sub) return json({ ok: false, reason: "unauthorized" }, 401);
  if (!(await isAdmin(claims.sub))) return json({ ok: false, reason: "forbidden" }, 403);
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ ok: false, reason: "vapid_not_configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, reason: "invalid_json" }, 400); }
  const { user_id, message, button } = body || {};
  if (!user_id || !String(message || "").trim()) return json({ ok: false, reason: "missing_fields" }, 400);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const subsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/puxarota_push_subscriptions?user_id=eq.${encodeURIComponent(user_id)}&select=endpoint,p256dh,auth`,
    { headers: { "apikey": SERVICE_ROLE, "Authorization": `Bearer ${SERVICE_ROLE}` } }
  );
  if (!subsResponse.ok) return json({ ok: false, reason: "subscriptions_unavailable" }, 500);
  const subscriptions = await subsResponse.json();

  const payload = JSON.stringify({
    title: "PuxaRota",
    body: String(message).trim(),
    icon: "/logo-1.jpg",
    badge: "/logo-1.jpg",
    data: { url: "/", button_url: button?.url || null },
    actions: button?.label && button?.url ? [{ action: "open", title: String(button.label) }] : []
  });

  let sent = 0;
  let failed = 0;
  for (const subscription of subscriptions) {
    if (!subscription?.endpoint || !subscription?.p256dh || !subscription?.auth) continue;
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return json({ ok: true, sent, failed });
});