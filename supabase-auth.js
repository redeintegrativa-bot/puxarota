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
    if (details) details.hidden = false;
    if (intro) intro.hidden = true;
    if (steps) steps.hidden = true;
    if (admin) admin.hidden = !(account?.account_type === "admin" && account.is_approved === true);
    const name = profile?.display_name || account?.display_name || user.email?.split("@")[0] || "Seu perfil";
    const role = accountLabel[account?.account_type] || "Membro";
    const state = profile ? (profileState[profile.status] || "Seu perfil está salvo.") : "Complete seu perfil para entrar na análise.";
    setText("#member-name", name);
    setText("#member-email", user.email || "");
    setText("#member-state", role + " · " + state);
    setText("#profile-data-title", profile ? "Seu perfil" : "Complete seu perfil");
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

  async function loginAdmin(event) {
    event.preventDefault();
    const db = await getClient();
    if (!db) return status("Configure a conexão Supabase antes do login.", true);
    status("Validando acesso…");
    const { error } = await db.auth.signInWithPassword({ email: q("#admin-email").value.trim(), password: q("#admin-password").value });
    if (error) return status("E-mail ou senha inválidos.", true);
    await refreshDashboard();
    await mountAdmin();
  }

  async function userLogin(event) {
    event.preventDefault();
    const db = await getClient(); const message = q("#account-status");
    if (!db) { if (message) message.textContent = "A conexão segura está indisponível. Tente novamente."; return; }
    if (message) message.textContent = "Entrando…";
    const { error } = await db.auth.signInWithPassword({ email: q("#account-email").value.trim(), password: q("#account-password").value });
    if (error) { if (message) message.textContent = "E-mail ou senha inválidos."; return; }
    const state = await refreshDashboard();
    if (state.account?.account_type === "admin" && state.account.is_approved) await mountAdmin();
  }

  let signupStarted = false;
  async function signupFlow() {
    const role = q("#onboarding-role"); const button = q("#account-signup"); const message = q("#account-status");
    if (!signupStarted) {
      signupStarted = true;
      if (role) role.hidden = false;
      if (button) button.textContent = "Confirmar cadastro";
      if (message) message.textContent = "Escolha o tipo de perfil e confirme seu cadastro.";
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
    if (data.session) await refreshDashboard();
    else if (message) message.textContent = "Conta criada. Confirme o e-mail e volte para entrar.";
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

  async function saveProfile(profile) {
    const db = await getClient();
    if (!db) return { ok: false, reason: "supabase_unavailable" };
    const user = await signedInUser(db);
    if (!user) return { ok: false, reason: "not_authenticated" };
    const current = await profileFor(db, user.id);
    const profileType = profile.kind === "Transportadora" ? "company" : profile.kind === "Ajudante" ? "helper" : "driver";
    const payload = { user_id: user.id, profile_type: profileType, display_name: profile.name || user.email || "Perfil PuxaRota", whatsapp: profile.whatsapp, region: profile.region || null, postal_code: profile.postalCode || null, vehicle: profile.vehicle || null, license_category: profile.license || null, cargo_preference: profile.cargo || null, availability: profile.availability || null, consent_data: profile.consentData === true, consent_data_at: new Date().toISOString(), privacy_version: "2026-08-14" };
    if (!current) Object.assign(payload, { consent_public: false, public_visible: false, status: "pending", source: "self_signup" });
    const { data, error } = await db.from("puxarota_profiles").upsert(payload, { onConflict: "user_id" }).select("id,status").single();
    if (error) return { ok: false, reason: error.message };
    await refreshDashboard();
    return { ok: true, data };
  }

  async function listAdminProfiles() {
    const result = await checkAdmin(); if (!result.ok) return { ok: false, reason: result.reason, profiles: [], accounts: [] };
    const db = await getClient();
    const [profilesResult, accountsResult] = await Promise.all([
      db.from("puxarota_profiles").select("id,user_id,profile_type,display_name,whatsapp,region,vehicle,license_category,status,contact_release,created_at").order("created_at", { ascending: false }),
      db.from("puxarota_accounts").select("user_id,account_type,display_name,is_approved,created_at").order("created_at", { ascending: false })
    ]);
    const error = profilesResult.error || accountsResult.error;
    return error ? { ok: false, reason: error.message, profiles: [], accounts: [] } : { ok: true, profiles: profilesResult.data || [], accounts: accountsResult.data || [] };
  }

  async function reviewProfile(id, statusValue, contactRelease) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient(); const patch = { status: statusValue };
    if (contactRelease) patch.contact_release = contactRelease;
    const { error } = await db.from("puxarota_profiles").update(patch).eq("id", id);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function reviewAccount(userId, isApproved) {
    const result = await checkAdmin(); if (!result.ok) return result;
    const db = await getClient();
    const { error } = await db.from("puxarota_accounts").update({ is_approved: isApproved }).eq("user_id", userId);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  window.PuxaRotaAuth = { mountAdmin, logout, userLogin, refreshDashboard, hasSession, saveProfile, listAdminProfiles, reviewProfile, reviewAccount };
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
    q("#member-edit")?.addEventListener("click", () => q("#profile-name-new")?.focus());
  });
})();
