(function () {
  "use strict";

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const BUCKET = "puxarota-radio";
  const kindLabels = { daily: "Hoje", story: "Histórias da Estrada", road_life: "Dia a Dia da Estrada" };
  const categoryLabels = { bulletin: "Boletim", route_tip: "Dica de rota", health: "Saúde", rights: "Direitos", market: "Mercado", real_stories: "Histórias reais" };
  const state = { auth: null, items: [], adminItems: [], saves: new Set(), current: null, urls: new Map(), formItem: null, duration: 0, progressTimer: 0, activeView: location.hash.slice(1) || "hoje" };

  function api() { return window.PuxaRotaAuth; }
  async function db() { return api()?.getClient ? api().getClient() : null; }
  function isAdmin() { return Boolean(state.auth?.account?.account_type === "admin" && state.auth.account.is_approved === true); }
  function isSubscriber() { return ["trial", "active"].includes(state.auth?.account?.license_status) || state.auth?.account?.subscription_status === "active"; }
  function canPlay(item) { return item?.access_level === "free" || isSubscriber(); }
  function durationLabel(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
  }
  function dateLabel(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  }
  function setStatus(selector, message, error = false) {
    const element = q(selector);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", error);
  }
  function typeMeta(item) {
    if (item.kind === "story") return `Temporada ${item.season_number} · Episódio ${item.episode_number}`;
    return categoryLabels[item.category] || kindLabels[item.kind] || "Rádio PuxaRota";
  }
  function placeholderCover(item) {
    return `<div class="radio-cover-placeholder"><img src="rupi-mascot.png" alt=""><span>${esc(kindLabels[item.kind] || "Rádio")}</span></div>`;
  }

  async function signedUrl(path, expiresIn = 3600) {
    if (!path) return "";
    const cached = state.urls.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;
    const client = await db();
    if (!client) return "";
    const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, expiresIn);
    if (error) return "";
    state.urls.set(path, { url: data.signedUrl, expires: Date.now() + Math.max(60000, (expiresIn - 60) * 1000) });
    return data.signedUrl;
  }

  function googleDriveAudioUrl(value) {
    const url = String(value || "").trim();
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
  }
  async function playbackUrl(item) {
    let sourceType = item.source_type;
    let sourceValue = item.source_value;
    if (!sourceValue) {
      const client = await db();
      const { data, error } = await client.rpc("get_puxarota_audio_playback", { p_audio_id: item.id });
      if (error || !data?.length) return "";
      sourceType = data[0].source_type;
      sourceValue = data[0].source_value;
    }
    return sourceType === "storage" ? signedUrl(sourceValue, 7200) : googleDriveAudioUrl(sourceValue);
  }

  async function hydrateCovers(items, root) {
    await Promise.all(items.map(async (item) => {
      if (!item.cover_path) return;
      const image = q(`[data-radio-cover="${item.id}"]`, root || document);
      if (!image) return;
      const url = await signedUrl(item.cover_path);
      if (url) image.src = url;
    }));
  }

  function itemCard(item, compact = false) {
    const locked = !canPlay(item);
    const saved = state.saves.has(item.id);
    const cover = item.cover_path
      ? `<img data-radio-cover="${item.id}" alt="Capa de ${esc(item.title)}">`
      : placeholderCover(item);
    return `<article class="radio-card${compact ? " compact" : ""}" data-radio-id="${item.id}">
      <div class="radio-card-cover">${cover}<span class="radio-access ${item.access_level}">${item.access_level === "free" ? "Grátis" : "Assinante"}</span></div>
      <div class="radio-card-copy">
        <small>${esc(typeMeta(item))}${item.duration_seconds ? ` · ${durationLabel(item.duration_seconds)}` : ""}</small>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.teaser)}</p>
        ${locked ? '<div class="radio-lock">Disponível para assinantes</div>' : ""}
        <div class="radio-card-actions">
          <button data-radio-play="${item.id}" ${locked ? 'aria-label="Conhecer assinatura"' : ""}>${locked ? "Ver acesso" : "Ouvir"}</button>
          ${item.has_written_story ? `<button class="ghost" data-official-story="${item.id}">Ler conto</button>` : ""}
          <button class="ghost" data-radio-save="${item.id}" aria-pressed="${saved}">${saved ? "Salvo" : "Salvar"}</button>
        </div>
      </div>
    </article>`;
  }

  function renderEmpty() {
    const root = q("#radio-content");
    if (!root) return;
    root.innerHTML = `<article class="radio-empty">
      <img src="rupi-mascot.png" alt="Rupi na Rádio PuxaRota">
      <div><span class="eyebrow">RÁDIO PUXAROTA</span><h2>Os primeiros áudios estão a caminho</h2><p>Quando um conteúdo for publicado pela área administrativa, ele aparecerá aqui automaticamente</p></div>
    </article>`;
    window.dispatchEvent(new CustomEvent("puxarota:radio-rendered"));
  }

  function renderPublic() {
    const root = q("#radio-content");
    if (!root) return;
    if (!state.items.length) return renderEmpty();
    const featured = state.items.find((item) => item.featured_today) || state.items[0];
    const stories = state.items.filter((item) => item.kind === "story");
    const daily = state.items.filter((item) => item.kind === "road_life" || item.kind === "daily");
    root.innerHTML = `<section class="radio-featured">
      <div class="radio-featured-cover">${featured.cover_path ? `<img data-radio-cover="${featured.id}" alt="Capa de ${esc(featured.title)}">` : placeholderCover(featured)}</div>
      <div><span class="eyebrow">NO AR HOJE</span><small>${esc(typeMeta(featured))}${featured.duration_seconds ? ` · ${durationLabel(featured.duration_seconds)}` : ""}</small><h2>${esc(featured.title)}</h2><p>${esc(featured.teaser)}</p>
      <div class="radio-card-actions"><button data-radio-play="${featured.id}">${canPlay(featured) ? "Ouvir agora" : "Ver acesso"}</button>${featured.has_written_story ? `<button class="ghost" data-official-story="${featured.id}">Ler conto</button>` : ""}<button class="ghost" data-radio-save="${featured.id}">${state.saves.has(featured.id) ? "Salvo" : "Salvar"}</button></div></div>
    </section>
    <div class="radio-filter" role="group" aria-label="Filtrar conteúdos"><button class="active" data-radio-filter="all">Todos</button><button data-radio-filter="story">Histórias</button><button data-radio-filter="road_life">Dia a dia</button><button data-radio-filter="saved">Salvos</button></div>
    <section class="radio-block" data-radio-group="story" ${stories.length ? "" : "hidden"}><header class="section-title"><div><span class="eyebrow">HISTÓRIAS DA ESTRADA</span><h2>Temporadas para acompanhar</h2></div></header><div class="radio-grid">${stories.map((item) => itemCard(item)).join("")}</div></section>
    <section class="radio-block" data-radio-group="road_life" ${daily.length ? "" : "hidden"}><header class="section-title"><div><span class="eyebrow">DIA A DIA DA ESTRADA</span><h2>Informação para seguir melhor</h2></div></header><div class="radio-grid">${daily.map((item) => itemCard(item)).join("")}</div></section>`;
    hydrateCovers(state.items, root);
    window.dispatchEvent(new CustomEvent("puxarota:radio-rendered"));
  }

  async function loadSaves() {
    state.saves.clear();
    if (!state.auth?.user) return;
    const client = await db();
    if (!client) return;
    const { data } = await client.from("puxarota_audio_saves").select("audio_id").eq("user_id", state.auth.user.id);
    (data || []).forEach((row) => state.saves.add(row.audio_id));
  }

  async function loadPublic() {
    const client = await db();
    if (!client) return renderEmpty();
    setStatus("#radio-status", "Carregando a Rádio");
    const now = new Date().toISOString();
    const { data, error } = await client.from("puxarota_audio_items")
      .select("id,kind,title,teaser,synopsis,category,season_title,season_number,episode_number,audio_path,cover_path,duration_seconds,access_level,allow_download,tags,featured_today,has_written_story,published_at")
      .eq("status", "published").lte("published_at", now).order("featured_today", { ascending: false }).order("published_at", { ascending: false });
    if (error) {
      state.items = [];
      setStatus("#radio-status", error.message.includes("puxarota_audio_items") ? "A estrutura da Rádio ainda precisa ser ativada no Supabase" : "Não foi possível carregar a Rádio", true);
      return renderEmpty();
    }
    state.items = data || [];
    await loadSaves();
    setStatus("#radio-status", state.items.length ? `${state.items.length} conteúdo${state.items.length === 1 ? "" : "s"} disponível${state.items.length === 1 ? "" : "is"}` : "Aguardando o primeiro conteúdo");
    renderPublic();
  }

  async function toggleSave(id) {
    if (!state.auth?.user) {
      setStatus("#radio-status", "Entre na sua conta para salvar conteúdos", true);
      document.querySelector('[data-go="perfil"]')?.click();
      return;
    }
    const client = await db();
    const saved = state.saves.has(id);
    const query = saved
      ? client.from("puxarota_audio_saves").delete().eq("user_id", state.auth.user.id).eq("audio_id", id)
      : client.from("puxarota_audio_saves").insert({ user_id: state.auth.user.id, audio_id: id });
    const { error } = await query;
    if (error) return setStatus("#radio-status", "Não foi possível atualizar seus salvos", true);
    saved ? state.saves.delete(id) : state.saves.add(id);
    renderPublic();
  }

  async function playItem(id) {
    const item = state.items.find((entry) => entry.id === id) || state.adminItems.find((entry) => entry.id === id);
    if (!item) return;
    if (!canPlay(item) && !isAdmin()) {
      q("#radio-access-dialog")?.showModal();
      return;
    }
    setStatus("#radio-status", "Preparando o áudio");
    const url = await playbackUrl(item);
    if (!url) return setStatus("#radio-status", "Este áudio não está disponível para sua conta", true);
    const audio = q("#radio-audio");
    const player = q("#radio-player");
    if (!audio || !player) return;
    state.current = item;
    audio.src = url;
    q("#radio-player-title").textContent = item.title;
    q("#radio-player-meta").textContent = typeMeta(item);
    player.hidden = state.activeView !== "radio";
    document.body.classList.toggle("radio-playing", state.activeView === "radio");
    const cover = q("#radio-player-cover");
    if (item.cover_path) {
      const coverUrl = await signedUrl(item.cover_path);
      if (coverUrl) cover.src = coverUrl;
    } else cover.src = "rupi-mascot.png";
    try { await audio.play(); } catch (_) { setStatus("#radio-status", "Toque em reproduzir para começar"); }
    updateMediaSession(item);
  }

  function updateMediaSession(item) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: item.title, artist: "Rádio PuxaRota", album: typeMeta(item) });
    navigator.mediaSession.setActionHandler("play", () => q("#radio-audio")?.play());
    navigator.mediaSession.setActionHandler("pause", () => q("#radio-audio")?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => seekBy(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => seekBy(15));
  }
  function seekBy(seconds) {
    const audio = q("#radio-audio");
    if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + seconds));
  }
  async function saveProgress(force = false) {
    const audio = q("#radio-audio");
    if (!state.auth?.user || !state.current || !audio || !Number.isFinite(audio.currentTime)) return;
    const now = Date.now();
    if (!force && now - state.progressTimer < 15000) return;
    state.progressTimer = now;
    const client = await db();
    await client.from("puxarota_audio_progress").upsert({ user_id: state.auth.user.id, audio_id: state.current.id, position_seconds: Math.floor(audio.currentTime), completed_at: audio.ended ? new Date().toISOString() : null, last_played_at: new Date().toISOString() }, { onConflict: "user_id,audio_id" });
  }

  function adminEmpty() {
    return `<div class="radio-admin-head"><div><span class="eyebrow">RÁDIO PUXAROTA</span><h2>Conteúdos de áudio</h2><p>Envie o primeiro áudio para começar a preencher a Rádio</p></div><button data-radio-new>Adicionar conteúdo</button></div><article class="admin-item radio-admin-empty"><img src="rupi-mascot.png" alt=""><div><h3>Nenhum conteúdo cadastrado</h3><p>Rascunhos e publicações aparecerão aqui</p></div></article>`;
  }
  function statusLabel(item) {
    return { draft: "Rascunho", scheduled: "Agendado", published: "Publicado", archived: "Arquivado" }[item.status] || item.status;
  }
  function renderAdmin() {
    const root = q("#admin-list");
    if (!root || !isAdmin()) return;
    if (!state.adminItems.length) { root.innerHTML = adminEmpty(); return; }
    root.innerHTML = `<div class="radio-admin-head"><div><span class="eyebrow">RÁDIO PUXAROTA</span><h2>Conteúdos de áudio</h2><p>${state.adminItems.length} conteúdo${state.adminItems.length === 1 ? "" : "s"} cadastrado${state.adminItems.length === 1 ? "" : "s"}</p></div><button data-radio-new>Adicionar conteúdo</button></div>
      <div class="radio-admin-list">${state.adminItems.map((item) => `<article class="admin-item radio-admin-item"><div><div class="radio-admin-labels"><span>${statusLabel(item)}</span><span>${item.access_level === "free" ? "Grátis" : "Assinante"}</span>${item.featured_today ? "<span>Destaque</span>" : ""}${item.has_written_story ? "<span>Leitura</span>" : ""}</div><h3>${esc(item.title)}</h3><p>${esc(typeMeta(item))}${item.published_at ? ` · ${dateLabel(item.published_at)}` : ""}</p></div><div class="admin-actions"><button data-radio-edit="${item.id}">Editar</button></div></article>`).join("")}</div>`;
  }
  async function loadAdmin() {
    if (!isAdmin()) return;
    const client = await db();
    const [itemsResult, sourcesResult] = await Promise.all([
      client.from("puxarota_audio_items").select("*").order("updated_at", { ascending: false }),
      client.from("puxarota_audio_sources").select("audio_id,source_type,source_value")
    ]);
    const data = itemsResult.data;
    const error = itemsResult.error || sourcesResult.error;
    if (error) {
      state.adminItems = [];
      q("#admin-list").innerHTML = `<article class="admin-item"><div><h3>Ative a estrutura da Rádio</h3><p>${esc(error.message)}</p></div></article>`;
      return;
    }
    const sources = new Map((sourcesResult.data || []).map((source) => [source.audio_id, source]));
    state.adminItems = (data || []).map((item) => ({ ...item, ...(sources.get(item.id) || {}) }));
    renderAdmin();
  }

  function resetForm(item) {
    const form = q("#radio-content-form");
    form.reset();
    state.formItem = item || null;
    state.duration = Number(item?.duration_seconds) || 0;
    q("#radio-written-story").value = "";
    q("#radio-content-id").value = item?.id || "";
    q("#radio-title").value = item?.title || "";
    q("#radio-teaser").value = item?.teaser || "";
    q("#radio-kind").value = item?.kind || "road_life";
    q("#radio-access").value = item?.access_level || "free";
    q("#radio-source-type").value = item?.source_type || "google_drive";
    q("#radio-drive-url").value = item?.source_type === "google_drive" ? item.source_value || "" : "";
    q("#radio-drive-source").hidden = q("#radio-source-type").value !== "google_drive";
    q("#radio-upload-source").hidden = q("#radio-source-type").value !== "storage";
    q("#radio-season-title").value = item?.season_title || "";
    q("#radio-season-number").value = item?.season_number || 1;
    q("#radio-episode-number").value = item?.episode_number || 1;
    q("#radio-category").value = item?.category || "bulletin";
    q("#radio-synopsis").value = item?.synopsis || "";
    q("#radio-featured").checked = item?.featured_today === true;
    q("#radio-source").value = item?.source_url || "";
    q("#radio-verified").value = item?.verified_at || "";
    q("#radio-story-fields").hidden = q("#radio-kind").value !== "story";
    q("#radio-form-title").textContent = item ? "Editar conteúdo" : "Novo conteúdo";
    setStatus("#radio-upload-status", item ? "Você pode trocar o áudio ou a capa" : "Selecione o áudio e a capa");
    updateFormPreview();
  }
  async function openForm(item) {
    resetForm(item);
    q("#radio-content-dialog").showModal();
    if (item?.cover_path) {
      const coverUrl = await signedUrl(item.cover_path);
      if (coverUrl) q("#radio-preview-cover").src = coverUrl;
    } else q("#radio-preview-cover").src = "rupi-mascot.png";
    if (item?.source_type === "google_drive" && item.source_value) q("#radio-form-audio-preview").src = googleDriveAudioUrl(item.source_value);
    else if (item?.source_type === "storage" && item.source_value) q("#radio-form-audio-preview").src = await signedUrl(item.source_value);
    else q("#radio-form-audio-preview").removeAttribute("src");
  }
  function updateFormPreview() {
    const title = q("#radio-title")?.value.trim() || "Título do conteúdo";
    const teaser = q("#radio-teaser")?.value.trim() || "Sua chamada curta aparecerá aqui";
    const kind = q("#radio-kind")?.value || "road_life";
    const access = q("#radio-access")?.value || "free";
    q("#radio-preview-title").textContent = title;
    q("#radio-preview-teaser").textContent = teaser;
    q("#radio-preview-meta").textContent = `${kindLabels[kind]} · ${access === "free" ? "Grátis" : "Assinante"}${state.duration ? ` · ${durationLabel(state.duration)}` : ""}`;
  }
  function fileExtension(file) {
    const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    return fromName || (file.type.startsWith("image/") ? "webp" : "mp3");
  }
  async function uploadFile(file, folder) {
    const client = await db();
    const path = `${folder}/${crypto.randomUUID()}.${fileExtension(file)}`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (error) throw error;
    return path;
  }
  async function submitForm(event) {
    event.preventDefault();
    const submitter = event.submitter;
    const desiredStatus = submitter?.value === "published" ? "published" : "draft";
    const form = event.currentTarget;
    const audioFile = q("#radio-audio-file").files[0];
    const coverFile = q("#radio-cover-file").files[0];
    const sourceType = q("#radio-source-type").value;
    const driveUrl = q("#radio-drive-url").value.trim();
    const kind = q("#radio-kind").value;
    if (!state.formItem && !coverFile) return setStatus("#radio-upload-status", "Selecione a capa", true);
    if (sourceType === "google_drive" && !(driveUrl || state.formItem?.source_value)) return setStatus("#radio-upload-status", "Cole o link público do Google Drive", true);
    if (sourceType === "storage" && !(audioFile || (state.formItem?.source_type === "storage" && state.formItem?.source_value))) return setStatus("#radio-upload-status", "Selecione o arquivo de áudio", true);
    if (desiredStatus === "published" && !(coverFile || state.formItem?.cover_path)) return setStatus("#radio-upload-status", "Adicione a capa antes de publicar", true);
    if (kind === "story" && !q("#radio-season-title").value.trim()) return setStatus("#radio-upload-status", "Informe o nome da temporada", true);
    qa("button", form).forEach((button) => button.disabled = true);
    form.setAttribute("aria-busy", "true");
    setStatus("#radio-upload-status", "Enviando arquivos");
    try {
      let audioPath = state.formItem?.audio_path || null;
      let sourceValue = sourceType === "google_drive" ? driveUrl : (state.formItem?.source_type === "storage" ? state.formItem?.source_value : null);
      let coverPath = state.formItem?.cover_path || null;
      if (audioFile && sourceType === "storage") {
        audioPath = await uploadFile(audioFile, "audio");
        sourceValue = audioPath;
      }
      if (sourceType === "google_drive") audioPath = null;
      if (coverFile) coverPath = await uploadFile(coverFile, "covers");
      const client = await db();
      const payload = {
        kind,
        title: q("#radio-title").value.trim(),
        teaser: q("#radio-teaser").value.trim(),
        synopsis: q("#radio-synopsis").value.trim() || null,
        category: kind === "story" ? null : q("#radio-category").value,
        season_title: kind === "story" ? q("#radio-season-title").value.trim() : null,
        season_number: kind === "story" ? Number(q("#radio-season-number").value) : null,
        episode_number: kind === "story" ? Number(q("#radio-episode-number").value) : null,
        audio_path: audioPath,
        cover_path: coverPath,
        duration_seconds: state.duration || state.formItem?.duration_seconds || null,
        access_level: q("#radio-access").value,
        featured_today: q("#radio-featured").checked,
        has_written_story: q("#radio-written-story").value.trim().length >= 80,
        source_url: q("#radio-source").value.trim() || null,
        verified_at: q("#radio-verified").value || null,
        status: desiredStatus,
        published_at: desiredStatus === "published" ? (state.formItem?.published_at || new Date().toISOString()) : state.formItem?.published_at || null
      };
      if (payload.featured_today) await client.from("puxarota_audio_items").update({ featured_today: false }).neq("id", state.formItem?.id || crypto.randomUUID());
      let result;
      if (state.formItem?.id) result = await client.from("puxarota_audio_items").update(payload).eq("id", state.formItem.id).select("id").single();
      else result = await client.from("puxarota_audio_items").insert({ ...payload, created_by: state.auth.user.id }).select("id").single();
      if (result.error) throw result.error;
      const sourceResult = await client.from("puxarota_audio_sources").upsert({ audio_id: result.data.id, source_type: sourceType, source_value: sourceValue, updated_at: new Date().toISOString() }, { onConflict: "audio_id" });
      if (sourceResult.error) throw sourceResult.error;
      const writtenBody = q("#radio-written-story").value.trim();
      const writtenResult = writtenBody
        ? await client.from("puxarota_written_stories").upsert({ audio_id: result.data.id, body: writtenBody, updated_at: new Date().toISOString() }, { onConflict: "audio_id" })
        : await client.from("puxarota_written_stories").delete().eq("audio_id", result.data.id);
      if (writtenResult.error) throw writtenResult.error;
      setStatus("#radio-upload-status", desiredStatus === "published" ? "Conteúdo publicado" : "Rascunho salvo");
      q("#radio-content-dialog").close();
      await Promise.all([loadAdmin(), loadPublic()]);
    } catch (error) {
      setStatus("#radio-upload-status", error.message || "Não foi possível salvar o conteúdo", true);
    } finally {
      qa("button", form).forEach((button) => button.disabled = false);
      form.removeAttribute("aria-busy");
    }
  }

  function setupPlayer() {
    const audio = q("#radio-audio");
    if (!audio) return;
    audio.addEventListener("play", () => { q("#radio-player-toggle").textContent = "Pausar"; });
    audio.addEventListener("pause", () => { q("#radio-player-toggle").textContent = "Ouvir"; saveProgress(true); });
    audio.addEventListener("timeupdate", () => {
      const seek = q("#radio-player-seek");
      if (seek && Number.isFinite(audio.duration)) { seek.max = audio.duration; seek.value = audio.currentTime; }
      q("#radio-player-time").textContent = `${durationLabel(audio.currentTime)} / ${durationLabel(audio.duration)}`;
      saveProgress();
    });
    audio.addEventListener("ended", () => saveProgress(true));
    q("#radio-player-toggle").onclick = () => audio.paused ? audio.play() : audio.pause();
    q("#radio-player-back").onclick = () => seekBy(-15);
    q("#radio-player-forward").onclick = () => seekBy(15);
    q("#radio-player-seek").oninput = (event) => { audio.currentTime = Number(event.target.value); };
    q("#radio-player-speed").onchange = (event) => { audio.playbackRate = Number(event.target.value); };
    q("#radio-player-close").onclick = () => { audio.pause(); q("#radio-player").hidden = true; document.body.classList.remove("radio-playing"); };
  }

  document.addEventListener("click", (event) => {
    const play = event.target.closest("[data-radio-play], [data-radio-preview]");
    const save = event.target.closest("[data-radio-save]");
    const filter = event.target.closest("[data-radio-filter]");
    const add = event.target.closest("[data-radio-new]");
    const edit = event.target.closest("[data-radio-edit]");
    if (play) playItem(play.dataset.radioPlay || play.dataset.radioPreview);
    if (save) toggleSave(save.dataset.radioSave);
    if (add) openForm(null);
    if (edit) openForm(state.adminItems.find((item) => item.id === edit.dataset.radioEdit));
    if (filter) {
      qa("[data-radio-filter]").forEach((button) => button.classList.toggle("active", button === filter));
      const value = filter.dataset.radioFilter;
      qa("[data-radio-group]").forEach((group) => {
        if (value === "all") group.hidden = false;
        else if (value === "saved") {
          group.hidden = false;
          qa(".radio-card", group).forEach((card) => card.hidden = !state.saves.has(card.dataset.radioId));
        } else group.hidden = group.dataset.radioGroup !== value;
      });
      if (value !== "saved") qa(".radio-card").forEach((card) => card.hidden = false);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    setupPlayer();
    q("#radio-content-form")?.addEventListener("submit", submitForm);
    q("#radio-kind")?.addEventListener("change", () => { q("#radio-story-fields").hidden = q("#radio-kind").value !== "story"; updateFormPreview(); });
    q("#radio-source-type")?.addEventListener("change", () => {
      const drive = q("#radio-source-type").value === "google_drive";
      q("#radio-drive-source").hidden = !drive;
      q("#radio-upload-source").hidden = drive;
    });
    q("#radio-drive-url")?.addEventListener("change", (event) => {
      const url = googleDriveAudioUrl(event.target.value);
      if (url) q("#radio-form-audio-preview").src = url;
    });
    ["#radio-title", "#radio-teaser", "#radio-access"].forEach((selector) => q(selector)?.addEventListener("input", updateFormPreview));
    q("#radio-cover-file")?.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) q("#radio-preview-cover").src = URL.createObjectURL(file);
    });
    q("#radio-audio-file")?.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const preview = q("#radio-form-audio-preview");
      preview.src = URL.createObjectURL(file);
      const probe = new Audio(preview.src);
      probe.addEventListener("loadedmetadata", () => { state.duration = Math.round(probe.duration || 0); updateFormPreview(); }, { once: true });
    });
    q("#radio-form-close")?.addEventListener("click", () => q("#radio-content-dialog").close());
    q("#radio-form-cancel")?.addEventListener("click", () => q("#radio-content-dialog").close());
    q("#radio-access-close")?.addEventListener("click", () => q("#radio-access-dialog").close());
    loadPublic();
  });

  window.addEventListener("puxarota:auth", async (event) => {
    state.auth = event.detail?.session ? event.detail : null;
    await loadPublic();
    if (isAdmin()) await loadAdmin();
  });

  function setView(view) {
    state.activeView = view;
    const player = q("#radio-player");
    const audio = q("#radio-audio");
    const insideRadio = view === "radio";
    if (!insideRadio && audio && !audio.paused) audio.pause();
    if (player) player.hidden = !insideRadio || !state.current;
    document.body.classList.toggle("radio-playing", insideRadio && Boolean(state.current));
  }

  window.PuxaRotaRadio = { loadPublic, loadAdmin, renderAdmin, setView };
})();
