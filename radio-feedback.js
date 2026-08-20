(function () {
  "use strict";
  const q = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const labels = { theme_suggestion: "Sugestão de tema", problem: "Problema", improvement: "Melhoria", other: "Comentário" };
  const statusLabels = { new: "Nova", reviewing: "Em análise", planned: "Planejada", resolved: "Resolvida", archived: "Arquivada" };
  const state = { auth: null, adminMessages: [], ownMessages: [], replyItem: null };
  async function db() { return window.PuxaRotaAuth?.getClient?.(); }
  function isAdmin() { return Boolean(state.auth?.account?.account_type === "admin" && state.auth.account.is_approved === true); }
  function setStatus(text, error = false) { const el = q("#message-status"); if (el) { el.textContent = text; el.classList.toggle("error", error); } }
  function dateLabel(value) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

  function openMessage(kind) {
    const form = q("#user-message-form");
    form.reset();
    q("#message-type").value = kind === "theme" ? "theme_suggestion" : "problem";
    q("#message-subject-row").hidden = kind !== "theme";
    q("#message-dialog-title").textContent = kind === "theme" ? "Sugerir tema" : "Enviar feedback";
    q("#message-context").value = kind === "theme" ? "radio" : "app";
    q("#message-contact-row").hidden = Boolean(state.auth?.user);
    setStatus(kind === "theme" ? "Conte qual assunto você gostaria de ouvir" : "Sua mensagem chegará à administração");
    q("#user-message-dialog").showModal();
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (q("#message-website").value) return;
    const last = Number(localStorage.getItem("puxarota-last-message") || 0);
    if (Date.now() - last < 60000) return setStatus("Aguarde um minuto antes de enviar outra mensagem", true);
    const client = await db();
    if (!client) return setStatus("A conexão está indisponível", true);
    const button = event.submitter;
    button.disabled = true;
    button.textContent = "Enviando";
    const payload = {
      user_id: state.auth?.user?.id || null,
      message_type: q("#message-type").value,
      subject: q("#message-subject").value.trim() || null,
      message: q("#message-body").value.trim(),
      contact: state.auth?.user ? null : q("#message-contact").value.trim() || null,
      context: q("#message-context").value,
      status: "new"
    };
    const { error } = await client.from("puxarota_user_messages").insert(payload);
    button.disabled = false;
    button.textContent = "Enviar mensagem";
    if (error) return setStatus(error.message.includes("puxarota_user_messages") ? "A caixa de mensagens ainda precisa ser ativada" : "Não foi possível enviar", true);
    localStorage.setItem("puxarota-last-message", String(Date.now()));
    setStatus("Mensagem enviada");
    setTimeout(() => q("#user-message-dialog").close(), 700);
    if (state.auth?.user) await loadOwn();
    if (isAdmin()) await loadAdmin();
  }

  async function loadOwn() {
    state.ownMessages = [];
    if (!state.auth?.user) return renderOwn();
    const client = await db();
    const { data } = await client.from("puxarota_user_messages").select("id,message_type,subject,message,status,admin_reply,replied_at,created_at").eq("user_id", state.auth.user.id).order("created_at", { ascending: false }).limit(20);
    state.ownMessages = data || [];
    renderOwn();
  }
  function renderOwn() {
    const root = q("#my-messages");
    if (!root) return;
    if (!state.auth?.user) { root.hidden = true; return; }
    root.hidden = false;
    root.innerHTML = state.ownMessages.length ? `<h3>Minhas mensagens</h3>${state.ownMessages.map((item) => `<article><small>${labels[item.message_type]} · ${statusLabels[item.status]}</small><b>${esc(item.subject || item.message)}</b>${item.admin_reply ? `<div><span>Resposta do PuxaRota</span><p>${esc(item.admin_reply)}</p></div>` : ""}</article>`).join("")}` : "";
  }

  async function loadAdmin() {
    if (!isAdmin()) return;
    const client = await db();
    const { data, error } = await client.from("puxarota_user_messages").select("*").order("created_at", { ascending: false });
    if (error) { state.adminMessages = []; return; }
    state.adminMessages = data || [];
    renderAdmin();
  }
  function renderAdmin() {
    const root = q("#admin-list");
    if (!root || !isAdmin()) return;
    if (!state.adminMessages.length) {
      root.innerHTML = '<article class="admin-item"><div><h3>Nenhuma mensagem recebida</h3><p>Sugestões e feedbacks aparecerão aqui</p></div></article>';
      return;
    }
    root.innerHTML = `<div class="radio-admin-head"><div><span class="eyebrow">CAIXA DE ENTRADA</span><h2>Mensagens dos usuários</h2><p>${state.adminMessages.filter((item) => item.status === "new").length} nova(s)</p></div></div><div class="radio-admin-list">${state.adminMessages.map((item) => `<article class="admin-item inbox-admin-item"><div><div class="radio-admin-labels"><span>${labels[item.message_type]}</span><span>${statusLabels[item.status]}</span></div><h3>${esc(item.subject || labels[item.message_type])}</h3><p>${esc(item.message)}</p><small>${dateLabel(item.created_at)}${item.contact ? ` · ${esc(item.contact)}` : ""}</small>${item.admin_reply ? `<div class="admin-reply-preview"><b>Sua resposta</b><p>${esc(item.admin_reply)}</p></div>` : ""}</div><div class="admin-actions"><button data-message-reply="${item.id}">${item.admin_reply ? "Editar resposta" : "Responder"}</button></div></article>`).join("")}</div>`;
  }
  function openReply(id) {
    const item = state.adminMessages.find((entry) => entry.id === id);
    if (!item) return;
    state.replyItem = item;
    q("#reply-message-copy").textContent = item.message;
    q("#reply-body").value = item.admin_reply || "";
    q("#reply-status").value = item.status === "new" ? "reviewing" : item.status;
    q("#reply-dialog").showModal();
  }
  async function submitReply(event) {
    event.preventDefault();
    if (!state.replyItem) return;
    const client = await db();
    const reply = q("#reply-body").value.trim();
    const status = q("#reply-status").value;
    const { error } = await client.from("puxarota_user_messages").update({ status, admin_reply: reply || null, replied_at: reply ? new Date().toISOString() : null, replied_by: reply ? state.auth.user.id : null, updated_at: new Date().toISOString() }).eq("id", state.replyItem.id);
    if (error) { q("#reply-form-status").textContent = "Não foi possível salvar"; return; }
    if (reply && state.replyItem.user_id) {
      await client.from("puxarota_notifications").insert({ account_id: state.replyItem.user_id, channel: "in_app", status: "sent", message: "O PuxaRota respondeu sua mensagem: " + reply, sent_at: new Date().toISOString() });
    }
    q("#reply-dialog").close();
    await loadAdmin();
  }

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-message-open]");
    const contributionOpen = event.target.closest("[data-contribution-open]");
    const contribution = event.target.closest("[data-contribution]");
    const reply = event.target.closest("[data-message-reply]");
    if (opener) openMessage(opener.dataset.messageOpen);
    if (contributionOpen) q("#contribution-dialog")?.showModal();
    if (contribution) {
      q("#contribution-dialog")?.close();
      if (contribution.dataset.contribution === "story") window.PuxaRotaStories?.openSubmit?.();
      else openMessage(contribution.dataset.contribution === "theme" ? "theme" : "feedback");
    }
    if (reply) openReply(reply.dataset.messageReply);
  });
  document.addEventListener("DOMContentLoaded", () => {
    q("#user-message-form")?.addEventListener("submit", submitMessage);
    q("#message-type")?.addEventListener("change", () => { q("#message-subject-row").hidden = q("#message-type").value !== "theme_suggestion"; });
    q("#message-close")?.addEventListener("click", () => q("#user-message-dialog").close());
    q("#contribution-close")?.addEventListener("click", () => q("#contribution-dialog").close());
    q("#reply-form")?.addEventListener("submit", submitReply);
    q("#reply-close")?.addEventListener("click", () => q("#reply-dialog").close());
  });
  window.addEventListener("puxarota:auth", async (event) => {
    state.auth = event.detail?.session ? event.detail : null;
    await loadOwn();
    if (isAdmin()) await loadAdmin();
  });
  window.PuxaRotaInbox = { loadAdmin, renderAdmin };
})();
