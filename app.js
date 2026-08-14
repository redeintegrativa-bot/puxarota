(function () {
  "use strict";
  const q = (s) => document.querySelector(s);
  const qa = (s) => document.querySelectorAll(s);
  const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const KEY = "puxarota.saved.v1";
  const THEME_KEY = "puxarota.theme.v1";
  let deferredInstallPrompt = null;

  let jobs = [
    {company:"JSL",verified:true,origin:"Todo o Brasil",lat:-23.55,lng:-46.63,area:"Operações JSL",routine:"Conforme disponibilidade",tags:["Veículo próprio","Vários implementos"],model:"Agregado",payment:"Consultar empresa",score:95,detail:"Cadastro público para caminhoneiros proprietários de veículo atuarem em operações por todo o Brasil.",url:"https://jsl.com.br/agregados/"},
    {company:"SPX Express",verified:true,origin:"Brasil",lat:-23.55,lng:-46.63,area:"Coleta, transferência e entrega",routine:"Operações definidas pela empresa",tags:["Fiorino","Van","VUC","3/4","Truck","Carreta"],model:"Motorista parceiro",payment:"A confirmar",score:92,detail:"Página oficial com requisitos públicos para motoristas parceiros em todo o Brasil.",url:"https://spx.com.br/br/driver/seja-um-motorista-parceiro.html"},
    {company:"Transportes Bertolini",verified:true,origin:"Brasil",lat:-23.55,lng:-46.63,area:"Transporte rodoviário no Brasil",routine:"Conforme disponibilidade",tags:["Veículo próprio"],model:"Agregado",payment:"A confirmar",score:92,detail:"Cadastro oficial para agregados com veículo próprio. Confirme condições com a empresa.",url:"https://www.tbl.com.br/gente/seja-agregado"},
    {company:"Comercial Esperança",verified:true,origin:"São Paulo, SP",lat:-23.55,lng:-46.63,area:"Capital, interior e litoral",routine:"Saídas diárias e pagamento semanal",tags:["Utilitário","Van","VUC","3/4"],model:"Distribuição",payment:"A confirmar",score:95,detail:"Bases em Arujá, Rio Preto, Presidente Prudente e Hortolândia. Requisitos: CNH vigente, CNPJ de transporte e ANTT.",url:"https://comercialesperanca.com.br/transporte"},
    {company:"HF LOG Transportes",verified:false,origin:"Grande São Paulo",lat:-23.55,lng:-46.63,area:"Coletas e entregas rápidas",routine:"Operação urbana",tags:["Utilitário","Passeio"],model:"Última milha",payment:"A confirmar",score:72,detail:"Recrutamento público de motoristas com veículos utilitários e de passeio. A fonte passou por instabilidade de acesso; confirme com a empresa.",url:"https://hflogtransportes.com.br/"}
  ];
  let i = 0, pos = null, start = 0;
  let allJobs = jobs.slice();
  let saved = loadSaved();

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
    toast("PuxaRota instalado no celular");
  });
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
  function sortForPosition() {
    jobs = allJobs.slice().sort((a, b) => {
      const da = a.lat && a.lng ? haversine(pos.lat, pos.lng, a.lat, a.lng) : Number.MAX_SAFE_INTEGER;
      const db = b.lat && b.lng ? haversine(pos.lat, pos.lng, b.lat, b.lng) : Number.MAX_SAFE_INTEGER;
      const groupA = da <= 250 ? 0 : isNational(a) ? 1 : 2;
      const groupB = db <= 250 ? 0 : isNational(b) ? 1 : 2;
      return groupA - groupB || da - db || b.score - a.score;
    });
    i = 0;
  }
  function usePosition(position, label) {
    pos = position;
    sortForPosition();
    q("#place").textContent = "📍 " + label;
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
    q("#origin").textContent = isNational(j) ? "Atuação nacional" : j.origin;
    q("#area").textContent = j.area;
    q("#routine").textContent = j.routine;
    const operation = j.area && /distrib|coleta|entrega|última|ultima|carga|transporte/i.test(j.area) ? "Operação de carga" : "Operação a confirmar";
    q("#tags").innerHTML = j.tags.map((x) => renderTag(x, "vehicle-tag " + vehicleTone(x))).join("") + renderTag(operation, "cargo-tag") + renderTag(cargoTag(j), "cargo-special-tag");
    q("#model").textContent = j.model;
    q("#payment").textContent = j.payment;
    q("#detail").textContent = j.detail;
    q("#distance").textContent = (pos && j.lat && j.lng) ? "≈ " + haversine(pos.lat, pos.lng, j.lat, j.lng) + " km da sua posição" : isNational(j) ? "Confirme com a empresa se há base na sua região" : "Ative o GPS ou informe sua cidade";
    q("#save").textContent = isSaved(j) ? "★" : "☆";
    q("#save").setAttribute("aria-label", isSaved(j) ? "Remover das salvas" : "Guardar oportunidade");
    q("#openAction").href = j.url;
    q("#openAction").onclick = async (event) => {
      if (window.PuxaRotaAuth && !(await window.PuxaRotaAuth.hasSession())) {
        event.preventDefault();
        openProfile("Motorista");
        const message = q("#account-status");
        if (message) message.textContent = "Crie seu acesso gratuito para abrir o contato completo";
        toast("Entre ou crie sua conta para continuar");
      }
    };
    q("#interest-open").hidden = Boolean(j.verified);
    if (j.verified) { q("#interest-box").hidden = true; }
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
  function cargoTag(j) {
    const text = [j.company, j.area, j.detail, j.model, ...(j.tags || [])].join(" ").toLowerCase();
    if (/refriger|frigor|congel/.test(text)) return "Refrigerada";
    if (/perig|quím|quim|inflam/.test(text)) return "Carga perigosa";
    if (/frágil|fragil|vidro/.test(text)) return "Carga frágil";
    if (/viva|animal|agro/.test(text)) return "Carga viva";
    return "Carga geral";
  }
  function renderTag(label, kind) {
    return '<span class="tag ' + (kind || "") + '" title="' + String(label).replace(/"/g, "&quot;") + '"><span class="tag-icon" aria-hidden="true">' + tagIcon(label) + '</span><span>' + label + '</span></span>';
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
  const interestBox = q("#interest-box");
  q("#interest-open").onclick = () => { interestBox.hidden = false; q("#interest-open").hidden = true; q("#interest-name").focus(); };
  q("#interest-cancel").onclick = () => { interestBox.hidden = true; q("#interest-open").hidden = false; };
  q("#interest-form").onsubmit = (event) => {
    event.preventDefault();
    const j = currentJob();
    const message = ["Olá! Tenho interesse nesta vaga do PuxaRota e gostaria que meu contato fosse encaminhado à empresa responsável.", "Vaga: " + j.company + " — " + (j.model || "oportunidade"), "Nome: " + q("#interest-name").value.trim(), "Perfil: " + q("#interest-kind").value, "WhatsApp: " + q("#interest-phone").value.trim(), "Região: " + q("#interest-region").value.trim(), "Mensagem: " + (q("#interest-message").value.trim() || "Gostaria de saber mais detalhes.")].join("\n");
    window.open("https://wa.me/5511990163686?text=" + encodeURIComponent(message), "_blank", "noopener");
    interestBox.hidden = true; q("#interest-open").hidden = false; event.target.reset(); toast("Mensagem preparada no WhatsApp");
  };
  function openProfile(kind) {
    q("#profile-kind").value = kind;
    qa(".role-choice").forEach((b) => b.classList.toggle("active", b.dataset.kind === kind));
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
  qa(".role-choice").forEach((b) => b.onclick = () => openProfile(b.dataset.kind));
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
    if (Math.abs(d) > 70) next(d > 0 ? "exit-right" : "exit-left", "Próxima oportunidade");
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
    try { const found = await geocodePlace(city); usePosition(found.position, found.label); }
    catch (e) { q("#place").textContent = "📍 Região não encontrada"; toast("Tente cidade e estado, por exemplo: Recife, PE"); }
  };
  q("#scope").onclick = () => {
    pos = null; jobs = allJobs.slice(); i = 0;
    q("#place").textContent = "📍 Brasil inteiro";
    q("#scope").hidden = true;
    q("#locate").textContent = "⌖ Usar GPS";
    draw();
    toast("Mostrando oportunidades de todo o Brasil");
  };
  q("#profile-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!window.PuxaRotaAuth?.saveProfile) return toast("A conexão segura está indisponível. Tente novamente.");
    const remote = await window.PuxaRotaAuth.saveProfile({ kind: q("#profile-kind").value, name: q("#profile-name-new").value.trim(), whatsapp: q("#profile-country-new").value + " (" + q("#profile-area-new").value.trim() + ") " + q("#profile-phone-new").value.trim(), region: q("#profile-region").value.trim(), postalCode: q("#profile-cep").value.trim(), vehicle: q("#profile-vehicle").value.trim(), license: q("#profile-license")?.value || "Não informada", cargo: q("#profile-cargo").value.trim(), availability: q("#profile-availability").value.trim(), consentData: q("#profile-consent")?.checked === true });
    if (!remote.ok) return toast("Não foi possível salvar agora. Revise a conexão e tente novamente.");
    toast("Perfil salvo. Você pode acompanhar o status nesta tela.");
  };

  window.addEventListener("puxarota:auth", (event) => {
    const label = q("#profile-nav-label");
    if (label) label.textContent = event.detail?.session ? "Perfil" : "Entrar";
  });
  function renderRoutes() {
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
  function phoneForWhatsApp(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
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
  async function renderRemoteAdminProfiles() {
    if (!window.PuxaRotaAuth?.listAdminProfiles) return;
    const result = await window.PuxaRotaAuth.listAdminProfiles();
    if (!result.ok) return;
    const list = q("#admin-list");
    const accounts = new Map(result.accounts.map((account) => [account.user_id, account]));
    const remote = result.profiles.filter((r) => !accounts.get(r.user_id)?.admin_dismissed_at).map((r) => {
      const pending = r.status === "pending";
      const contactPending = r.contact_release === "pending";
      const account = accounts.get(r.user_id);
      const accountPending = account && !account.is_approved;
      const actions = (pending || accountPending ? `<button type="button" data-registration-approve="${r.id}" data-account-id="${r.user_id}">Aprovar cadastro</button>` : "") + (pending ? `<button type="button" data-remote-reject="${r.id}" data-account-id="${r.user_id}">Recusar perfil</button>` : `<button type="button" data-reopen-profile="${r.id}" data-account-id="${r.user_id}">Reabrir análise</button>`) + (r.status === "approved" && contactPending ? `<button type="button" data-remote-contact="${r.id}">Liberar contato após consentimento</button>` : "") + `<button type="button" data-dismiss-account="${r.user_id}" data-profile-id="${r.id}">Ocultar da fila</button>` + contactActions({ email: account?.email_snapshot, phone: r.whatsapp });
      const details = `<details><summary>Ver dados enviados</summary><p>Cadastro: ${formatAdminDate(r.created_at)}<br>CEP: ${escapeText(r.postal_code || "não informado")}<br>CNH: ${escapeText(r.license_category || "não informada")}<br>Carga: ${escapeText(r.cargo_preference || "não informada")}<br>Disponibilidade: ${escapeText(r.availability || "não informada")}<br>Consentimento de dados: ${r.consent_data ? "sim" : "não"}</p></details>`;
      return `<article><small>${escapeText(r.profile_type)} · perfil ${escapeText(r.status)} · conta ${account?.is_approved ? "aprovada" : "em análise"}</small><strong>${escapeText(r.display_name)}</strong><span>${escapeText(r.region || "Região não informada")} · ${escapeText(r.vehicle || "Veículo não informado")}</span>${details}<div class="admin-actions">${actions}</div></article>`;
    }).join("");
    list.innerHTML = remote || '<p class="saved-note">Nenhum cadastro recebido ainda.</p>';
    const profileUsers = new Set(result.profiles.map((profile) => profile.user_id));
    const accountsList = q("#admin-accounts-list");
    const incompleteAccounts = result.accounts.filter((account) => !profileUsers.has(account.user_id) && !account.admin_dismissed_at);
    if (accountsList) accountsList.innerHTML = incompleteAccounts.map((account) => `<article><small>${escapeText(account.account_type)} · ${account.is_approved ? "conta aprovada" : "aguardando aprovação"}</small><strong>${escapeText(account.display_name || "Conta sem nome informado")}</strong><span>Conta criada em ${formatAdminDate(account.created_at)} · perfil ainda não enviado.</span><div class="admin-actions">${account.is_approved ? "" : `<button type="button" data-account-approve="${account.user_id}">Aprovar conta</button>`}<button type="button" data-dismiss-account="${account.user_id}">Ocultar da fila</button>${contactActions({ email: account.email_snapshot, phone: account.phone })}</div></article>`).join("") || '<p class="saved-note">Nenhuma conta aguardando o envio do perfil.</p>';
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
  }
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
  function renderDrivers() {
    const list = q("#driver-list");
    const profiles = [];
    if (!profiles.length) {
      list.innerHTML = '<div class="empty"><strong>Ainda não há perfis publicados</strong><br>Quando motoristas e ajudantes autorizarem a publicação, eles aparecerão aqui.</div>';
      return;
    }
    list.innerHTML = profiles.map((p) => '<article class="driver-card"><small>' + p.kind + '</small><h2>' + p.region + '</h2><p>' + p.vehicle + ' · ' + p.cargo + '</p><button type="button">Tenho interesse</button></article>').join('');
  }

  draw();
  renderSaved();
  fetch("https://raw.githubusercontent.com/redeintegrativa-bot/monitor-noticias/master/puxarota-signals.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then(renderSignals)
    .catch(() => console.info("Sinais públicos indisponíveis no momento."));
  fetch("https://raw.githubusercontent.com/redeintegrativa-bot/puxarota/main/jobs.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then((feed) => {
      if (!feed.jobs || !feed.jobs.length) return;
      allJobs = feed.jobs.filter((x) => x.status !== "expired").map((x) => ({
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
        url: x.url
      }));
      jobs = allJobs.slice();
      if (pos) sortForPosition();
      i = 0;
      draw();
      renderSaved();
      toast(jobs.length + " oportunidades sincronizadas");
      syncStatus("Sincronizado agora · " + jobs.length + " oportunidades ativas", true);
    })
    .catch(() => console.info("Feed local indisponível; usando oportunidades de contingência."));
})();
