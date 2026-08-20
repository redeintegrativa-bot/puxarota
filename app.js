(function () {
  "use strict";
  const q = (s) => document.querySelector(s);
  const qa = (s) => document.querySelectorAll(s);
  const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const KEY = "puxarota.saved.v1";
  const THEME_KEY = "puxarota.theme.v1";
  let deferredInstallPrompt = null;

  let jobs = [];
  let i = 0, pos = null, start = 0;
  let allJobs = [];
  let saved = loadSaved();
  let sessionActive = false;
  const GENERIC_COMPANY = "Transportadora parceira";

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    q("#theme").textContent = theme === "dark" ? "☀" : "◐";
    q("#theme").setAttribute("aria-label", theme === "dark" ? "Usar tema claro" : "Usar tema escuro");
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    const install = q("#install-app");
    if (install) install.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const install = q("#install-app");
    if (install) install.hidden = true;
    qa("[data-install-app]").forEach((button) => { button.disabled = true; button.innerHTML = "✓ <span>Instalado</span>"; });
    toast("PuxaRota instalado no celular");
  });
  window.PuxaRotaInstall = {
    available() { return Boolean(deferredInstallPrompt); },
    async prompt() {
      if (!deferredInstallPrompt) return { ok: false, reason: "unsupported" };
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      q("#install-app").hidden = true;
      return { ok: true };
    }
  };
  if (q("#install-app")) q("#install-app").onclick = async () => {
    if (!deferredInstallPrompt) { toast("No Android: abra o menu do Chrome e toque em 'Instalar aplicativo'"); return; }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    q("#install-app").hidden = true;
  };
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  const storedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(storedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  q("#theme").onclick = () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  };
  function syncStatus(text, active = true) {
    const status = q("#sync-status"); if (status) status.textContent = text;
    const dot = document.querySelector(".sync-line i"); if (dot) dot.classList.toggle("paused", !active);
  }
  const syncMessages = ["Sincronização ativa · conferindo novas oportunidades", "Catálogo em atualização · confira novas rotas", "Transportadoras podem enviar novas rotas a qualquer momento"];
  let syncMessage = 0;
  setInterval(() => { syncMessage = (syncMessage + 1) % syncMessages.length; syncStatus(syncMessages[syncMessage]); }, 5200);

  function loadSaved() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify([...saved])); }
    catch (e) { /* armazenamento indisponível: mantém em memória */ }
  }
  function haversine(a, b, c, d) {
    const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180;
    return Math.round(2 * R * Math.asin(Math.sqrt(Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2)));
  }
  function isNational(j) { return !j.lat || !j.lng || /^(todo o )?brasil$/i.test(j.origin || ""); }
  let userProfile = null;
  const VEHICLE_GROUPS = {
    "Fiorino": ["Fiorino", "Van", "Utilitário", "Passeio"],
    "Van": ["Van", "Utilitário", "Fiorino", "Passeio"],
    "Utilitário": ["Utilitário", "Van", "Fiorino", "Passeio"],
    "HR": ["HR", "Van", "Utilitário", "Fiorino"],
    "VUC": ["VUC", "3/4", "Utilitário"],
    "3/4": ["3/4", "VUC", "Toco"],
    "Toco": ["Toco", "3/4", "Truck"],
    "Truck": ["Truck", "Toco", "Carreta"],
    "Carreta": ["Carreta", "Truck"]
  };
  function profileMatchScore(j) {
    if (!userProfile) return 0;
    let score = 0;
    const userVehicle = String(userProfile.vehicle || "").trim();
    const compatible = userVehicle ? VEHICLE_GROUPS[userVehicle] || [userVehicle] : [];
    if (compatible.length && (j.tags || []).some((tag) => compatible.some((vehicle) => String(tag).toLowerCase() === vehicle.toLowerCase()))) score += 40;
    const userCargo = String(userProfile.cargo || "").toLowerCase();
    const cargoArea = [j.company, j.area, j.detail, j.model, ...(j.tags || [])].join(" ").toLowerCase();
    if (userCargo && cargoArea) {
      if (/refriger|congel/.test(userCargo) && /refriger|congel/.test(cargoArea)) score += 30;
      else if (/perig|quí|quim|inflam/.test(userCargo) && /perig|quí|quim|inflam/.test(cargoArea)) score += 30;
      else if (/longa/.test(userCargo) && /todo o brasil|nacional|longa/.test(cargoArea)) score += 20;
      else if (/distrib|coleta|entrega|última|ultima|e-commerce/.test(userCargo) && /distrib|coleta|entrega|última|ultima|e-commerce/.test(cargoArea)) score += 20;
      else if (/viva|animal|agro/.test(userCargo) && /viva|animal|agro/.test(cargoArea)) score += 20;
    }
    return score;
  }
  function sortForPosition() {
    jobs = allJobs.slice().sort((a, b) => {
      const da = a.lat && a.lng ? haversine(pos.lat, pos.lng, a.lat, a.lng) : Number.MAX_SAFE_INTEGER;
      const db = b.lat && b.lng ? haversine(pos.lat, pos.lng, b.lat, b.lng) : Number.MAX_SAFE_INTEGER;
      const groupA = da <= 250 ? 0 : isNational(a) ? 1 : 2;
      const groupB = db <= 250 ? 0 : isNational(b) ? 1 : 2;
      return groupA - groupB || da - db || profileMatchScore(b) - profileMatchScore(a) || b.score - a.score;
    });
    i = 0;
  }
  function usePosition(position, label) {
    pos = position;
    sortForPosition();
    const place = q("#place");
    if (place) {
      const icon = place.querySelector(".card-svg");
      place.textContent = "";
      if (icon) place.appendChild(icon);
      place.appendChild(document.createTextNode(label));
    }
    q("#scope").hidden = false;
    q("#locate").textContent = "↻ Atualizar local";
    draw();
    toast("Oportunidades com base próxima aparecem primeiro");
  }
  async function reversePositionDetails(position) {
    const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=" + encodeURIComponent(position.lat) + "&lon=" + encodeURIComponent(position.lng);
    const data = await fetch(url, { headers: { "Accept-Language": "pt-BR" } }).then((response) => response.ok ? response.json() : Promise.reject());
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county;
    const state = address.state_code || address.state;
    return { label: [city, state].filter(Boolean).join(", ") || "Localização atual", postalCode: address.postcode || "" };
  }
  async function reversePosition(position) {
    return (await reversePositionDetails(position)).label;
  }
  async function geocodePlace(query) {
    const url = "https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=" + encodeURIComponent(query);
    const items = await fetch(url, { headers: { "Accept-Language": "pt-BR" } }).then((response) => response.ok ? response.json() : Promise.reject());
    if (!items.length) throw new Error("local não encontrado");
    return { position: { lat: Number(items[0].lat), lng: Number(items[0].lon) }, label: items[0].display_name.split(",").slice(0, 3).join(",") };
  }
  async function geocodeCep(cep) {
    const digits = String(cep || "").replace(/\D/g, "");
    if (digits.length !== 8) return null;
    const data = await fetch("https://viacep.com.br/ws/" + digits + "/json/").then((response) => response.ok ? response.json() : Promise.reject()).catch(() => null);
    if (!data || data.erro || !data.localidade) return null;
    const found = await geocodePlace(data.localidade + ", " + data.uf);
    return { position: found.position, label: found.label, cep: data.cep };
  }
  async function locationPermission() {
    if (!navigator.permissions?.query) return "unknown";
    try { return (await navigator.permissions.query({ name: "geolocation" })).state; } catch (_) { return "unknown"; }
  }
  function locateDevice(onSuccess, onError) {
    if (!window.isSecureContext) return toast("Para usar o GPS, abra o PuxaRota por HTTPS.");
    if (!navigator.geolocation) return toast("Este aparelho não disponibiliza localização pelo navegador.");
    locationPermission().then((state) => {
      if (state === "denied") return toast("A localização está bloqueada. Libere-a nas permissões do PuxaRota e tente novamente.");
      navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, maximumAge: 300000, timeout: 12000 });
    });
  }
  function draw() {
    const j = jobs[i % jobs.length];
    q("#verified").textContent = j.sourceLabel || (j.verified ? "VAGA OFICIAL" : "ENVIADA POR EMPRESA");
    q("#verified").className = "source-tag " + (j.verified ? "official" : "community");
    q("#count").textContent = (i % jobs.length) + 1 + " DE " + jobs.length;
    q("#company").textContent = j.company;
    q("#trust").innerHTML = renderProvenance(j);
    q("#origin").textContent = isNational(j) ? "Atuação nacional" : j.origin;
    q("#area").textContent = j.area;
    q("#routine").textContent = j.routine;
    const operation = j.area && /distrib|coleta|entrega|última|ultima|carga|transporte/i.test(j.area) ? "Carga de transporte" : "Carga a confirmar";
    const matchScore = profileMatchScore(j);
    const tags = j.tags || [];
    const vehicles = tags.length ? tags : (j.vehicles && j.vehicles.length ? j.vehicles : ["A combinar com a empresa"]);
    const regionValue = isNational(j) ? "Atuação nacional" : (j.origin || "A combinar com a empresa");
    const pinIcon = '<svg class="tag-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"></path></svg>';
    const generalTags = [driverTag("tag-vehicle", tagIcon(vehicles[0] || "caminhão"), "Veículo", vehicles.join(" · ")), driverTag("tag-cargo", tagIcon(operation), "Carga", operation), driverTag("tag-region", pinIcon, "Região", regionValue)];
    q("#tags").innerHTML = '<div class="driver-tags">' + generalTags.join("") + (matchScore > 0 ? driverTag("tag-match", tagIcon("Combina com seu perfil"), "Perfil", "Combina com seu perfil") : "") + '</div>';
    q("#model").textContent = j.model && !/a confirmar|não informado|nan|^\-*$|^\-?0$/i.test(String(j.model)) ? j.model : "A combinar com a empresa";
    q("#payment").textContent = j.payment && !/a confirmar|não informado|nan|^\-*$|^\-?0$/i.test(String(j.payment)) ? j.payment : "A combinar com a empresa";
    q("#detail").textContent = j.detail;
    q("#distance").textContent = (pos && j.lat && j.lng) ? "≈ " + haversine(pos.lat, pos.lng, j.lat, j.lng) + " km da sua posição" : isNational(j) ? "Confirme com a empresa se há base na sua região" : "Ative o GPS ou informe sua cidade";
    const saveBtn = q("#save");
    if (saveBtn) {
      const saveSvg = saveBtn.querySelector("svg");
      if (saveSvg) saveSvg.style.fill = isSaved(j) ? "currentColor" : "none";
      saveBtn.setAttribute("aria-label", isSaved(j) ? "Remover das salvas" : "Guardar oportunidade");
    }
    q("#openAction").href = j.url;
    q("#openAction").textContent = sessionActive ? "Ver oportunidade →" : "Entrar para ver contato →";
    q("#openAction").setAttribute("aria-label", sessionActive ? "Abrir a oportunidade em nova aba" : "Criar acesso para ver o contato completo");
    q("#openAction").onclick = async (event) => {
      if (sessionActive) return;
      if (window.PuxaRotaAuth && !(await window.PuxaRotaAuth.hasSession())) {
        event.preventDefault();
        openProfile("Motorista");
        const message = q("#account-status");
        if (message) message.textContent = "Crie seu acesso gratuito para abrir o contato completo";
        toast("Entre ou crie sua conta para continuar");
      } else {
        sessionActive = true;
      }
    };
  }
  function currentJob() { return jobs[i % jobs.length]; }
  function vehicleTone(label) {
    const text = String(label || "").toLowerCase();
    if (/truck|carreta|cavalo/.test(text)) return "vehicle-heavy";
    if (/vuc|3\/4|toco/.test(text)) return "vehicle-medium";
    if (/van|fiorino|utilit|passeio/.test(text)) return "vehicle-light";
    return "vehicle-own";
  }

  function tagIcon(label) {
    const text = String(label).toLowerCase();
    const paths = /refriger|frigor/.test(text)
      ? "M12 3v18M5 7l14 10M19 7L5 17M7 3l5 4 5-4M7 21l5-4 5 4"
      : /perig|quím|quim|inflam/.test(text)
      ? "M12 3l9 5v8l-9 5-9-5V8z M12 8v5 M12 17h.01"
      : /frágil|fragil|vidro/.test(text)
      ? "M8 3h8M9 3v7l-3 7a3 3 0 0 0 3 4h6a3 3 0 0 0 3-4l-3-7V3M9 14h6"
      : /viva|animal|agro/.test(text)
      ? "M5 14c2-5 8-7 14-4-1 5-5 8-10 4zM9 11l-4-3M14 9l2-4"
      : /carreta/.test(text)
      ? "M2 7h11v7H2zM13 10h4l3 3v1h-4M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      : /truck|caminh|vuc|3\/4/.test(text)
      ? "M2 6h12v9H2zM14 9h4l3 3v3h-4M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      : /van|fiorino|utilit/.test(text)
      ? "M3 6h13a3 3 0 0 1 3 3v6H3zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M16 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      : /passeio|carro/.test(text)
      ? "M3 11l2-4h10l3 4v5H3zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M16 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      : /distrib|coleta|entrega|última|ultima|carga|transporte/.test(text)
      ? "M4 7h16v12H4zM8 7V4h8v3M8 12h8"
      : "M4 5h16v14H4zM8 5v14M16 5v14";
    return '<svg class="tag-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="' + paths + '"></path></svg>';
  }
  function renderTag(label, kind) {
    return '<span class="tag ' + (kind || "") + '" title="' + String(label).replace(/"/g, "&quot;") + '"><span class="tag-icon" aria-hidden="true">' + tagIcon(label) + '</span><span>' + label + '</span></span>';
  }
  function driverTag(kind, icon, label, value) {
    return '<span class="tag ' + kind + '"><i aria-hidden="true">' + icon + '</i><span>' + label + '</span><b>' + escapeText(value) + '</b></span>';
  }
  const TRUST_FALLBACK = { source: "Reclame Aqui", trust_score: null, label: "Sem avaliações no Reclame Aqui", status: "NO_INDEX" };
  function trustInfo(rep) {
    const r = rep && typeof rep === "object" ? rep : TRUST_FALLBACK;
    const score = typeof r.trust_score === "number" ? r.trust_score : null;
    return { r, score };
  }
  function trustTone(score) {
    if (score === null) return "trust-none";
    if (score >= 70) return "trust-high";
    if (score >= 40) return "trust-mid";
    return "trust-low";
  }
  function trustText(score) {
    if (score === null) return "Sem avaliações no Reclame Aqui";
    if (score >= 70) return "Confiável";
    if (score >= 40) return "Exige atenção";
    return "Pouco confiável";
  }
  function renderTrust(rep) {
    const { r, score } = trustInfo(rep);
    const value = score === null ? "—" : score + "%";
    const label = trustText(score);
    const href = r.url ? '<a class="trust-link" href="' + escapeText(r.url) + '" target="_blank" rel="noopener nofollow">' : "";
    const end = r.url ? "</a>" : "";
    return href + '<span class="trust-badge ' + trustTone(score) + '" title="' + escapeText(r.source || "Reclame Aqui") + ' · ' + escapeText(r.label || "") + '"><i aria-hidden="true"></i><b>' + value + "</b><small>" + escapeText(label) + "</small></span>" + end;
  }
  function renderProvenance(j) {
    if (j.provenance === "company") {
      return '<span class="provenance provenance-company" title="Oportunidade publicada por empresa cadastrada no PuxaRota e aprovada pela gestão"><svg class="card-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM9 12l2 2 4-4"></path></svg><small>Empresa cadastrada no app</small></span>';
    }
    return '<span class="provenance provenance-ai" title="Oportunidade localizada pela inteligência do PuxaRota a partir de fontes públicas"><svg class="card-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9z"></path></svg><small>Trazida pela IA do PuxaRota</small></span>';
  }
  function isSaved(j) { return saved.has(j.url); }
  function renderSaved() {
    const list = q("#saved-list");
    const empty = q("#saved-empty");
    const items = jobs.filter((j) => saved.has(j.url));
    list.innerHTML = items.map((j) =>
      '<div class="saved-card"><small>GUARDADA NO APARELHO</small><h2>' + j.company + "</h2>" +
      "<p>" + j.origin + " • " + j.area + "</p>" +
      '<div class="saved-actions"><a href="' + j.url + '" target="_blank" rel="noopener nofollow">Abrir fonte oficial ↗</a>' +
      '<button type="button" data-unsave="' + j.url + '">Remover</button></div></div>'
    ).join("");
    empty.hidden = items.length > 0;
    qa("#saved-list [data-unsave]").forEach((b) => b.onclick = () => {
      saved.delete(b.dataset.unsave);
      persist();
      renderSaved();
      toast("Oportunidade removida das salvas");
    });
  }
  function toast(t) {
    const x = q(".toast");
    x.textContent = t;
    x.classList.remove("hidden");
    x.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { x.classList.add("hidden"); x.hidden = true; }, 2100);
  }
  function renderSignals(feed) {
    const signals = (feed.signals || []).slice(0, 4);
    if (!signals.length) return;
    q("#signals").hidden = false;
    q("#signals-updated").textContent = feed.generatedAt ? "Atualizado " + new Date(feed.generatedAt).toLocaleDateString("pt-BR") : "Fonte aberta";
    const list = q("#signals-list");
    list.replaceChildren();
    signals.forEach((signal) => {
      const item = document.createElement("article");
      const link = document.createElement("a");
      link.href = signal.url; link.target = "_blank"; link.rel = "noopener nofollow"; link.textContent = signal.title;
      const meta = document.createElement("small"); meta.textContent = signal.source + " · sinal não verificado como vaga";
      item.append(link, meta); list.append(item);
    });
  }
  function next(dir, msg) {
    const card = q("#job");
    card.classList.add(dir);
    setTimeout(() => {
      i = i + 1;
      draw();
      card.className = "job enter";
      setTimeout(() => { card.className = "job"; }, 450);
    }, 330);
    toast(msg);
  }

  q("#skip").onclick = () => next("exit-left", "Mostrando a próxima oportunidade");
  function openProfile(kind) {
    q("#profile-kind").value = kind;
    qa(".onboarding-role-choice").forEach((b) => b.classList.toggle("active", b.dataset.kind === kind));
    q("#driver-fields").hidden = kind === "Transportadora";
    q("#company-fields").hidden = kind !== "Transportadora";
    if (q("#business-plan")) q("#business-plan").hidden = kind !== "Transportadora";
    qa(".nav button,.screen").forEach((x) => x.classList.remove("active"));
    qa(".screen").forEach((x) => { x.hidden = true; });
    q("#screen-profile").hidden = false;
    q("#screen-profile").classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (q("#profile-country-new")) q("#profile-country-new").value = navigator.language?.toLowerCase().startsWith("pt") ? "+55" : "+1";
  try {
    const savedProfile = JSON.parse(localStorage.getItem("puxarota-profile") || "null");
    if (savedProfile) Object.entries(savedProfile).forEach(([key, value]) => { const el = q("#" + key); if (el) el.value = value; });
  } catch (_) {}
  if (q("#profile-location-new")) q("#profile-location-new").onclick = () => {
    if (!navigator.geolocation) return toast("Localização indisponível neste aparelho");
    q("#profile-location-new").textContent = "Buscando localização…";
    locateDevice(async (p) => {
      try {
        const details = await reversePositionDetails({ lat: p.coords.latitude, lng: p.coords.longitude });
        q("#profile-region").value = details.label;
        if (details.postalCode) q("#profile-cep").value = details.postalCode;
        q("#profile-location-new").textContent = details.postalCode ? "Localização e CEP preenchidos" : "Localização preenchida";
        if (!details.postalCode) toast("Localização preenchida. Informe o CEP se necessário.");
      } catch (_) { q("#profile-region").value = "Localização atual"; q("#profile-location-new").textContent = "Localização preenchida"; }
    }, () => { q("#profile-location-new").textContent = "Usar minha localização"; toast("GPS indisponível. Informe seu CEP abaixo."); q("#profile-cep").focus(); });
  };
  function selectOnboardingRole(kind) {
    q("#profile-kind").value = kind;
    qa(".onboarding-role-choice").forEach((b) => b.classList.toggle("active", b.dataset.kind === kind));
  }
  qa(".onboarding-role-choice").forEach((b) => b.onclick = () => selectOnboardingRole(b.dataset.kind));
  selectOnboardingRole("Motorista");
  function selectVehicle(vehicle) {
    q("#profile-vehicle").value = vehicle;
    qa("[data-vehicle]").forEach((button) => button.classList.toggle("active", button.dataset.vehicle === vehicle));
  }
  qa("[data-vehicle]").forEach((button) => button.onclick = () => selectVehicle(button.dataset.vehicle));
  window.addEventListener("puxarota:profile-loaded", (event) => { if (event.detail?.vehicle) selectVehicle(event.detail.vehicle); });

  if (q("#route-see-jobs")) q("#route-see-jobs").onclick = () => q("[data-screen=jobs]")?.click();

  q("#save").onclick = () => {
    const j = currentJob();
    if (isSaved(j)) { saved.delete(j.url); toast("Removida das salvas"); }
    else { saved.add(j.url); toast("Oportunidade guardada neste aparelho"); }
    persist();
    renderSaved();
    draw();
  };
  q("#job").addEventListener("touchstart", (e) => { start = e.touches[0].clientX; }, { passive: true });
  q("#job").addEventListener("touchend", (e) => {
    const d = e.changedTouches[0].clientX - start;
    if (Math.abs(d) <= 70) return;
    if (d > 0) {
      const j = currentJob();
      if (!isSaved(j)) { saved.add(j.url); persist(); renderSaved(); }
      draw();
      toast("Oportunidade guardada para ver depois");
    }
    next(d > 0 ? "exit-right" : "exit-left", "Próxima oportunidade");
  });

  q("#locate").onclick = () => {
    if (!navigator.geolocation) return toast("GPS indisponível neste aparelho");
    q("#place").textContent = "⌖ Buscando sua posição…";
    locateDevice(
      async (p) => {
        const position = { lat: p.coords.latitude, lng: p.coords.longitude };
        let label = "Localização atual";
        try { label = await reversePosition(position); } catch (e) { /* coordenadas ainda ordenam corretamente */ }
        usePosition(position, label);
      },
      () => { q("#place").textContent = "📍 Permissão não concedida"; toast("Você pode informar a cidade manualmente"); },
    );
  };
  q("#city").onclick = async () => {
    const city = prompt("Digite sua cidade ou CEP:");
    if (!city) return;
    q("#place").textContent = "⌖ Buscando " + city + "…";
    try {
      const isCep = /^\d{5}-?\d{3}$/.test(city.trim());
      const found = isCep ? await geocodeCep(city) : await geocodePlace(city);
      if (!found) throw new Error("não encontrado");
      usePosition(found.position, found.label + (found.cep ? " · " + found.cep : ""));
      if (found.cep) toast("CEP localizado. Mostrando oportunidades próximas a " + found.label);
    } catch (e) { q("#place").textContent = "📍 Região não encontrada"; toast(isCep ? "CEP não encontrado. Confira os 8 dígitos." : "Tente cidade e estado, por exemplo: Recife, PE"); }
  };
  q("#scope").onclick = () => {
    pos = null; jobs = allJobs.filter(j => j.status === "approved"); i = 0;
    q("#place").textContent = "📍 Brasil inteiro";
    q("#scope").hidden = true;
    q("#locate").textContent = "⌖ Usar GPS";
    draw();
    toast("Mostrando oportunidades de todo o Brasil");
  };
  function maskPhoneInput() {
    const area = q("#profile-area-new"), phone = q("#profile-phone-new");
    if (!area || !phone) return;
    area.addEventListener("input", () => { area.value = area.value.replace(/\D/g, "").slice(0, 2); });
    phone.addEventListener("input", () => {
      let d = phone.value.replace(/\D/g, "").slice(0, 10);
      phone.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
    });
  }
  function validWhatsApp() {
    const area = q("#profile-area-new"), phone = q("#profile-phone-new");
    const areaDigits = (area.value || "").replace(/\D/g, "");
    const phoneDigits = (phone.value || "").replace(/\D/g, "");
    if (!/^[1-9]\d$/.test(areaDigits)) return "Informe o DDD com 2 números (ex.: 11).";
    if (!/^\d{8,9}$/.test(phoneDigits)) return "Informe o número com 8 ou 9 dígitos (ex.: 99999-9999).";
    if (phoneDigits.length === 9 && !phoneDigits.startsWith("9")) return "Celular com 9 dígitos deve começar com 9 (ex.: 99888-7766).";
    if (phoneDigits.length === 8 && areaDigits.startsWith("0")) return "O DDD não pode começar com 0.";
    return null;
  }
  maskPhoneInput();
    const oppForm = q("#opp-form");
  if (oppForm) oppForm.onsubmit = async (event) => {
    event.preventDefault();
    const statusEl = q("#opp-status");
    const clearStatus = () => { if (statusEl) statusEl.textContent = ""; };
    const title = q("#opp-title").value.trim();
    if (!title) {
      toast("Informe o título da vaga.");
      q("#opp-title").focus();
      return;
    }
    // company required for company accounts
    const accType = window.PuxaRotaAuth?.account?.account_type;
    if (accType === "company" && !title) {
      toast("Informe o título da vaga (empresa obrigatória).");
      q("#opp-title").focus();
      return;
    }
    if (!window.PuxaRotaAuth?.createOpportunity) {
      toast("A conexão segura está indisponível. Tente novamente.");
      return;
    }
    if (statusEl) statusEl.textContent = "Enviando...";
    const submitBtn = q('#opp-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const result = await window.PuxaRotaAuth.createOpportunity({
      company: "", title,
      detail: q("#opp-detail")?.value.trim() || null,
      origin: q("#opp-origin")?.value.trim() || null,
      area: null, vehicles: (q("#opp-vehicles")?.value || "").split(",").map((v) => v.trim()).filter(Boolean),
      model: null, routine: null, payment: q("#opp-payment")?.value.trim() || null,
      status: "pending"
    });
    if (!result.ok) {
      if (statusEl) {
        statusEl.textContent = "Não foi possível enviar. Revise os dados e tente novamente.";
        statusEl.classList.add("error");
      }
      toast("Não foi possível enviar a oportunidade agora.");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    // sucesso
    if (submitBtn) submitBtn.disabled = false;
    if (statusEl) statusEl.textContent = "";
    const newOpp = result?.data;
    if (newOpp) {
      allJobs.push(newOpp);
      draw();
    }
    if (newOpp.status === "pending") {
      toast("Oportunidade enviada. Está aguardando aprovação do admin.");
    } else if (newOpp.status === "approved") {
      toast("Oportunidade enviada e já aprovada.");
    } else {
      toast("Oportunidade enviada.");
    }
  };);
    if (!result.ok) {
      if (statusEl) { statusEl.textContent = "Não foi possível enviar. Revise os dados e tente novamente."; statusEl.classList.add("error"); }
      return toast("Não foi possível enviar a oportunidade agora.");
    }
    oppForm.reset();
    clearStatus();
    toast("Oportunidade enviada. Ela será analisada antes de aparecer na aba Cargas.");
  };
  q("#profile-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!window.PuxaRotaAuth?.saveProfile) return toast("A conexão segura está indisponível. Tente novamente.");
    const whatsappError = validWhatsApp();
    if (whatsappError) {
      toast(whatsappError);
      (whatsappError.includes("DDD") ? q("#profile-area-new") : q("#profile-phone-new")).focus();
      return;
    }
    const remote = await window.PuxaRotaAuth.saveProfile({ kind: q("#profile-kind").value, name: q("#profile-name-new").value.trim(), whatsapp: q("#profile-country-new").value + " (" + q("#profile-area-new").value.trim() + ") " + q("#profile-phone-new").value.trim(), region: q("#profile-region").value.trim(), postalCode: q("#profile-cep").value.trim(), vehicle: q("#profile-vehicle").value.trim(), license: q("#profile-license")?.value || "Não informada", cargo: q("#profile-cargo").value.trim(), availability: q("#profile-availability").value.trim(), consentData: q("#profile-consent")?.checked === true });
    if (!remote.ok) return toast("Não foi possível salvar agora. Revise a conexão e tente novamente.");
    toast("Perfil salvo. Você pode acompanhar o status nesta tela.");
  };

  window.addEventListener("puxarota:auth", (event) => {
    sessionActive = Boolean(event.detail?.session);
    const label = q("#profile-nav-label");
    if (label) label.textContent = event.detail?.session ? "Perfil" : "Entrar";
    const profile = event.detail?.profile;
    if (profile) {
      userProfile = { vehicle: profile.vehicle || "", cargo: profile.cargo_preference || "" };
      if (pos) sortForPosition();
    }
    const openAction = q("#openAction");
    if (openAction) {
      openAction.textContent = sessionActive ? "Ver oportunidade →" : "Entrar para ver contato →";
      openAction.setAttribute("aria-label", sessionActive ? "Abrir a oportunidade em nova aba" : "Criar acesso para ver o contato completo");
    }
    if (event.detail?.session) { renderUserNotices(); if (window.PuxaRotaAuth?.setupPushSubscription) window.PuxaRotaAuth.setupPushSubscription().catch(() => {}); if (window.PuxaRotaAuth?.touchPresence) window.PuxaRotaAuth.touchPresence().catch(() => {}); }
    const companyPublish = q("#company-publish");
    if (companyPublish) {
      const accountType = event.detail?.account?.account_type;
      const profileStatus = event.detail?.profile?.status;
      companyPublish.hidden = !(event.detail?.session && accountType === "company" && profileStatus === "approved");
    }
  });
  setInterval(() => {
    if (window.PuxaRotaAuth?.touchPresence) window.PuxaRotaAuth.touchPresence().catch(() => {});
    const panel = q("#admin-panel");
    if (panel && !panel.hidden && window.PuxaRotaAuth?.listAdminProfiles) renderRemoteAdminProfiles();
  }, 60000);
  async function renderUserNotices() {
    const bar = q("#notice-bar");
    if (!bar || !window.PuxaRotaAuth?.listMyNotifications) return;
    const notices = await window.PuxaRotaAuth.listMyNotifications();
    if (!notices.length) { bar.hidden = true; bar.innerHTML = ""; return; }
    bar.hidden = false;
    bar.innerHTML = notices.map((n) => {
      const cta = n.button_url && /^https?:\/\//i.test(n.button_url)
        ? '<a class="notice-cta" href="' + escapeText(n.button_url) + '" target="_blank" rel="noopener">' + escapeText(n.button_label || "Abrir") + ' ↗</a>'
        : "";
      return '<div class="notice"><button type="button" class="notice-dismiss" aria-label="Fechar" data-notice-read="' + n.id + '">✕</button><strong>Mensagem do PuxaRota</strong><p>' + escapeText(n.message) + '</p>' + cta + '<button type="button" class="notice-ok" data-notice-read="' + n.id + '">Entendi</button></div>';
    }).join("");
    qa("[data-notice-read]", bar).forEach((b) => b.onclick = async () => {
      await window.PuxaRotaAuth.markNotificationRead(b.dataset.noticeRead);
      renderUserNotices();
    });
  }
  function renderRoutes() {
    if (window.PuxaRotaRoutes) { window.PuxaRotaRoutes.render(); return; }
    const place = q("#route-place"); if (place) place.textContent = q("#place")?.textContent?.replace("📍", "") || "Informe sua cidade";
    const origin = q("#route-origin"); if (origin) origin.textContent = pos ? (q("#place")?.textContent || "Sua região") : "Sua região";
    const list = q("#route-list"); if (!list) return;
    list.innerHTML = allJobs.slice(0, 4).map((j) => `<article><small>${j.verified ? "VAGA OFICIAL" : "OPORTUNIDADE"}</small><strong>${j.company}</strong><span>${j.origin || "Brasil"} · ${j.area || "Rota a confirmar"}</span></article>`).join("");
  }
  qa(".nav button").forEach((b) => b.onclick = () => {
    qa(".nav button,.screen").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    qa(".screen").forEach((x) => { x.hidden = true; });
    const panel = q('[data-panel="' + b.dataset.screen + '"]');
    panel.hidden = false;
    panel.classList.add("active");
    if (b.dataset.screen === "saves") renderSaved();
    if (b.dataset.screen === "drivers") renderDrivers();
    if (b.dataset.screen === "routes") renderRoutes();
    if (b.dataset.screen === "profile") window.PuxaRotaAuth?.refreshDashboard();
  });
  if (new URLSearchParams(window.location.search).get("open") === "profile") q('[data-screen="profile"]')?.click();
  if (new URLSearchParams(window.location.search).get("open") === "routes") q('[data-screen="routes"]')?.click();
  function phoneForWhatsApp(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
  }
  function normalizeBrPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11) return "+55 (" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
    if (digits.length === 10) return "+55 (" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    return String(value || "").trim();
  }
  function phoneError(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "Informe um telefone.";
    if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length < 10 || digits.length > 13) return "Telefone deve ter DDD + 8 ou 9 dígitos (ex.: (11) 99999-9999).";
    return null;
  }
  async function copyContact(value, label) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const area = document.createElement("textarea"); area.value = value; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
        document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
      }
      toast(label + " copiado.");
    } catch (_) { toast("Não foi possível copiar agora."); }
  }
  function contactActions(contact) {
    const email = String(contact.email || "").trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phone = phoneForWhatsApp(contact.phone);
    const actions = [];
    if (validEmail) actions.push(`<button type="button" data-copy-contact="${escapeText(email)}" data-copy-label="E-mail">Copiar e-mail</button><a class="admin-contact" href="mailto:${encodeURIComponent(email)}">Enviar e-mail</a>`);
    if (phone) actions.push(`<button type="button" data-copy-contact="${phone}" data-copy-label="Telefone">Copiar telefone</button><a class="admin-contact" href="https://wa.me/${phone}" target="_blank" rel="noopener">WhatsApp ↗</a>`);
    return actions.join("");
  }
  const formatAdminDate = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "não informado";
  function timeAgo(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return minutes + " min";
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return hours + "h" + (minutes % 60 ? " " + (minutes % 60) + "min" : "");
    return Math.floor(hours / 24) + " dia(s)";
  }
  function presenceChip(account) {
    const seen = account?.last_seen_at ? new Date(account.last_seen_at).getTime() : null;
    if (!seen) return '<span class="admin-presence admin-presence-off">⚫ nunca online</span>';
    const diff = Date.now() - seen;
    if (diff < 120000) return '<span class="admin-presence admin-presence-on">🟢 online agora</span>';
    return '<span class="admin-presence admin-presence-away">ausente há ' + timeAgo(diff) + '</span>';
  }
  let managedProfiles = new Map(), managedOpportunities = new Map();
  let reputationByCompany = new Map();
  fetch("reputacao.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then((data) => {
      reputationByCompany = new Map(Object.entries(data.companies || {}).map(([name, entry]) => [name, { source: "Reclame Aqui", url: entry.raUrl, status: entry.reputationStatus, label: entry.label, rating: entry.rating, complaints: entry.complaints, response_rate: entry.responseRate, solved_rate: entry.solvedRate, verified: entry.verified, trust_score: entry.trustScore }]));
      const target = q("#admin-opportunities-list"); if (target && target.innerHTML) renderAdminOpportunities();
    })
    .catch(() => console.info("Mapa de reputação indisponível; badge não será exibido."));
  const withReputation = (item) => {
    if (item && typeof item === "object") {
      const known = reputationByCompany.get(item.company);
      if (known) item.reputation = known;
    }
    return item;
  };
  const OPPORTUNITY_STATUSES = [
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovadas" },
    { value: "rejected", label: "Recusadas" },
    { value: "archived", label: "Arquivadas" }
  ];
  let adminOpportunityFilter = "pending", adminOpportunitySearch = "";
  const applyOpportunityFilter = (value) => { adminOpportunityFilter = value; renderAdminOpportunities(); };
  const applyOpportunitySearch = (value) => { adminOpportunitySearch = value.trim().toLowerCase(); renderAdminOpportunities(); };
  async function renderAdminOpportunities() {
    const box = q("#admin-opportunities-list"); if (!box || !window.PuxaRotaAuth?.listAdminOpportunities) return;
    const result = await window.PuxaRotaAuth.listAdminOpportunities(); if (!result.ok) { box.innerHTML = '<p class="saved-note">Fila de oportunidades será ativada após a migração do banco.</p>'; return; }
    managedOpportunities = new Map(result.opportunities.map((item) => [item.id, item]));
    const all = result.opportunities.map(withReputation);
    const counts = { pending: 0, approved: 0, rejected: 0, archived: 0 };
    all.forEach((item) => { if (counts[item.status] !== undefined) counts[item.status] += 1; });
    const totalChips = OPPORTUNITY_STATUSES.reduce((sum, status) => sum + counts[status.value], 0);
    const oppTabCount = q("#admin-tab-count-opportunities");
    if (oppTabCount) {
      oppTabCount.textContent = counts.pending > 0 ? counts.pending : totalChips > 0 ? String(totalChips) : "0";
      oppTabCount.classList.toggle("has-pending", counts.pending > 0);
    }
    const chips = q("#admin-opportunity-chips");
    if (chips) chips.innerHTML = '<button type="button" class="' + (adminOpportunityFilter === "all" ? "active" : "") + '" data-opportunity-filter="all">Todas <b>' + totalChips + "</b></button>" + OPPORTUNITY_STATUSES.map((status) => '<button type="button" class="' + (adminOpportunityFilter === status.value ? "active" : "") + '" data-opportunity-filter="' + status.value + '">' + status.label + " <b>" + counts[status.value] + "</b></button>").join("");
    qa("[data-opportunity-filter]").forEach((button) => button.onclick = () => applyOpportunityFilter(button.dataset.opportunityFilter));
    const filtered = all.filter((item) => (adminOpportunityFilter === "all" || item.status === adminOpportunityFilter) && (!adminOpportunitySearch || (item.company + " " + (item.title || "")).toLowerCase().includes(adminOpportunitySearch)));
    box.innerHTML = filtered.map((item) => {
      const approve = item.status !== "approved" ? `<button type="button" data-opportunity-status="approved" data-opportunity-id="${item.id}">Aprovar e publicar</button>` : "";
      const reject = item.status === "pending" ? `<button type="button" data-opportunity-status="rejected" data-opportunity-id="${item.id}">Recusar</button>` : "";
      const archive = item.status === "approved" ? `<button type="button" data-opportunity-status="archived" data-opportunity-id="${item.id}">Ocultar do catálogo</button>` : "";
      const sourceUrl = /^https:\/\//i.test(item.source_url || "") ? item.source_url : "#";
      return `<article><small>${escapeText(item.status)} · ${formatAdminDate(item.discovered_at)} · ${escapeText(item.source)}</small><strong>${escapeText(item.company)}</strong><span>${renderTrust(item.reputation)}<br>${escapeText(item.title)}<br>${escapeText(item.origin || "Região não informada")} · ${(item.vehicles || []).map(escapeText).join(", ") || "Veículo a confirmar"}</span><details><summary>Ver descrição e fonte</summary><p>${escapeText(item.detail || "Sem descrição")}<br><a href="${escapeText(sourceUrl)}" target="_blank" rel="noopener">Abrir fonte oficial ↗</a></p></details><div class="admin-actions"><button type="button" data-opportunity-edit="${item.id}">Editar oportunidade</button>${approve}${reject}${archive}</div></article>`;
    }).join("") || (adminOpportunitySearch || adminOpportunityFilter !== "all" ? '<p class="saved-note">Nenhuma oportunidade neste filtro.</p>' : '<p class="saved-note">Nenhuma oportunidade na fila ainda.</p>');
    qa("[data-opportunity-status]").forEach((button) => button.onclick = async () => { const result = await window.PuxaRotaAuth.reviewOpportunity(button.dataset.opportunityId, button.dataset.opportunityStatus); if (!result.ok) return toast("Não foi possível atualizar a oportunidade."); toast("Oportunidade atualizada."); renderAdminOpportunities(); });
    qa("[data-opportunity-edit]").forEach((button) => button.onclick = async () => { const item = managedOpportunities.get(button.dataset.opportunityEdit); if (!item) return; const company = prompt("Empresa", item.company); if (company === null) return; const title = prompt("Título", item.title); if (title === null) return; const origin = prompt("Região", item.origin || ""); if (origin === null) return; const vehicles = prompt("Veículos (separados por vírgula)", (item.vehicles || []).join(", ")); if (vehicles === null) return; const detail = prompt("Descrição", item.detail || ""); if (detail === null) return; const result = await window.PuxaRotaAuth.editOpportunity(item.id, { company, title, origin, vehicles: vehicles.split(",").map((value) => value.trim()).filter(Boolean), detail }); if (!result.ok) return toast("Não foi possível salvar a edição."); toast("Oportunidade editada."); renderAdminOpportunities(); });
  }
  async function renderRemoteAdminProfiles() {
    if (!window.PuxaRotaAuth?.listAdminProfiles) return;
    const result = await window.PuxaRotaAuth.listAdminProfiles();
    if (!result.ok) return;
    const list = q("#admin-list");
    const accounts = new Map(result.accounts.map((account) => [account.user_id, account]));
    managedProfiles = new Map(result.profiles.map((profile) => [profile.id, profile]));
    const cards = result.profiles.filter((r) => !accounts.get(r.user_id)?.admin_dismissed_at).map((r) => {
      const pending = r.status === "pending";
      const contactPending = r.contact_release === "pending";
      const account = accounts.get(r.user_id);
      const accountPending = account && !account.is_approved;
      const isCompany = r.profile_type === "company";
      const typeChip = isCompany
        ? '<span class="admin-chip admin-chip-company">🏢 Transportadora · gestão própria</span>'
        : '<span class="admin-chip">' + escapeText(r.profile_type === "helper" ? "Ajudante" : "Motorista / agregado") + '</span>';
      const publicAction = !isCompany && r.status === "approved" ? (r.public_visible && r.consent_public ? `<button type="button" data-profile-publish="false" data-profile-id="${r.id}">Retirar da vitrine</button>` : `<button type="button" data-profile-publish="true" data-profile-id="${r.id}">Confirmar consentimento e publicar</button>`) : "";
      const companyNote = isCompany ? '<p class="admin-company-note">Empresa aprovada fica na gestão, sem exibição pública na vitrine de profissionais.</p>' : "";
      const actions = `<button type="button" data-admin-message="${r.user_id}" data-admin-message-name="${escapeText(r.display_name)}">Enviar mensagem</button><button type="button" data-profile-edit="${r.id}">Editar cadastro</button>` + (pending || accountPending ? `<button type="button" data-registration-approve="${r.id}" data-account-id="${r.user_id}">Aprovar cadastro</button>` : "") + (pending ? `<button type="button" data-remote-reject="${r.id}" data-account-id="${r.user_id}">Recusar perfil</button>` : `<button type="button" data-reopen-profile="${r.id}" data-account-id="${r.user_id}">Reabrir análise</button>`) + publicAction + (r.status === "approved" && contactPending ? `<button type="button" data-remote-contact="${r.id}">Liberar contato após consentimento</button>` : "") + `<button type="button" data-dismiss-account="${r.user_id}" data-profile-id="${r.id}">Ocultar da fila</button>` + contactActions({ email: account?.email_snapshot, phone: r.whatsapp });
      const details = `<details><summary>Ver dados enviados</summary><p>Cadastro: ${formatAdminDate(r.created_at)}<br>E-mail: ${escapeText(account?.email_snapshot || "não informado")}<br>WhatsApp: ${escapeText(r.whatsapp || "não informado")}<br>CEP: ${escapeText(r.postal_code || "não informado")}<br>CNH: ${escapeText(r.license_category || "não informada")}<br>Carga: ${escapeText(r.cargo_preference || "não informada")}<br>Disponibilidade: ${escapeText(r.availability || "não informada")}<br>Consentimento de dados: ${r.consent_data ? "sim" : "não"}</p></details>`;
      return `<article class="${isCompany ? "admin-card-company" : ""}">${typeChip}<strong>${escapeText(r.display_name)}</strong><small>perfil ${escapeText(r.status)} · conta ${account?.is_approved ? "aprovada" : "em análise"} · ${presenceChip(account)}</small><span>${escapeText(r.region || "Região não informada")} · ${escapeText(r.vehicle || "Veículo não informado")}</span>${companyNote}${details}<div class="admin-actions">${actions}</div></article>`;
    });
    const companies = cards.filter((card) => card.startsWith('<article class="admin-card-company">'));
    const professionals = cards.filter((card) => !card.startsWith('<article class="admin-card-company">'));
    const companyCount = companies.length;
    const remote = (companyCount ? '<div class="admin-section-title">🏢 Transportadoras · ' + companyCount + ' · não vão à vitrine</div>' + companies.join("") : "") + (professionals.length ? '<div class="admin-section-title">👤 Profissionais · ' + professionals.length + '</div>' + professionals.join("") : "");
    const adminSummary = companyCount ? '<div class="admin-summary">🏢 <b>' + companyCount + '</b> transportadora(s) aprovada(s) para gestão — sem exibição pública.</div>' : "";
    list.innerHTML = adminSummary + (remote || '<p class="saved-note">Nenhum cadastro recebido ainda.</p>');
    const profileTabCount = q("#admin-tab-count-profiles");
    if (profileTabCount) profileTabCount.textContent = String(result.profiles.length);
    const profileUsers = new Set(result.profiles.map((profile) => profile.user_id));
    const accountsList = q("#admin-accounts-list");
    const incompleteAccounts = result.accounts.filter((account) => !profileUsers.has(account.user_id) && !account.admin_dismissed_at);
    const accountsTabCount = q("#admin-tab-count-accounts");
    if (accountsTabCount) accountsTabCount.textContent = String(incompleteAccounts.length);
    if (accountsList) accountsList.innerHTML = incompleteAccounts.map((account) => `<article><small>${escapeText(account.account_type)} · ${account.is_approved ? "conta aprovada" : "aguardando aprovação"} · ${presenceChip(account)}</small><strong>${escapeText(account.display_name || "Conta sem nome informado")}</strong><span>Conta criada em ${formatAdminDate(account.created_at)}<br>E-mail: ${escapeText(account.email_snapshot || "não informado")}<br>Telefone: ${escapeText(account.phone || "não informado")}<br>Perfil ainda não enviado.</span><div class="admin-actions">${account.is_approved ? "" : `<button type="button" data-account-approve="${account.user_id}">Aprovar conta</button>`}<button type="button" data-admin-message="${account.user_id}" data-admin-message-name="${escapeText(account.display_name || "usuário")}">Enviar mensagem</button><button type="button" data-dismiss-account="${account.user_id}">Ocultar da fila</button>${contactActions({ email: account.email_snapshot, phone: account.phone })}</div></article>`).join("") || '<p class="saved-note">Nenhuma conta aguardando o envio do perfil.</p>';
    const historyList = q("#admin-history-list");
    if (historyList) historyList.innerHTML = (result.history || []).map((item) => `<article><small>${escapeText(item.action)} · ${formatAdminDate(item.created_at)}</small><strong>${escapeText(item.note || "Ação administrativa")}</strong><div class="admin-actions">${item.action === "dismissed" ? `<button type="button" data-restore-account="${item.user_id}">Restaurar na fila</button>` : ""}</div></article>`).join("") || '<p class="saved-note">Nenhuma decisão registrada ainda.</p>';
    qa("[data-registration-approve]").forEach((b) => b.onclick = async () => { const [profileResult, accountResult] = await Promise.all([window.PuxaRotaAuth.reviewProfile(b.dataset.registrationApprove, "approved"), window.PuxaRotaAuth.reviewAccount(b.dataset.accountId, true)]); if (!profileResult.ok || !accountResult.ok) return toast("Não foi possível aprovar todo o cadastro. Tente novamente."); await window.PuxaRotaAuth.recordAdminAction(b.dataset.accountId, b.dataset.registrationApprove, "approved", "Conta e perfil aprovados"); toast("Conta e perfil aprovados."); renderRemoteAdminProfiles(); });
    qa("[data-remote-reject]").forEach((b) => b.onclick = async () => { const result = await window.PuxaRotaAuth.reviewProfile(b.dataset.remoteReject, "rejected"); if (!result.ok) return toast("Não foi possível recusar este perfil."); await window.PuxaRotaAuth.recordAdminAction(b.dataset.accountId, b.dataset.remoteReject, "rejected", "Perfil recusado"); toast("Perfil recusado."); renderRemoteAdminProfiles(); });
    qa("[data-account-approve]").forEach((b) => b.onclick = async () => { const result = await window.PuxaRotaAuth.reviewAccount(b.dataset.accountApprove, true); if (!result.ok) return toast("Não foi possível aprovar esta conta."); toast("Conta aprovada."); renderRemoteAdminProfiles(); });
    qa("[data-dismiss-account]").forEach((b) => b.onclick = async () => { const result = await window.PuxaRotaAuth.dismissRegistration(b.dataset.dismissAccount); if (!result.ok) return toast("Não foi possível ocultar agora."); await window.PuxaRotaAuth.recordAdminAction(b.dataset.dismissAccount, b.dataset.profileId || null, "dismissed", "Ocultado da fila sem excluir cadastro"); toast("Cadastro ocultado da fila."); renderRemoteAdminProfiles(); });
    qa("[data-restore-account]").forEach((b) => b.onclick = async () => { const result = await window.PuxaRotaAuth.restoreRegistration(b.dataset.restoreAccount); if (!result.ok) return toast("Não foi possível restaurar agora."); await window.PuxaRotaAuth.recordAdminAction(b.dataset.restoreAccount, null, "restored", "Cadastro restaurado na fila"); toast("Cadastro restaurado na fila."); renderRemoteAdminProfiles(); });
    qa("[data-reopen-profile]").forEach((b) => b.onclick = async () => { const [profileResult, accountResult] = await Promise.all([window.PuxaRotaAuth.reviewProfile(b.dataset.reopenProfile, "pending"), window.PuxaRotaAuth.reviewAccount(b.dataset.accountId, false)]); if (!profileResult.ok || !accountResult.ok) return toast("Não foi possível reabrir a análise."); await window.PuxaRotaAuth.recordAdminAction(b.dataset.accountId, b.dataset.reopenProfile, "reopened", "Cadastro reaberto para análise"); toast("Cadastro reaberto para análise."); renderRemoteAdminProfiles(); });
    qa("[data-copy-contact]").forEach((b) => b.onclick = () => copyContact(b.dataset.copyContact, b.dataset.copyLabel || "Contato"));
    qa("[data-remote-contact]").forEach((b) => b.onclick = async () => { if (confirm("Confirme que o profissional autorizou o compartilhamento do contato.")) { const result = await window.PuxaRotaAuth.reviewProfile(b.dataset.remoteContact, "approved", "allowed"); if (!result.ok) return toast("Não foi possível liberar o contato."); toast("Contato liberado após confirmação."); renderRemoteAdminProfiles(); } });
    qa("[data-admin-message]").forEach((b) => b.onclick = async () => {
      const name = b.dataset.adminMessageName || "o usuário";
      const message = prompt("Campanha para " + name + " — texto exibido no app do usuário:", "");
      if (message === null || !message.trim()) return;
      let button = null;
      if (confirm("Adicionar um botão com link a esta mensagem?")) {
        if (confirm("Usar o botão de ENTRAR NO GRUPO DO FACEBOOK?")) {
          button = { label: "Entrar no grupo do Facebook", url: "https://www.facebook.com/groups/redeintegrativafretes/" };
        } else {
          const label = prompt("Texto do botão", "");
          if (label === null) return;
          const url = prompt("Link do botão (https://...)", "https://");
          if (url === null) return;
          if (!/^https?:\/\//i.test(url.trim())) return toast("O link deve começar com https://");
          button = { label: label.trim(), url: url.trim() };
        }
      }
      const result = await window.PuxaRotaAuth.sendAdminMessage(b.dataset.adminMessage, message.trim(), button);
      if (!result.ok) return toast("Não foi possível enviar a campanha.");
      toast("Campanha enviada para o usuário.");
    });
    qa("[data-profile-edit]").forEach((button) => button.onclick = async () => {
      const item = managedProfiles.get(button.dataset.profileEdit); if (!item) return;
      const patch = {};
      const display_name = prompt("Nome (use só o primeiro nome ou apelido profissional)", item.display_name); if (display_name === null) return; patch.display_name = display_name.trim();
      const whatsapp = prompt("WhatsApp com DDD (ex.: (11) 99999-9999)", item.whatsapp || ""); if (whatsapp === null) return;
      const phoneErr = phoneError(whatsapp);
      if (phoneErr) return toast(phoneErr);
      patch.whatsapp = normalizeBrPhone(whatsapp);
      const region = prompt("Região", item.region || ""); if (region === null) return; patch.region = region.trim();
      const postal_code = prompt("CEP", item.postal_code || ""); if (postal_code === null) return; patch.postal_code = postal_code.trim();
      const vehicle = prompt("Veículo", item.vehicle || ""); if (vehicle === null) return; patch.vehicle = vehicle.trim();
      const license_category = prompt("Habilitação", item.license_category || ""); if (license_category === null) return; patch.license_category = license_category.trim();
      const cargo_preference = prompt("Tipo de carga preferida", item.cargo_preference || ""); if (cargo_preference === null) return; patch.cargo_preference = cargo_preference.trim();
      const availability = prompt("Disponibilidade", item.availability || ""); if (availability === null) return; patch.availability = availability.trim();
      const result = await window.PuxaRotaAuth.editProfileAdmin(item.id, patch);
      if (!result.ok) return toast("Não foi possível salvar a edição.");
      toast("Cadastro editado.");
      renderRemoteAdminProfiles();
    });
    qa("[data-profile-publish]").forEach((button) => button.onclick = async () => { const visible = button.dataset.profilePublish === "true"; if (visible && !confirm("Confirme que esta pessoa autorizou publicar nome profissional, região, veículo e disponibilidade no PuxaRota. Telefone e contato continuam privados.")) return; const result = await window.PuxaRotaAuth.publishProfile(button.dataset.profileId, visible); if (!result.ok) return toast("Não foi possível atualizar a vitrine."); toast(visible ? "Perfil publicado na vitrine." : "Perfil retirado da vitrine."); renderRemoteAdminProfiles(); });
    renderAdminOpportunities();
  }
  function switchAdminTab(tabName) {
    qa("[data-admin-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.adminTab === tabName));
    qa("[data-admin-pane]").forEach((pane) => { pane.hidden = pane.dataset.adminPane !== tabName; });
    if (tabName === "broadcast") renderAdminBroadcast();
    if (tabName === "events") renderAdminEvents();
  }
  function renderAdminBroadcast() {
    const send = q("#admin-broadcast-send");
    if (!send || send.dataset.bound) return;
    send.dataset.bound = "1";
    send.onclick = async () => {
      const message = q("#admin-broadcast-message")?.value || "";
      if (!message.trim()) return toast("Escreva a mensagem primeiro.");
      const label = q("#admin-broadcast-button")?.value || "";
      const url = q("#admin-broadcast-url")?.value || "";
      let button = null;
      if (label.trim() && url.trim()) {
        if (!/^https?:\/\//i.test(url.trim())) return toast("O link deve começar com https://");
        button = { label: label.trim(), url: url.trim() };
      } else if (label.trim() || url.trim()) {
        return toast("Preencha texto e link do botão juntos, ou deixe os dois vazios.");
      }
      if (!confirm("Enviar este comunicado para TODOS os usuários cadastrados? Essa ação não pode ser desfeita.")) return;
      const result = await window.PuxaRotaAuth.sendAdminBroadcast(message, button);
      if (!result.ok) return toast("Não foi possível enviar o comunicado: " + result.reason);
      if (result.count === 0) return toast(result.reason || "Nenhum usuário para receber.");
      toast("Comunicado enviado para " + result.count + " usuário(s).");
      q("#admin-broadcast-message").value = "";
      q("#admin-broadcast-button").value = "";
      q("#admin-broadcast-url").value = "";
    };
  }
  async function renderAdminEvents() {
    if (!window.PuxaRotaAuth?.listNextEvent || !window.PuxaRotaAuth?.saveNextEvent) return;
    const save = q("#admin-event-save");
    if (!save || save.dataset.bound) return;
    save.dataset.bound = "1";
    const current = await window.PuxaRotaAuth.listNextEvent();
    if (current) {
      if (q("#admin-event-subject")) q("#admin-event-subject").value = current.subject || "";
      if (q("#admin-event-description")) q("#admin-event-description").value = current.description || "";
      if (q("#admin-event-date") && current.date) q("#admin-event-date").value = String(current.date).slice(0, 16);
      if (q("#admin-event-link")) q("#admin-event-link").value = current.link || "";
      if (q("#admin-event-minutes")) q("#admin-event-minutes").value = current.minutes || 90;
    }
    save.onclick = async () => {
      const subject = q("#admin-event-subject")?.value || "";
      if (!subject.trim()) return toast("Informe o título do encontro.");
      const rawDate = q("#admin-event-date")?.value || "";
      const event = {
        subject: subject.trim(),
        description: (q("#admin-event-description")?.value || "").trim(),
        date: rawDate ? new Date(rawDate).toISOString() : null,
        link: (q("#admin-event-link")?.value || "").trim(),
        minutes: Number(q("#admin-event-minutes")?.value) || 90
      };
      if (event.link && !/^https?:\/\//i.test(event.link)) return toast("O link deve começar com https://");
      const result = await window.PuxaRotaAuth.saveNextEvent(event);
      if (!result.ok) return toast("Não foi possível salvar o evento: " + result.reason);
      toast("Evento salvo. Aparece na tela de Rotas.");
      if (window.PuxaRotaRoutes?.applyNextEvent) window.PuxaRotaRoutes.applyNextEvent(event);
    };
  }
  qa("[data-admin-tab]").forEach((tab) => tab.onclick = () => switchAdminTab(tab.dataset.adminTab));
  const adminSearch = q("#admin-opportunity-search");
  if (adminSearch) adminSearch.oninput = () => applyOpportunitySearch(adminSearch.value);
  if (q("#admin-open")) q("#admin-open").onclick = () => {
    qa(".screen").forEach((x) => { x.hidden = true; x.classList.remove("active"); });
    q("#screen-admin").hidden = false; q("#screen-admin").classList.add("active");
    if (window.PuxaRotaAuth) window.PuxaRotaAuth.mountAdmin({ onAuthorized: () => { q("#admin-panel").hidden = false; renderRemoteAdminProfiles(); } });
  };
  if (q("#member-admin")) q("#member-admin").onclick = () => {
    qa(".screen").forEach((x) => { x.hidden = true; x.classList.remove("active"); });
    q("#screen-admin").hidden = false; q("#screen-admin").classList.add("active");
    window.PuxaRotaAuth?.mountAdmin({ onAuthorized: () => { q("#admin-panel").hidden = false; renderRemoteAdminProfiles(); } });
  };
  q("#admin-back").onclick = () => { q("#screen-admin").hidden = true; q("#screen-profile").hidden = false; };
  if (q("#admin-logout")) q("#admin-logout").onclick = async () => { if (window.PuxaRotaAuth) await window.PuxaRotaAuth.logout(); q("#admin-panel").hidden = true; };
  let publicProfiles = [];
  const journeyBadges = {
    "explorador-beneficios": ["✦", "Explorador de Benefícios"],
    "conectado-rede": ["⌁", "Conectado à Rede"],
    "voz-estrada": ["★", "Voz da Estrada"],
    "desbravador": ["◆", "Desbravador"]
  };
  function publicJourneyBadges(ids) {
    const companyBadges = { "empresa-vaga-clara": ["✓", "Vaga Clara"], "empresa-contrata-bem": ["◆", "Contratação Responsável"] };
    const badges = (ids || []).map((id) => journeyBadges[id] || companyBadges[id]).filter(Boolean);
    if (!badges.length) return "";
    return '<div class="driver-journey" aria-label="Selos da jornada">' + badges.map((badge) => '<span title="' + escapeText(badge[1]) + '"><i>' + badge[0] + '</i>' + escapeText(badge[1]) + '</span>').join("") + '</div>';
  }
  const regionUsage = new Map();
  function canonicalRegion(value) {
    const s = String(value || "").replace(/[–—]/g, "-").trim().replace(/\s+/g, " ").toLowerCase().replace(/\s*[-–,]\s*/g, ", ").replace(/\s+/g, " ");
    if (!s) return "";
    const stateMap = { "sp": "São Paulo, SP", "sao paulo": "São Paulo, SP", "grande sao paulo": "Grande São Paulo", "abc": "Grande São Paulo", "grande sao paulo e baixada santista": "São Paulo e região", "baixada santista": "São Paulo e região", "rj": "Rio de Janeiro, RJ", "rio de janeiro": "Rio de Janeiro, RJ", "mg": "Minas Gerais, MG", "minas gerais": "Minas Gerais, MG", "bh": "Belo Horizonte, MG", "belo horizonte": "Belo Horizonte, MG", "pr": "Paraná, PR", "parana": "Paraná, PR", "curitiba": "Curitiba, PR", "rs": "Rio Grande do Sul, RS", "rio grande do sul": "Rio Grande do Sul, RS", "porto alegre": "Porto Alegre, RS", "sc": "Santa Catarina, SC", "santa catarina": "Santa Catarina, SC", "itajai": "Itajaí, SC", "ba": "Bahia, BA", "bahia": "Bahia, BA", "pe": "Pernambuco, PE", "pernambuco": "Pernambuco, PE", "recife": "Recife, PE", "ce": "Ceará, CE", "ceara": "Ceará, CE", "df": "Brasília, DF", "brasilia": "Brasília, DF", "mt": "Mato Grosso, MT", "mato grosso": "Mato Grosso, MT", "cuiaba": "Cuiabá, MT" };
    const ufOfState = { "sao paulo": "sp", "rio de janeiro": "rj", "minas gerais": "mg", "parana": "pr", "rio grande do sul": "rs", "santa catarina": "sc", "bahia": "ba", "pernambuco": "pe", "ceara": "ce", "brasilia": "df", "mato grosso": "mt" };
    if (stateMap[s]) return stateMap[s];
    const stateFull = Object.entries(ufOfState).find(([name]) => new RegExp(name.replace(/ /g, "\\s+")).test(s) && /^(cidade de |municipio de )?/.test(s));
    if (stateFull) {
      const city = s.split(stateFull[0])[0].trim().replace(/,\s*$/, "");
      if (city && city.split(",").length <= 1) return city.replace(/\b\w/g, (c) => c.toUpperCase()) + ", " + stateFull[1].toUpperCase();
    }
    return String(value || "").trim();
  }
  function trackRegion(value, weight) {
    const normalized = canonicalRegion(value);
    if (!normalized) return;
    regionUsage.set(normalized, (regionUsage.get(normalized) || 0) + weight);
  }
  function buildRegionOptions() {
    const datalist = q("#region-options");
    if (!datalist) return;
    const options = [...regionUsage.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
    datalist.innerHTML = options.slice(0, 40).map(([value]) => '<option value="' + escapeText(value) + '">').join("");
  }
  function renderDrivers() {
    const list = q("#driver-list");
    if (!list) return;
    renderDriversJourneySummary();
    const region = q("#driver-region-filter")?.value || "";
    const vehicle = q("#driver-vehicle-filter")?.value || "";
    const license = q("#driver-license-filter")?.value || "";
    const cargo = q("#driver-cargo-filter")?.value || "";
    const profiles = publicProfiles.filter((profile) => (!region || profile.region === region) && (!vehicle || profile.vehicle === vehicle) && (!license || profile.license_category === license) && (!cargo || profile.cargo_preference === cargo));
    if (!profiles.length) {
      list.innerHTML = '<div class="empty"><strong>Ainda não há perfis publicados</strong><br>Quando motoristas e ajudantes autorizarem a publicação, eles aparecerão aqui.</div>';
      return;
    }
    const labels = { driver: "Motorista / agregado", helper: "Ajudante", company: "Transportadora" };
    const pretty = (value) => String(value || "").trim().replace(/^\w/, (c) => c.toUpperCase());
    list.innerHTML = profiles.map((p) => {
      const full = String(p.display_name || "").trim();
      const name = full.split(/\s+/)[0] || "Profissional";
      const typeIcon = p.profile_type === "helper" ? "🤝" : p.profile_type === "company" ? "🏢" : "🚚";
      const tags = [];
      if (p.vehicle) tags.push('<span class="tag tag-vehicle"><i aria-hidden="true">🚚</i><span>Veículo</span><b>' + escapeText(pretty(p.vehicle)) + '</b></span>');
      if (p.license_category) tags.push('<span class="tag tag-license"><i aria-hidden="true">🪪</i><span>Habilitação</span><b>' + escapeText(pretty(p.license_category)) + '</b></span>');
      if (p.cargo_preference) tags.push('<span class="tag tag-cargo"><i aria-hidden="true">📦</i><span>Carga</span><b>' + escapeText(pretty(p.cargo_preference)) + '</b></span>');
      if (p.region) tags.push('<span class="tag tag-region"><i aria-hidden="true">📍</i><span>Região</span><b>' + escapeText(pretty(p.region)) + '</b></span>');
      if (p.availability) tags.push('<span class="tag tag-availability"><i aria-hidden="true">🕒</i><span>Disponibilidade</span><b>' + escapeText(pretty(p.availability)) + '</b></span>');
      const body = tags.length
        ? '<div class="driver-tags">' + tags.join("") + '</div>'
        : '<p>' + escapeText(p.region || "Região a confirmar") + ' · ' + escapeText(p.vehicle || p.cargo_preference || "Atuação a confirmar") + '<br>' + escapeText(p.availability || "Disponibilidade a confirmar") + '</p>';
      return '<article class="driver-card"><div class="driver-head"><i class="driver-avatar" aria-hidden="true">' + typeIcon + '</i><div><small>' + escapeText(labels[p.profile_type] || "Profissional") + '</small><h2>' + escapeText(name) + '</h2></div></div>' + body + publicJourneyBadges(p.journey_badges) + '</article>';
    }).join('');
  }
  function renderDriversJourneySummary() {
    const box = q("#drivers-journey-summary");
    if (!box || !window.PuxaRotaRoutes?.nextLesson) return;
    const next = window.PuxaRotaRoutes.nextLesson();
    box.hidden = false;
    if (next?.locked) {
      box.innerHTML = '<div><small>SUA JORNADA</small><strong>Entre para acompanhar suas lições</strong></div><button type="button">Ver rotas <span>→</span></button>';
    } else if (next) {
      box.innerHTML = '<div><small>CONTINUE APRENDENDO · LIÇÃO ' + next.lessonNumber + '/' + next.totalLessons + '</small><strong>' + escapeText(next.lessonTitle) + '</strong><span>' + escapeText(next.routeTitle) + '</span></div><button type="button">Continuar <span>→</span></button>';
    } else {
      box.innerHTML = '<div><small>JORNADA EM DIA</small><strong>Você concluiu todas as lições</strong><span>Logo chegarão novas lições por aqui.</span></div><i aria-hidden="true">✓</i>';
    }
    q("button", box)?.addEventListener("click", () => window.PuxaRotaRoutes.openNextLesson());
  }
  async function loadPublicProfiles() {
    const list = q("#driver-list");
    if (!list) return;
    list.innerHTML = '<p class="saved-note">Carregando profissionais aprovados…</p>';
    publicProfiles = await (window.PuxaRotaAuth?.listPublicProfiles?.() || Promise.resolve([]));
    publicProfiles = publicProfiles.filter((profile) => profile.profile_type !== "company");
    const fill = (selector, values) => {
      const element = q(selector); if (!element) return;
      const selected = element.value;
      element.innerHTML = element.querySelector("option")?.outerHTML || '<option value="">Todos</option>';
      [...new Set(values.filter(Boolean))].sort().forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value; element.append(option); });
      element.value = selected;
    };
    fill("#driver-region-filter", publicProfiles.map((profile) => profile.region));
    fill("#driver-vehicle-filter", publicProfiles.map((profile) => profile.vehicle));
    fill("#driver-license-filter", publicProfiles.map((profile) => profile.license_category));
    fill("#driver-cargo-filter", publicProfiles.map((profile) => profile.cargo_preference));
    publicProfiles.forEach((profile) => trackRegion(profile.region, 3));
    buildRegionOptions();
    renderDrivers();
  }
  q("#driver-region-filter")?.addEventListener("change", renderDrivers);
  q("#driver-vehicle-filter")?.addEventListener("change", renderDrivers);
  q("#driver-license-filter")?.addEventListener("change", renderDrivers);
  q("#driver-cargo-filter")?.addEventListener("change", renderDrivers);
  window.addEventListener("puxarota:journey-updated", loadPublicProfiles);
  window.addEventListener("puxarota:journey-updated", renderDriversJourneySummary);

  draw();
  renderSaved();
  qa("#region-options option").forEach((option) => trackRegion(option.value, 1));
  buildRegionOptions();
  loadPublicProfiles();
  fetch("https://monitor-noticias-cyan.vercel.app/api/puxarota-signals", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then(renderSignals)
    .catch(() => console.info("Sinais públicos indisponíveis no momento."));
  fetch("https://raw.githubusercontent.com/redeintegrativa-bot/puxarota/main/jobs.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then((feed) => {
      if (!feed.jobs || !feed.jobs.length) return;
      allJobs = feed.jobs.filter((x) => x.status !== "expired").map((x) => ({
        id: x.id,
        company: x.company + (x.type === "official_registration" ? "" : " • anúncio público"),
        verified: x.type === "official_registration",
        sourceLabel: x.type === "official_registration" ? "VAGA OFICIAL" : (x.publisher_type === "driver" ? "PERFIL DE MOTORISTA" : x.publisher_type === "helper" ? "PERFIL DE AJUDANTE" : "ENVIADA POR EMPRESA"),
        title: x.title,
        origin: x.origin,
        lat: x.lat, lng: x.lng,
        area: x.area,
        routine: x.routine,
        tags: x.vehicles && x.vehicles.length ? x.vehicles : ["A confirmar"],
        model: x.model,
        payment: x.payment,
        score: x.confidence,
        detail: x.detail,
        url: x.url,
        reputation: x.reputation,
        provenance: "ai"
      }));
      jobs = allJobs.filter(j => j.status === "approved");
      if (pos) sortForPosition();
      i = 0;
      draw();
      renderSaved();
      allJobs.forEach((job) => trackRegion(job.origin, 2));
      buildRegionOptions();
      toast(jobs.length + " oportunidades sincronizadas");
      syncStatus("Sincronizado agora · " + jobs.length + " oportunidades ativas", true);
      window.PuxaRotaAuth?.listPublicOpportunities?.().then((approved) => {
        if (!approved.length) return;
        const mapped = approved.map((x) => ({ id: x.id, company: x.company, verified: true, sourceLabel: "VAGA OFICIAL", title: x.title, origin: x.origin, area: x.area, routine: x.routine, tags: x.vehicles?.length ? x.vehicles : ["A confirmar"], model: x.model, payment: x.payment, score: x.confidence, detail: x.detail, url: x.url, provenance: "company" }));
        const merged = new Map(allJobs.map((item) => [item.id || item.url, item])); mapped.forEach((item) => merged.set(item.id || item.url, item)); allJobs = [...merged.values()]; jobs = allJobs.filter(j => j.status === "approved"); if (pos) sortForPosition(); i = 0; draw(); renderSaved(); allJobs.forEach((job) => trackRegion(job.origin, 2)); buildRegionOptions(); syncStatus("Sincronizado agora · " + jobs.length + " oportunidades ativas", true);
      });
    })
    .catch(() => {
      console.info("Feed local indisponível; usando oportunidades de contingência.");
      syncStatus("Oportunidades indisponíveis · tente novamente em instantes", false);
      toast("Não foi possível carregar as oportunidades. Verifique sua conexão.");
    });
})();
<!-- Admin Opportunities Button -->
<div id="admin-opportunities-container" style="display:none;position:fixed;top:20px;right:20px;z-index:1000;">
  <button id="admin-opportunities-btn" style="padding:10px 20px;background:#ff9800;color:white;border:none;border-radius:4px;">Oportunidades Pendentes</button>
  <div id="admin-opportunities-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:1001;">
    <div style="background:white;padding:20px;border-radius:8px;width:80%;max-height:80vh;overflow:auto;">
      <h2>Oportunidades Pendentes de Aprovação</h2>
      <div id="admin-opportunities-list"></div>
      <button id="admin-close-btn" style="margin-top:10px;padding:8px 16px;background:#f44336;color:white;border:none;border-radius:4px;">Fechar</button>
    </div>
  </div>
</div>
<script>
async function loadAdminOpportunities() {
  if (!(window.PuxaRotaAuth?.account?.account_type === "admin")) return;
  const resp = await fetch('/api/opportunities/pending', {cache: 'no-store'});
  if (!resp.ok) { console.error('Failed to fetch pending'); return; }
  const data = await resp.json();
  const listDiv = document.getElementById('admin-opportunities-list');
  listDiv.innerHTML = '';
  if (!data.length) { listDiv.textContent = 'Nenhuma oportunidade pendente.'; return; }
  data.forEach(opp => {
    const div = document.createElement('div');
    div.style.border='1px solid #ddd;margin:10px 0;padding:10px;border-radius:4px';
    div.innerHTML = `<strong>${opp.title}</strong><br/>Empresa: ${opp.company || 'N/A'}<br/>Origem: ${opp.origin || 'N/A'}`;
    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Aprovar';
    approveBtn.style.marginRight='5px';
    approveBtn.onclick = async () => {
      const r = await fetch(`/api/opportunities/${opp.id}/approve`, {method:'POST',cache:'no-store'});
      if (r.ok) { loadAdminOpportunities(); }
    };
    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Recusar';
    rejectBtn.onclick = async () => {
      const reason = prompt('Motivo da recusa (opcional):');
      const r = await fetch(`/api/opportunities/${opp.id}/reject`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({reason: reason||''}),
        cache:'no-store'
      });
      if (r.ok) { loadAdminOpportunities(); }
    };
    div.appendChild(approveBtn);
    div.appendChild(rejectBtn);
    listDiv.appendChild(div);
  });
}
document.getElementById('admin-opportunities-btn').onclick = () => {
  document.getElementById('admin-opportunities-modal').style.display = 'flex';
  loadAdminOpportunities();
};
document.getElementById('admin-close-btn').onclick = () => {
  document.getElementById('admin-opportunities-modal').style.display = 'none';
};
// Show button if admin
if (window.PuxaRotaAuth?.account?.account_type === "admin") {
  document.getElementById('admin-opportunities-container').style.display = 'block';
}
</script>
