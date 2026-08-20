(function () {
  "use strict";

  const CONFIG = window.PUXAROTA_SUPABASE || {};
  let client = null;
  let subscription = null;
  const q = (selector) => document.querySelector(selector);
  const accountLabel = { driver: "Motorista / agregado", helper: "Ajudante", company: "Transportadora", admin: "Administração" };
  const profileKind = { driver: "Motorista", helper: "Ajudante", company: "Transportadora" };
  const profileState = { pending: "Seu cadastro está em análise.", approved: "Seu perfil foi aprovado.", rejected: "Seu cadastro precisa de revisão. Fale com o PuxaRota para saber o próximo passo.", archived: "Seu perfil está arquivado." };

  function setText(selector, value) { const element = q(selector); if (element) element.textContent = value || ""; }
  function setValue(selector, value) { const element = q(selector); if (element && value != null) element.value = value; }
  function status(text, error = false) { const element = q("#admin-auth-status"); if (element) { element.textContent = text; element.classList.toggle("error", error); } }

  async function getClient() {
    if (client) return client;
    if (!CONFIG.url || !CONFIG.anonKey) return null;
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
      });
    }
    client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    return client;
  }

  async function signedInUser(db) {
    const { data, error } = await db.auth.getUser();
    return error ? null : data.user || null;
  }

  async function accountFor(db, userId) {
    const { data, error } = await db.from("puxarota_accounts").select("account_type,is_approved,display_name,license_status").eq("user_id", userId).maybeSingle();
    return error ? null : data;
  }

  async function profileFor(db, userId) {
    const { data, error } = await db.from("puxarota_profiles").select("id,profile_type,display_name,whatsapp,region,postal_code,vehicle,license_category,cargo_preference,availability,consent_data,status,contact_release").eq("user_id", userId).maybeSingle();
    return error ? null : data;
  }

  function updateProfileNav(user, account) {
    setText("#profile-nav-label", user ? (account?.account_type === "admin" ? "Gestão" : "Perfil") : "Entrar");
  }

  function resetMemberView() {
    const box = q("#account-box"); const card = q("#member-card"); const details = q("#profile-details"); const intro = q("#auth-intro"); const steps = q("#how-it-works"); const admin = q("#member-admin");
    if (box) box.hidden = false;
    if (card) card.hidden = true;
    if (details) details.hidden = true;
    if (intro) intro.hidden = false;
    if (steps) steps.hidden = false;
    if (admin) admin.hidden = true;
    updateProfileNav(null, null);
  }

  function fillProfile(user, profile, account) {
    const kind = profileKind[profile?.profile_type] || (account?.account_type === "company" ? "Transportadora" : account?.account_type === "helper" ? "Ajudante" : "Motorista");
    setValue("#profile-kind", kind);
    setValue("#profile-name-new", profile?.display_name || user.email?.split("@")[0] || "");
    setValue("#profile-email-new", user.email || "");
    const phoneDigits = String(profile?.whatsapp || "").replace(/\D/g, "");
    if (phoneDigits.startsWith("55") && phoneDigits.length >= 12) {
      setValue("#profile-country-new", "+55");
      setValue("#profile-area-new", phoneDigits.slice(2, 4));
      setValue("#profile-phone-new", phoneDigits.slice(4));
    } else {
      setValue("#profile-phone-new", profile?.whatsapp || "");
    }
    setValue("#profile-region", profile?.region || "");
    setValue("#profile-cep", profile?.postal_code || "");
    setValue("#profile-vehicle", profile?.vehicle || "");
    setValue("#profile-license", profile?.license_category || "Não informada");
    setValue("#profile-cargo", profile?.cargo_preference || "");
    setValue("#profile-availability", profile?.availability || "");
    const consent = q("#profile-consent"); if (consent) consent.checked = profile?.consent_data === true;
    const isCompany = kind === "Transportadora";
    const driver = q("#driver-fields"); const company = q("#company-fields"); const plan = q("#business-plan");
    if (driver) driver.hidden = isCompany; if (company) company.hidden = !isCompany; if (plan) plan.hidden = !isCompany;
    window.dispatchEvent(new CustomEvent("puxarota:profile-loaded", { detail: { vehicle: profile?.vehicle || "" } }));
  }

  function showMember(user, account, profile) {
    const box = q("#account-box"); const card = q("#member-card"); const details = q("#profile-details"); const intro = q("#auth-intro"); const steps = q("#how-it-works"); const admin = q("#member-admin");
    if (box) box.hidden = true;
    if (card) card.hidden = false;
    if (intro) intro.hidden = true;
    if (steps) steps.hidden = true;
    if (admin) admin.hidden = !(account?.account_type === "admin" && account.is_approved === true);
    const name = profile?.display_name || account?.display_name || user.email?.split("@")[0] || "Seu perfil";
    const role = accountLabel[account?.account_type] || "Membro";
    const state = profile ? (profileState[profile.status] || "Seu perfil está salvo.") : "Complete seu perfil para entrar na análise.";
    setText("#member-name", name);
    setText("#member-email", user.email || "");
    setText("#member-state", role + " · " + state);
    const summary = q("#member-summary");
    if (summary) {
      const parts = [profile?.region, profile?.vehicle, profile?.cargo_preference, profile?.availability, profile?.license_category ? "CNH " + profile.license_category : ""].filter(Boolean);
      summary.hidden = !profile || parts.length === 0;
      if (!summary.hidden) summary.textContent = parts.join(" · ");
    }
    if (details) details.hidden = Boolean(profile);
    setText("#profile-data-title", profile ? "Editar dados" : "Agora, vamos completar seu perfil");
    setText("#profile-state-note", state + " Seus dados não aparecem publicamente sem autorização.");
    setText("#profile-submit", profile ? "Salvar alterações" : "Enviar perfil para análise");
    fillProfile(user, profile, account);
    updateProfileNav(user, account);
  }

  async function refreshDashboard() {
    const db = await getClient();
    if (!db) { resetMemberView(); return { user: null, account: null, profile: null }; }
    const user = await signedInUser(db);
    if (!user) {
      resetMemberView();
      window.dispatchEvent(new CustomEvent("puxarota:auth", { detail: { session: null } }));
      return { user: null, account: null, profile: null };
    }
    const [account, profile] = await Promise.all([accountFor(db, user.id), profileFor(db, user.id)]);
    showMember(user, account, profile);
    const detail = { session: true, user, account, profile };
    window.dispatchEvent(new CustomEvent("puxarota:auth", { detail }));
    return detail;
  }

  async function checkAdmin() {
    const db = await getClient();
    if (!db) return { ok: false, reason: "Configure o Supabase antes de usar a gestão." };
    const user = await signedInUser(db);
    if (!user) return { ok: false, reason: "Entre com sua conta administrativa." };
    const account = await accountFor(db, user.id);
    if (!account || account.account_type !== "admin" || account.is_approved !== true) return { ok: false, reason: "Esta conta não tem permissão de administrador." };
    return { ok: true, user, account };
  }

  async function mountAdmin(options) {
    const result = await checkAdmin();
    const auth = q("#admin-auth"); const panel = q("#admin-panel");
    if (!result.ok) {
      if (auth) auth.hidden = false;
      if (panel) panel.hidden = true;
      status(result.reason, true);
      return result;
    }
    if (auth) auth.hidden = true;
    if (panel) panel.hidden = false;
    setText("#admin-session", "Sessão administrativa ativa: " + result.user.email);
    status("Acesso autorizado.");
    options?.onAuthorized?.(result.user);
    return result;
  }

  async function touchPresence() {
    const db = await getClient(); if (!db) return;
    const user = await signedInUser(db); if (!user) return;
    await db.from("puxarota_accounts").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id);
  }

  async function touchLogin(db, userId) {
    const now = new Date().toISOString();
    await db.from("puxarota_accounts").update({ last_login_at: now, last_seen_at: now }).eq("user_id", userId);
  }

  async function loginAdmin(event) {
    event.preventDefault();
    const db = await getClient();
    if (!db) return status("Configure a conexão Supabase antes do login.", true);
    status("Validando acesso");
    const { data, error } = await db.auth.signInWithPassword({ email: q("#admin-email").value.trim(), password: q("#admin-password").value });
    if (error) return status("E-mail ou senha inválidos.", true);
    if (data?.user) await touchLogin(db, data.user.id);
    await refreshDashboard();
    await mountAdmin();
  }

  async function userLogin(event) {
    event.preventDefault();
    const db = await getClient(); const message = q("#account-status");
    if (!db) { if (message) message.textContent = "A conexão segura está indisponível. Tente novamente."; return; }
    if (message) message.textContent = "Entrando";
    const { data, error } = await db.auth.signInWithPassword({ email: q("#account-email").value.trim(), password: q("#account-password").value });
    if (error) { if (message) message.textContent = "E-mail ou senha inválidos."; return; }
    if (data?.user) await touchLogin(db, data.user.id);
    const state = await refreshDashboard();
    if (state.account?.account_type === "admin" && state.account.is_approved) await mountAdmin();
  }

  let signupStarted = false;
  async function signupFlow() {
    const role = q("#onboarding-role"); const button = q("#account-signup"); const message = q("#account-status");
    if (!signupStarted) {
      const email = q("#account-email")?.value.trim() || "";
      const password = q("#account-password")?.value || "";
      if (!email || password.length < 8) {
        if (message) message.textContent = "Informe seu e-mail e crie uma senha de pelo menos 8 caracteres.";
        (!email ? q("#account-email") : q("#account-password"))?.focus();
        return;
      }
      signupStarted = true;
      if (role) role.hidden = false;
      if (button) button.textContent = "Confirmar cadastro";
      if (message) message.textContent = "Agora escolha como vai usar o PuxaRota.";
      return;
    }
    const db = await getClient();
    const email = q("#account-email").value.trim(); const password = q("#account-password").value;
    if (!db) { if (message) message.textContent = "A conexão segura está indisponível. Tente novamente."; return; }
    if (!email || password.length < 8) { if (message) message.textContent = "Informe e-mail e uma senha de pelo menos 8 caracteres."; return; }
    const selected = q(".onboarding-role-choice.active")?.dataset.kind || "Motorista";
    const accountType = selected === "Transportadora" ? "company" : selected === "Ajudante" ? "helper" : "driver";
    const { data, error } = await db.auth.signUp({ email, password, options: { data: { account_type: accountType } } });
    if (error) { if (message) message.textContent = error.message; return; }
    if (!data.session) {
      if (message) message.textContent = "Conta criada. Entre com o e-mail e a senha cadastrados.";
      return;
    }
    if (message) message.textContent = "Conta criada. Complete seu perfil para continuar.";
    await refreshDashboard();
  }

  async function resetPassword() {
    const db = await getClient(); const message = q("#account-status"); const email = q("#account-email")?.value.trim();
    if (!db || !email) { if (message) message.textContent = "Informe seu e-mail para receber o link de recuperação."; return; }
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (message) message.textContent = error ? "Não foi possível enviar o link agora." : "Enviamos um link de recuperação para seu e-mail.";
  }

  async function logout() {
    const db = await getClient();
    if (db) await db.auth.signOut();
    resetMemberView();
    const adminAuth = q("#admin-auth"); const adminPanel = q("#admin-panel");
    if (adminAuth) adminAuth.hidden = false;
    if (adminPanel) adminPanel.hidden = true;
    status("Sessão encerrada.");
  }

  async function hasSession() { return Boolean((await refreshDashboard()).user); }

  function normalizeBrPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 13 && digits.startsWith("55")) return "+55 (" + digits.slice(2, 4) + ") " + digits.slice(4, 9) + "-" + digits.slice(9);
    if (digits.length === 11) return "+55 (" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
    if (digits.length === 10) return "+55 (" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    return String(value || "").trim();
  }
  async function saveProfile(profile) {
    const db = await getClient();
    if (!db) return { ok: false, reason: "supabase_unavailable" };
    const user = await signedInUser(db);
    if (!user) return { ok: false, reason: "not_authenticated" };
    const current = await profileFor(db, user.id);
    const profileType = profile.kind === "Transportadora" ? "company" : profile.kind === "Ajudante" ? "helper" : "driver";
    const payload = { user_id: user.id, profile_type: profileType, display_name: profile.name || user.email || "Perfil PuxaRota", whatsapp: normalizeBrPhone(profile.whatsapp), region: profile.region || null, postal_code: profile.postalCode || null, vehicle: profile.vehicle || null, license_category: profile.license || null, cargo_preference: profile.cargo || null, availability: profile.availability || null, consent_data: profile.consentData === true, consent_data_at: new Date().toISOString(), privacy_version: "2026-08-14" };
    if (!current) Object.assign(payload, { consent_public: false, public_visible: false, status: "pending", source: "self_signup" });
    const { data, error } = await db.from("puxarota_profiles").upsert(payload, { onConflict: "user_id" }).select("id,status").single();
    if (error) return { ok: false, reason: error.message };
    await recordActivity("profile_saved", "profile", data?.id || null, {});
    await refreshDashboard();
    return { ok: true, data };
  }

  async function listAdminProfiles() {
    const result = await checkAdmin(); if (!result.ok) return { ok: false, reason: result.reason, profiles: [], accounts: [] };
    const db = await getClient();
    const [profilesResult, accountsResult] = await Promise.all([
      db.from("puxarota_profiles").select("id,user_id,profile_type,display_name,whatsapp,region,postal_code,vehicle,license_category,cargo_preference,availability,consent_data,consent_public,public_visible,status,contact_release,created_at").order("created_at", { ascending: false }),
      db.from("puxarota_accounts").select("user_id,account_type,display_name,is_approved,created_at,last_login_at,last_seen_at").order("created_at", { ascending: false })
    ]);
    const error = profilesResult.error || accountsResult.error;
    if (error) return { ok: false, reason: error.message, profiles: [], accounts: [] };
    const [phoneResult, emailResult] = await Promise.all([
      db.from("puxarota_accounts").select("user_id,phone"),
      db.from("puxarota_accounts").select("user_id,email_snapshot")
    ]);
    const phones = new Map((phoneResult.data || []).map((account) => [account.user_id, account.phone]));
    const emails = new Map((emailResult.data || []).map((account) => [account.user_id, account.email_snapshot]));
    const [dismissedResult, historyResult] = await Promise.all([
      db.from("puxarota_accounts").select("user_id,admin_dismissed_at"),
      db.from("puxarota_admin_history").select("id,user_id,profile_id,action,note,created_at").order("created_at", { ascending: false }).limit(50)
    ]);
    const dismissed = new Map((dismissedResult.data || []).map((account) => [account.user_id, account.admin_dismissed_at]));
    const accounts = (accountsResult.data || []).map((account) => ({ ...account, phone: phones.get(account.user_id) || null, email_snapshot: emails.get(account.user_id) || null, admin_dismissed_at: dismissed.get(account.user_id) || null }));
    return { ok: true, profiles: profilesResult.data || [], accounts, history: historyResult.data || [] };
  }

  async function reviewProfile(id, statusValue, contactRelease) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient(); const patch = { status: statusValue };
    if (contactRelease) patch.contact_release = contactRelease;
    const { error } = await db.from("puxarota_profiles").update(patch).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function editProfileAdmin(id, patch) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const allowed = ["display_name", "whatsapp", "region", "postal_code", "vehicle", "license_category", "cargo_preference", "availability", "profile_type", "status", "contact_release", "public_visible", "consent_public"];
    const safe = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
    const { error } = await db.from("puxarota_profiles").update(safe).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function publishProfile(id, visible) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const patch = visible ? { status: "approved", public_visible: true, consent_public: true, approved_at: new Date().toISOString() } : { public_visible: false };
    const { error } = await db.from("puxarota_profiles").update(patch).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function listPublicProfiles() {
    const db = await getClient(); if (!db) return [];
    const rpc = await db.rpc("list_public_puxarota_profiles");
    if (!rpc.error) return rpc.data || [];
    const { data, error } = await db.from("puxarota_profiles").select("id,profile_type,display_name,region,vehicle,license_category,cargo_preference,availability").eq("status", "approved").eq("public_visible", true).eq("consent_public", true).neq("profile_type", "company").order("approved_at", { ascending: false });
    return error ? [] : (data || []).map((profile) => ({ ...profile, journey_badges: [] }));
  }

  async function loadRouteProgress() {
    const db = await getClient(); if (!db) return { ok: false, reason: "supabase_unavailable" };
    const user = await signedInUser(db); if (!user) return { ok: false, reason: "not_authenticated" };
    const { data, error } = await db.from("puxarota_route_progress").select("state,badges,updated_at").eq("user_id", user.id).maybeSingle();
    return error ? { ok: false, reason: error.message } : { ok: true, state: data?.state || null, badges: data?.badges || [] };
  }

  async function saveRouteProgress(progress) {
    const db = await getClient(); if (!db) return { ok: false, reason: "supabase_unavailable" };
    const user = await signedInUser(db); if (!user) return { ok: false, reason: "not_authenticated" };
    const safeState = { routes: progress?.routes || {}, badges: progress?.badges || [], events: (progress?.events || []).slice(0, 100), xp: progress?.xp || 0, streak: progress?.streak || 0, lastActiveDay: progress?.lastActiveDay || null, missionDay: progress?.missionDay || null };
    const { error } = await db.from("puxarota_route_progress").upsert({ user_id: user.id, state: safeState, badges: safeState.badges, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function recordActivity(eventType, entityType, entityId, metadata) {
    const db = await getClient(); if (!db) return { ok: false, reason: "supabase_unavailable" };
    const { error } = await db.rpc("record_puxarota_activity", { p_event_type: eventType, p_entity_type: entityType || null, p_entity_id: entityId || null, p_metadata: metadata || {} });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function submitInterest(opportunityId, message) {
    const db = await getClient(); if (!db) return { ok: false, reason: "supabase_unavailable" };
    const user = await signedInUser(db); if (!user) return { ok: false, reason: "not_authenticated" };
    const profile = await profileFor(db, user.id); if (!profile) return { ok: false, reason: "profile_required" };
    const { data: opportunity, error: opportunityError } = await db.from("puxarota_opportunities").select("id").eq("id", opportunityId).eq("status", "approved").maybeSingle();
    if (opportunityError || !opportunity) return { ok: false, reason: "opportunity_unavailable" };
    const { error } = await db.from("puxarota_interests").insert({ profile_id: profile.id, opportunity_id: opportunity.id, requester_name: profile.display_name, requester_whatsapp: profile.whatsapp, requester_type: profile.profile_type, region: profile.region || null, message: message || null, consent_contact: true });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function sendAdminMessage(userId, message, button) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const payload = { account_id: userId, channel: "in_app", status: "pending", message: String(message || "").trim() };
    if (button?.label && button?.url) { payload.button_label = String(button.label).trim(); payload.button_url = String(button.url).trim(); }
    const { error } = await db.from("puxarota_notifications").insert(payload);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function sendAdminBroadcast(message, button) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const text = String(message || "").trim();
    if (!text) return { ok: false, reason: "Escreva a mensagem antes de enviar para todos." };
    const { data: accounts, error: listError } = await db.from("puxarota_accounts").select("user_id").limit(5000);
    if (listError) return { ok: false, reason: listError.message };
    const targets = (accounts || []).map((account) => account.user_id).filter(Boolean);
    if (!targets.length) return { ok: true, count: 0, reason: "Nenhum usuário cadastrado ainda." };
    const payloads = targets.map((userId) => {
      const row = { account_id: userId, channel: "in_app", status: "pending", message: text };
      if (button?.label && button?.url) { row.button_label = String(button.label).trim(); row.button_url = String(button.url).trim(); }
      return row;
    });
    const { error } = await db.from("puxarota_notifications").insert(payloads);
    return error ? { ok: false, reason: error.message } : { ok: true, count: payloads.length };
  }

  async function listMyNotifications() {
    const db = await getClient(); if (!db) return [];
    const user = await signedInUser(db); if (!user) return [];
    const { data, error } = await db.from("puxarota_notifications").select("id,message,created_at,button_label,button_url").eq("account_id", user.id).eq("channel", "in_app").is("read_at", null).order("created_at", { ascending: false }).limit(10);
    return error ? [] : (data || []);
  }

  async function markNotificationRead(id) {
    const db = await getClient(); if (!db) return { ok: false, reason: "supabase_unavailable" };
    const { error } = await db.from("puxarota_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function listNextEvent() {
    const db = await getClient(); if (!db) return null;
    const { data, error } = await db.from("puxarota_events").select("id,subject,description,date,minutes,link,facebook,active").eq("active", true).order("date", { ascending: true }).limit(1);
    if (error || !data || !data.length) return null;
    const event = data[0];
    return {
      subject: event.subject || "Próximo encontro",
      description: event.description || "",
      date: event.date || "",
      minutes: event.minutes || 90,
      link: event.link || "",
      facebook: event.facebook || "https://www.facebook.com/groups/redeintegrativafretes/"
    };
  }

  async function saveNextEvent(event) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const payload = {
      subject: String(event?.subject || "").trim() || "Próximo encontro",
      description: String(event?.description || "").trim(),
      date: event?.date || null,
      minutes: Number(event?.minutes) || 90,
      link: String(event?.link || "").trim() || null,
      facebook: String(event?.facebook || "").trim() || null,
      active: true
    };
    const existing = await db.from("puxarota_events").select("id").eq("active", true).limit(1);
    if (existing.error) return { ok: false, reason: existing.error.message };
    if (existing.data && existing.data.length) {
      const { error } = await db.from("puxarota_events").update(payload).eq("id", existing.data[0].id);
      return error ? { ok: false, reason: error.message } : { ok: true };
    }
    const { error } = await db.from("puxarota_events").insert(payload);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  function urlBase64ToUint8Array(value) {
    const pad = String(value || "").replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(pad);
    const array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
    return array;
  }

  async function setupPushSubscription() {
    const db = await getClient();
    if (!db || !("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, reason: "unsupported" };
    if (!("Notification" in window)) return { ok: false, reason: "unsupported" };
    if (Notification.permission === "denied") return { ok: false, reason: "denied" };
    if (Notification.permission !== "granted") {
      const granted = await Notification.requestPermission();
      if (granted !== "granted") return { ok: false, reason: "denied" };
    }
    const user = await signedInUser(db);
    if (!user) return { ok: false, reason: "not_authenticated" };
    const vapid = CONFIG.vapidPublicKey;
    if (!vapid) return { ok: false, reason: "vapid_missing" };
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) });
    const data = subscription.toJSON();
    const { error } = await db.from("puxarota_push_subscriptions").upsert({ user_id: user.id, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth }, { onConflict: "endpoint" });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function sendPushCampaign(userId, message, button) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const { error } = await db.functions.invoke("send-campaign", { body: { user_id: userId, message, button: button || null } });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function createOpportunity({ company, title, detail, origin, area, vehicles, model, routine, payment }) {
    const db = await getClient(); if (!db) return { ok: false, reason: "Sem conexão com o banco." };
    const { data, error } = await db.rpc("create_puxarota_opportunity", {
      p_company: company || "", p_title: title || "", p_detail: detail || null,
      p_origin: origin || null, p_area: area || null, p_vehicles: vehicles || [],
      p_model: model || null, p_routine: routine || null, p_payment: payment || null
    });
    return error ? { ok: false, reason: error.message } : { ok: true, opportunity: data };
  }

  async function listAdminOpportunities() {
    const result = await checkAdmin(); if (!result.ok) return { ok: false, reason: result.reason, opportunities: [] };
    const db = await getClient();
    const { data, error } = await db.from("puxarota_opportunities").select("*").order("discovered_at", { ascending: false });
    return error ? { ok: false, reason: error.message, opportunities: [] } : { ok: true, opportunities: data || [] };
  }

  async function reviewOpportunity(id, statusValue) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const { error } = await db.from("puxarota_opportunities").update({ status: statusValue, reviewed_at: new Date().toISOString(), reviewed_by: result.user.id }).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function editOpportunity(id, patch) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const allowed = ["company", "title", "source", "source_url", "origin", "area", "vehicles", "model", "routine", "payment", "detail", "confidence", "status"];
    const safe = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
    safe.reviewed_at = new Date().toISOString(); safe.reviewed_by = result.user.id;
    const { error } = await db.from("puxarota_opportunities").update(safe).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function listPublicOpportunities() {
    const db = await getClient(); if (!db) return [];
    const { data, error } = await db.from("puxarota_opportunities").select("id,company,title,source:source,source_url,origin,area,vehicles,model,routine,payment,detail,confidence,discovered_at,last_checked_at").eq("status", "approved");
    if (error) return [];
    return (data || []).map((item) => ({ ...item, url: item.source_url, type: "official_registration", status: "active", verified: true, last_checked_at: item.last_checked_at, discovered_at: item.discovered_at }));
  }

  async function reviewAccount(userId, isApproved) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const { error } = await db.from("puxarota_accounts").update({ is_approved: isApproved }).eq("user_id", userId);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function recordAdminAction(userId, profileId, action, note) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient(); const { error } = await db.from("puxarota_admin_history").insert({ user_id: userId, profile_id: profileId || null, action, note: note || null, performed_by: result.user.id });
    return error ? { ok: false, reason: error.message } : { ok: true };
  }
  async function dismissRegistration(userId) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient(); const { error } = await db.from("puxarota_accounts").update({ admin_dismissed_at: new Date().toISOString() }).eq("user_id", userId);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }
  async function restoreRegistration(userId) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient(); const { error } = await db.from("puxarota_accounts").update({ admin_dismissed_at: null }).eq("user_id", userId);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  window.PuxaRotaAuth = { mountAdmin, logout, userLogin, refreshDashboard, hasSession, saveProfile, submitInterest, listAdminProfiles, reviewProfile, editProfileAdmin, publishProfile, listPublicProfiles, loadRouteProgress, saveRouteProgress, recordActivity, createOpportunity, listAdminOpportunities, reviewOpportunity, editOpportunity, listPublicOpportunities, reviewAccount, recordAdminAction, dismissRegistration, restoreRegistration, sendAdminMessage, sendAdminBroadcast, listMyNotifications, markNotificationRead, listNextEvent, saveNextEvent, setupPushSubscription, sendPushCampaign, touchPresence };
  document.addEventListener("DOMContentLoaded", async () => {
    const db = await getClient();
    await refreshDashboard();
    if (db && !subscription) {
      subscription = db.auth.onAuthStateChange(() => setTimeout(() => { refreshDashboard(); }, 0)).data.subscription;
    }
    q("#admin-login")?.addEventListener("submit", loginAdmin);
    q("#account-login")?.addEventListener("submit", userLogin);
    q("#account-signup")?.addEventListener("click", signupFlow);
    q("#account-recovery")?.addEventListener("click", resetPassword);
    q("#member-logout")?.addEventListener("click", logout);
    q("#member-edit")?.addEventListener("click", () => { const details = q("#profile-details"); if (details) details.hidden = false; const summary = q("#member-summary"); if (summary) summary.hidden = true; q("#profile-data-title") && (q("#profile-data-title").textContent = "Editar dados"); q("#profile-name-new")?.focus(); });
  });
})();
