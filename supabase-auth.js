(function () {
  "use strict";
  const CONFIG = window.PUXAROTA_SUPABASE || {};
  let client = null;
  let authorized = false;
  function status(text, error) {
    const el = document.querySelector("#admin-auth-status");
    if (el) { el.textContent = text; el.classList.toggle("error", Boolean(error)); }
  }
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
    client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
    return client;
  }
  async function checkAdmin() {
    const db = await getClient();
    if (!db) return { ok: false, reason: "Configure PUXAROTA_SUPABASE antes de usar a gestão." };
    const { data: sessionData } = await db.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return { ok: false, reason: "Entre com sua conta administrativa." };
    const { data, error } = await db.from("puxarota_accounts").select("account_type,is_approved").eq("user_id", user.id).maybeSingle();
    if (error || !data || data.account_type !== "admin" || data.is_approved !== true) {
      await db.auth.signOut();
      return { ok: false, reason: "Esta conta não tem permissão de administrador." };
    }
    authorized = true;
    return { ok: true, user };
  }
  async function mountAdmin(options) {
    const result = await checkAdmin();
    const auth = document.querySelector("#admin-auth");
    const panel = document.querySelector("#admin-panel");
    if (result.ok) {
      if (auth) auth.hidden = true;
      if (panel) panel.hidden = false;
      const details = document.querySelector("#profile-details"); if (details) details.hidden = false;
      const session = document.querySelector("#admin-session");
      if (session) session.textContent = "Sessão administrativa ativa: " + result.user.email;
      status("Acesso autorizado.", false);
      options?.onAuthorized?.(result.user);
      return;
    }
    if (auth) auth.hidden = false;
    if (panel) panel.hidden = true;
    const details = document.querySelector("#profile-details"); if (details) details.hidden = true;
    status(result.reason, true);
  }
  async function login(event) {
    event.preventDefault();
    const db = await getClient();
    if (!db) { status("Configure a conexão Supabase antes do login.", true); return; }
    status("Validando acesso…", false);
    const { error } = await db.auth.signInWithPassword({ email: document.querySelector("#admin-email").value.trim(), password: document.querySelector("#admin-password").value });
    if (error) { status("E-mail ou senha inválidos.", true); return; }
    await mountAdmin({ onAuthorized: () => { document.querySelector("#admin-panel").hidden = false; } });
  }
  async function logout() { const db = await getClient(); if (db) await db.auth.signOut(); authorized = false; const auth=document.querySelector("#admin-auth"); const panel=document.querySelector("#admin-panel"); if(auth) auth.hidden=false; if(panel) panel.hidden=true; const box=document.querySelector("#account-box"); if(box) box.hidden=false; const details=document.querySelector("#profile-details"); if(details) details.hidden=true; status("Sessão encerrada.", false); }
  async function userLogin(event) {
    event.preventDefault();
    const db = await getClient();
    const message = document.querySelector("#account-status");
    if (!db) { if (message) message.textContent = "Configure o Supabase antes de entrar."; return; }
    const { error } = await db.auth.signInWithPassword({ email: document.querySelector("#account-email").value.trim(), password: document.querySelector("#account-password").value });
    if (message) message.textContent = error ? "E-mail ou senha inválidos." : "Acesso realizado. Abrindo seu perfil.";
    if (!error) {
      const { data: account } = await db.from("puxarota_accounts").select("account_type").eq("user_id", (await db.auth.getUser()).data.user.id).maybeSingle();
      const kind = account?.account_type === "company" ? "Transportadora" : account?.account_type === "helper" ? "Ajudante" : "Motorista";
      const details = document.querySelector("#profile-details"); if (details) details.hidden = false;
      const role = document.querySelector("#onboarding-role"); if (role) role.hidden = true;
      window.dispatchEvent(new CustomEvent("puxarota:auth", { detail: { session: true, kind } }));
    }
  }
  let signupStarted = false;
  async function signupFlow() {
    const role = document.querySelector("#onboarding-role");
    const button = document.querySelector("#account-signup");
    if (!signupStarted) {
      signupStarted = true;
      if (role) role.hidden = false;
      if (button) button.textContent = "Confirmar cadastro";
      const message = document.querySelector("#account-status"); if (message) message.textContent = "Agora escolha o seu tipo de perfil.";
      return;
    }
    await userSignup();
  }
  async function userSignup() {
    const db = await getClient();
    const message = document.querySelector("#account-status");
    if (!db) { if (message) message.textContent = "Configure o Supabase antes de criar a conta."; return; }
    const email = document.querySelector("#account-email").value.trim();
    const password = document.querySelector("#account-password").value;
    if (!email || password.length < 8) { if (message) message.textContent = "Informe e-mail e senha com pelo menos 8 caracteres."; return; }
    const selected = document.querySelector(".onboarding-role-choice.active")?.dataset.kind || "Motorista";
    const accountType = selected === "Transportadora" ? "company" : selected === "Ajudante" ? "helper" : "driver";
    const { error } = await db.auth.signUp({ email, password, options: { data: { account_type: accountType, display_name: document.querySelector("#profile-name-new")?.value?.trim() || "" } } });
    if (message) message.textContent = error ? error.message : "Conta criada. Confira seu e-mail para confirmar o acesso.";
  }
  function updateProfileNav(session) {
    const label = document.querySelector("#profile-nav-label");
    if (label) label.textContent = session ? "Perfil" : "Entrar / cadastrar";
  }
  async function syncAuthState() {
    const db = await getClient();
    if (!db) { updateProfileNav(null); return; }
    const { data } = await db.auth.getSession();
    updateProfileNav(data?.session || null);
    db.auth.onAuthStateChange((_event, session) => {
      updateProfileNav(session);
      window.dispatchEvent(new CustomEvent("puxarota:auth", { detail: { session } }));
    });
  }
  async function hasSession() {
    const db = await getClient();
    if (!db) return false;
    const { data } = await db.auth.getSession();
    return Boolean(data?.session);
  }
  window.PuxaRotaAuth = { mountAdmin, logout, userLogin, userSignup, syncAuthState, hasSession };
  document.addEventListener("DOMContentLoaded", () => {
    syncAuthState();
    const form=document.querySelector("#admin-login"); if(form) form.addEventListener("submit", login);
    const userForm=document.querySelector("#account-login"); if(userForm) userForm.addEventListener("submit", userLogin);
    const signup=document.querySelector("#account-signup"); if(signup) signup.addEventListener("click", signupFlow);
  });
})();
