(function () {
  "use strict";
  const q = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const state = { auth: null, publicStories: [], ownStories: [], adminStories: [], reports: [], reviewItem: null, reportItem: null };
  const statusLabels = { pending: "Aguardando análise", approved: "Publicado", rejected: "Não aprovado", archived: "Retirado" };

  async function db() { return window.PuxaRotaAuth?.getClient?.(); }
  function isAdmin() { return Boolean(state.auth?.account?.account_type === "admin" && state.auth.account.is_approved === true); }
  function setStatus(selector, message, error = false) { const element = q(selector); if (element) { element.textContent = message; element.classList.toggle("error", error); } }
  function excerpt(value, limit = 180) { const text = String(value || "").replace(/\s+/g, " ").trim(); return text.length > limit ? text.slice(0, limit).trimEnd() + "…" : text; }
  function paragraphs(value) { return String(value || "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => `<p>${esc(part).replace(/\n/g, "<br>")}</p>`).join(""); }

  async function loadPublic() {
    const client = await db(); if (!client) return;
    const { data } = await client.from("puxarota_community_stories").select("id,title,author_name,body,reviewed_at,created_at").eq("status", "approved").eq("public_visible", true).order("reviewed_at", { ascending: false });
    state.publicStories = data || [];
    renderCommunity();
  }
  async function loadOwn() {
    state.ownStories = [];
    if (!state.auth?.user) return renderCommunity();
    const client = await db();
    const { data } = await client.from("puxarota_community_stories").select("id,title,author_name,body,status,public_visible,admin_note,created_at").eq("user_id", state.auth.user.id).order("created_at", { ascending: false });
    state.ownStories = data || [];
    renderCommunity();
  }
  function communityCard(item) {
    return `<article class="community-story-card"><span class="eyebrow">CONTO DA COMUNIDADE</span><h3>${esc(item.title)}</h3><p>${esc(excerpt(item.body))}</p><small>Por ${esc(item.author_name)}</small><div class="radio-card-actions"><button data-community-read="${item.id}">Ler conto</button><button class="ghost" data-story-report="${item.id}">Denunciar</button></div></article>`;
  }
  function renderCommunity() {
    const root = q("#radio-content"); if (!root) return;
    q("#community-stories-section", root)?.remove();
    const section = document.createElement("section");
    section.id = "community-stories-section";
    section.className = "radio-block community-stories-section";
    const own = state.auth?.user && state.ownStories.length ? `<div class="my-story-list"><h3>Meus contos</h3>${state.ownStories.map((item) => `<article><div><b>${esc(item.title)}</b><small>${statusLabels[item.status] || item.status}</small>${item.admin_note ? `<p>${esc(item.admin_note)}</p>` : ""}</div>${item.status !== "archived" ? `<button class="ghost" data-story-withdraw="${item.id}">Retirar</button>` : ""}</article>`).join("")}</div>` : "";
    section.innerHTML = `<header class="section-title"><div><span class="eyebrow">CONTOS DA COMUNIDADE</span><h2>Histórias escritas por quem vive a estrada</h2><p>Todo conto passa por análise antes de aparecer publicamente</p></div></header>${state.publicStories.length ? `<div class="community-story-grid">${state.publicStories.map(communityCard).join("")}</div>` : '<article class="community-story-empty"><h3>O primeiro conto pode ser o seu</h3><p>Use o botão Enviar algo no início da Rádio para participar</p></article>'}${own}`;
    root.appendChild(section);
  }

  function openReader(title, author, body, communityId) {
    q("#story-reader-title").textContent = title;
    q("#story-reader-author").textContent = author || "Rádio PuxaRota";
    q("#story-reader-body").innerHTML = paragraphs(body);
    const report = q("#story-reader-report");
    report.hidden = !communityId;
    report.dataset.storyReport = communityId || "";
    q("#story-reader-dialog").showModal();
  }
  async function readOfficial(id) {
    const client = await db();
    setStatus("#radio-status", "Abrindo o conto");
    const { data, error } = await client.rpc("get_puxarota_written_story", { p_audio_id: id });
    if (error || !data?.length) { q("#radio-access-dialog")?.showModal(); return; }
    openReader(data[0].title, "Rádio PuxaRota", data[0].body, null);
  }
  function readCommunity(id) {
    const item = [...state.publicStories, ...state.adminStories].find((story) => story.id === id);
    if (item) openReader(item.title, item.author_name, item.body, state.publicStories.some((story) => story.id === id) ? id : null);
  }

  function openSubmit() {
    if (!state.auth?.user) { document.querySelector('[data-go="perfil"]')?.click(); return setStatus("#radio-status", "Entre para enviar seu conto", true); }
    const form = q("#community-story-form"); form.reset();
    q("#community-author").value = state.auth.profile?.display_name || state.auth.account?.display_name || state.auth.user.email?.split("@")[0] || "";
    setStatus("#community-story-status", "Seu conto será analisado antes da publicação");
    q("#community-story-dialog").showModal();
  }
  async function submitStory(event) {
    event.preventDefault();
    const client = await db(); if (!client || !state.auth?.user) return;
    const button = event.submitter; button.disabled = true; button.textContent = "Enviando";
    const payload = { user_id: state.auth.user.id, title: q("#community-title").value.trim(), author_name: q("#community-author").value.trim(), body: q("#community-body").value.trim(), consent_public: q("#community-consent").checked, status: "pending", public_visible: false };
    const { error } = await client.from("puxarota_community_stories").insert(payload);
    button.disabled = false; button.textContent = "Enviar para análise";
    if (error) return setStatus("#community-story-status", error.message || "Não foi possível enviar", true);
    setStatus("#community-story-status", "Conto enviado para análise");
    await loadOwn();
    setTimeout(() => q("#community-story-dialog").close(), 700);
  }
  async function withdrawStory(id) {
    if (!confirm("Retirar este conto da análise ou publicação?")) return;
    const client = await db(); const { data, error } = await client.rpc("withdraw_community_story", { p_story_id: id });
    if (error || !data) return setStatus("#radio-status", "Não foi possível retirar o conto", true);
    await Promise.all([loadOwn(), loadPublic()]);
  }

  function openReport(id) {
    if (!state.auth?.user) { document.querySelector('[data-go="perfil"]')?.click(); return setStatus("#radio-status", "Entre para denunciar um conteúdo", true); }
    state.reportItem = id; q("#story-report-form").reset(); setStatus("#story-report-status", "A denúncia será analisada pela administração"); q("#story-report-dialog").showModal();
  }
  async function submitReport(event) {
    event.preventDefault(); const client = await db();
    const { error } = await client.from("puxarota_story_reports").insert({ story_id: state.reportItem, user_id: state.auth.user.id, reason: q("#story-report-reason").value.trim(), status: "new" });
    if (error) return setStatus("#story-report-status", error.code === "23505" ? "Você já denunciou este conto" : "Não foi possível enviar", true);
    setStatus("#story-report-status", "Denúncia enviada"); setTimeout(() => q("#story-report-dialog").close(), 600);
  }

  async function loadAdmin() {
    if (!isAdmin()) return;
    const client = await db();
    const [stories, reports] = await Promise.all([client.from("puxarota_community_stories").select("*").order("created_at", { ascending: false }), client.from("puxarota_story_reports").select("id,story_id,reason,status,created_at").order("created_at", { ascending: false })]);
    state.adminStories = stories.data || []; state.reports = reports.data || [];
    renderAdmin();
  }
  function renderAdmin() {
    const root = q("#admin-list"); if (!root || !isAdmin()) return;
    const pending = state.adminStories.filter((item) => item.status === "pending").length;
    root.innerHTML = `<div class="radio-admin-head"><div><span class="eyebrow">CONTOS DA COMUNIDADE</span><h2>Revisão e publicação</h2><p>${pending} aguardando análise · ${state.reports.filter((item) => item.status === "new").length} denúncia(s)</p></div></div>${state.adminStories.length ? `<div class="radio-admin-list">${state.adminStories.map((item) => { const reports = state.reports.filter((report) => report.story_id === item.id && report.status === "new").length; return `<article class="admin-item community-admin-item"><div><div class="radio-admin-labels"><span>${statusLabels[item.status]}</span>${reports ? `<span>${reports} denúncia(s)</span>` : ""}</div><h3>${esc(item.title)}</h3><p>Por ${esc(item.author_name)} · ${esc(excerpt(item.body, 120))}</p></div><div class="admin-actions"><button data-story-review="${item.id}">Revisar</button></div></article>`; }).join("")}</div>` : '<article class="admin-item"><div><h3>Nenhum conto enviado</h3><p>Os envios da comunidade aparecerão aqui</p></div></article>'}`;
  }
  function openReview(id) {
    const item = state.adminStories.find((story) => story.id === id); if (!item) return;
    state.reviewItem = item; q("#story-review-title").value = item.title; q("#story-review-author").value = item.author_name; q("#story-review-body").value = item.body; q("#story-review-status").value = item.status; q("#story-review-note").value = item.admin_note || "";
    const reports = state.reports.filter((report) => report.story_id === id && report.status === "new"); q("#story-review-reports").innerHTML = reports.length ? `<h3>Denúncias</h3>${reports.map((report) => `<p>${esc(report.reason)}</p>`).join("")}` : "";
    q("#story-review-dialog").showModal();
  }
  async function submitReview(event) {
    event.preventDefault(); const client = await db(); const status = q("#story-review-status").value;
    const payload = { title: q("#story-review-title").value.trim(), author_name: q("#story-review-author").value.trim(), body: q("#story-review-body").value.trim(), status, public_visible: status === "approved", admin_note: q("#story-review-note").value.trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: state.auth.user.id, updated_at: new Date().toISOString() };
    const { error } = await client.from("puxarota_community_stories").update(payload).eq("id", state.reviewItem.id);
    if (error) return setStatus("#story-review-feedback", "Não foi possível salvar", true);
    await client.from("puxarota_story_reports").update({ status: "reviewed" }).eq("story_id", state.reviewItem.id).eq("status", "new");
    q("#story-review-dialog").close(); await Promise.all([loadAdmin(), loadPublic()]);
  }

  async function loadOfficialTextForEdit(id) {
    if (!isAdmin()) return; const client = await db();
    const { data } = await client.from("puxarota_written_stories").select("body").eq("audio_id", id).maybeSingle();
    q("#radio-written-story").value = data?.body || "";
  }

  document.addEventListener("click", (event) => {
    const official = event.target.closest("[data-official-story]"); const community = event.target.closest("[data-community-read]"); const submit = event.target.closest("[data-story-submit]"); const withdraw = event.target.closest("[data-story-withdraw]"); const report = event.target.closest("[data-story-report]"); const review = event.target.closest("[data-story-review]"); const edit = event.target.closest("[data-radio-edit]");
    if (official) readOfficial(official.dataset.officialStory); if (community) readCommunity(community.dataset.communityRead); if (submit) openSubmit(); if (withdraw) withdrawStory(withdraw.dataset.storyWithdraw); if (report) openReport(report.dataset.storyReport); if (review) openReview(review.dataset.storyReview); if (edit) setTimeout(() => loadOfficialTextForEdit(edit.dataset.radioEdit), 0);
  });
  document.addEventListener("DOMContentLoaded", () => {
    q("#community-story-form")?.addEventListener("submit", submitStory); q("#community-story-close")?.addEventListener("click", () => q("#community-story-dialog").close()); q("#story-reader-close")?.addEventListener("click", () => q("#story-reader-dialog").close()); q("#story-report-form")?.addEventListener("submit", submitReport); q("#story-report-close")?.addEventListener("click", () => q("#story-report-dialog").close()); q("#story-review-form")?.addEventListener("submit", submitReview); q("#story-review-close")?.addEventListener("click", () => q("#story-review-dialog").close());
    q("#community-body")?.addEventListener("input", (event) => { q("#community-count").textContent = `${event.target.value.length} / 30000`; });
    loadPublic();
  });
  window.addEventListener("puxarota:radio-rendered", renderCommunity);
  window.addEventListener("puxarota:auth", async (event) => { state.auth = event.detail?.session ? event.detail : null; await Promise.all([loadOwn(), loadPublic()]); if (isAdmin()) await loadAdmin(); });
  window.PuxaRotaStories = { loadAdmin, renderAdmin, openSubmit };
})();
