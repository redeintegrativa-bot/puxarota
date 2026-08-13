(function () {
  "use strict";
  const q = (s) => document.querySelector(s);
  const qa = (s) => document.querySelectorAll(s);
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
  async function reversePosition(position) {
    const url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + encodeURIComponent(position.lat) + "&longitude=" + encodeURIComponent(position.lng) + "&localityLanguage=pt";
    const data = await fetch(url).then((response) => response.ok ? response.json() : Promise.reject());
    return [data.city || data.locality || data.principalSubdivision, data.principalSubdivisionCode?.split("-").pop()].filter(Boolean).join(", ") || "Localização atual";
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
    q("#tags").innerHTML = j.tags.map((x) => '<span class="tag">' + x + "</span>").join("");
    q("#model").textContent = j.model;
    q("#payment").textContent = j.payment;
    q("#detail").textContent = j.detail;
    q("#distance").textContent = (pos && j.lat && j.lng) ? "≈ " + haversine(pos.lat, pos.lng, j.lat, j.lng) + " km da sua posição" : isNational(j) ? "Confirme com a empresa se há base na sua região" : "Ative o GPS ou informe sua cidade";
    q("#save").textContent = isSaved(j) ? "★" : "☆";
    q("#save").setAttribute("aria-label", isSaved(j) ? "Remover das salvas" : "Guardar oportunidade");
    q("#openAction").href = j.url;
    q("#interest-open").hidden = Boolean(j.verified);
    if (j.verified) { q("#interest-box").hidden = true; }
  }
  function currentJob() { return jobs[i % jobs.length]; }
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
      try { q("#profile-region").value = await reversePosition({ lat: p.coords.latitude, lng: p.coords.longitude }); }
      catch (_) { q("#profile-region").value = "Localização atual"; }
      q("#profile-location-new").textContent = "Localização preenchida";
    }, () => { q("#profile-location-new").textContent = "Usar minha localização"; toast("GPS indisponível. Informe seu CEP abaixo."); q("#profile-cep").focus(); });
  };
  qa(".role-choice").forEach((b) => b.onclick = () => openProfile(b.dataset.kind));
  openProfile(q("#profile-kind").value || "Motorista");
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
  q("#profile-form").onsubmit = (event) => {
    event.preventDefault();
    const text = ["Olá! Vim pelo PuxaRota e quero encontrar uma rota.", "Perfil: " + q("#profile-kind").value, "Região: " + q("#profile-region").value.trim(), "Veículo: " + q("#profile-vehicle").value.trim(), "Carga de preferência: " + (q("#profile-cargo").value.trim() || "A definir"), "Ajudante: " + q("#profile-helper").value].join("\n");
    window.open("https://wa.me/5511990163686?text=" + encodeURIComponent(text), "_blank", "noopener");
    toast("Perfil preparado para nós");
  };
  q("#profile-form").onsubmit = (event) => {
    event.preventDefault();
    const text = [
      "Olá! Vim pelo PuxaRota e quero cadastrar meu perfil.",
      "Perfil: " + q("#profile-kind").value,
      "Nome: " + q("#profile-name-new").value.trim(),
      "E-mail: " + (q("#profile-email-new").value.trim() || "Não informado"),
      "Telefone: " + q("#profile-country-new").value + " (" + q("#profile-area-new").value.trim() + ") " + q("#profile-phone-new").value.trim(),
      "Região: " + q("#profile-region").value.trim(),
      "CEP: " + (q("#profile-cep").value.trim() || "Não informado"),
      "Outras regiões: " + (q("#profile-regions").value.trim() || "Não informadas"),
      "Veículo ou rota: " + q("#profile-vehicle").value.trim(),
      "Carga/operação: " + (q("#profile-cargo").value.trim() || "A definir"),
      "Ajudante: " + q("#profile-helper").value,
      "Disponibilidade: " + (q("#profile-availability").value.trim() || "Não informada"),
      "Experiência: " + (q("#profile-experience").value.trim() || "Não informada"),
      "Empresa: " + (q("#profile-company").value.trim() || "Não informada"),
      "Rota anunciada: " + (q("#profile-route").value.trim() || "Não informada"),
      "Validade: " + (q("#profile-expiry").value || "Não informada"),
      "Contato da empresa: " + (q("#profile-company-contact").value.trim() || "Não informado")
    ].join("\n");
    localStorage.setItem("puxarota-profile", JSON.stringify({
      "profile-name-new": q("#profile-name-new").value.trim(), "profile-email-new": q("#profile-email-new").value.trim(),
      "profile-country-new": q("#profile-country-new").value, "profile-area-new": q("#profile-area-new").value.trim(),
      "profile-phone-new": q("#profile-phone-new").value.trim(), "profile-kind": q("#profile-kind").value,
      "profile-region": q("#profile-region").value.trim(), "profile-vehicle": q("#profile-vehicle").value.trim(),
      "profile-cargo": q("#profile-cargo").value.trim(), "profile-helper": q("#profile-helper").value
    }));
    window.open("https://wa.me/5511990163686?text=" + encodeURIComponent(text), "_blank", "noopener");
    toast("Cadastro preparado para nós");
  };

  qa(".nav button").forEach((b) => b.onclick = () => {
    qa(".nav button,.screen").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    qa(".screen").forEach((x) => { x.hidden = true; });
    const panel = q('[data-panel="' + b.dataset.screen + '"]');
    panel.hidden = false;
    panel.classList.add("active");
    if (b.dataset.screen === "saves") renderSaved();
    if (b.dataset.screen === "drivers") renderDrivers();
  });
  const adminRecords = () => { try { return JSON.parse(localStorage.getItem("puxarota-admin-records") || "[]"); } catch (_) { return []; } };
  function renderAdmin() { q("#admin-list").innerHTML = adminRecords().map((r) => '<article><small>' + r.type + '</small><strong>' + r.name + '</strong><span>' + r.region + " · " + r.vehicle + '</span></article>').join("") || '<p class="saved-note">Nenhum cadastro local ainda.</p>'; }
  q("#admin-open").onclick = () => { qa(".screen").forEach((x) => { x.hidden = true; x.classList.remove("active"); }); q("#screen-admin").hidden = false; q("#screen-admin").classList.add("active"); renderAdmin(); };
  q("#admin-back").onclick = () => { q("#screen-admin").hidden = true; q("#screen-profile").hidden = false; };
  q("#admin-form").onsubmit = (event) => { event.preventDefault(); const records = adminRecords(); records.unshift({ type: q("#admin-type").value, name: q("#admin-name").value.trim(), phone: q("#admin-phone").value.trim(), region: q("#admin-region").value.trim(), vehicle: q("#admin-vehicle").value.trim(), notes: q("#admin-notes").value.trim(), createdAt: new Date().toISOString() }); localStorage.setItem("puxarota-admin-records", JSON.stringify(records)); event.target.reset(); renderAdmin(); toast("Cadastro salvo somente neste aparelho"); };
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
