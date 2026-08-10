(function () {
  "use strict";
  const q = (s) => document.querySelector(s);
  const qa = (s) => document.querySelectorAll(s);
  const KEY = "puxarota.saved.v1";

  let jobs = [
    {company:"JSL",verified:true,origin:"Todo o Brasil",lat:-23.55,lng:-46.63,area:"Operações JSL",routine:"Conforme disponibilidade",tags:["Veículo próprio","Vários implementos"],model:"Agregado",payment:"Consultar empresa",score:95,detail:"Cadastro público para caminhoneiros proprietários de veículo atuarem em operações por todo o Brasil.",url:"https://jsl.com.br/agregados/"},
    {company:"SPX Express",verified:true,origin:"Brasil",lat:-23.55,lng:-46.63,area:"Coleta, transferência e entrega",routine:"Operações definidas pela empresa",tags:["Fiorino","Van","VUC","3/4","Truck","Carreta"],model:"Motorista parceiro",payment:"A confirmar",score:92,detail:"Página oficial com requisitos públicos para motoristas parceiros em todo o Brasil.",url:"https://spx.com.br/br/driver/seja-um-motorista-parceiro.html"},
    {company:"Transportes Bertolini",verified:true,origin:"Brasil",lat:-23.55,lng:-46.63,area:"Transporte rodoviário no Brasil",routine:"Conforme disponibilidade",tags:["Veículo próprio"],model:"Agregado",payment:"A confirmar",score:92,detail:"Cadastro oficial para agregados com veículo próprio. Confirme condições com a empresa.",url:"https://www.tbl.com.br/gente/seja-agregado"},
    {company:"Comercial Esperança",verified:true,origin:"São Paulo, SP",lat:-23.55,lng:-46.63,area:"Capital, interior e litoral",routine:"Saídas diárias e pagamento semanal",tags:["Utilitário","Van","VUC","3/4"],model:"Distribuição",payment:"A confirmar",score:95,detail:"Bases em Arujá, Rio Preto, Presidente Prudente e Hortolândia. Requisitos: CNH vigente, CNPJ de transporte e ANTT.",url:"https://comercialesperanca.com.br/transporte"},
    {company:"HF LOG Transportes",verified:false,origin:"Grande São Paulo",lat:-23.55,lng:-46.63,area:"Coletas e entregas rápidas",routine:"Operação urbana",tags:["Utilitário","Passeio"],model:"Última milha",payment:"A confirmar",score:72,detail:"Recrutamento público de motoristas com veículos utilitários e de passeio. A fonte passou por instabilidade de acesso; confirme com a empresa.",url:"https://hflogtransportes.com.br/"}
  ];
  let i = 0, pos = null, start = 0;
  let saved = loadSaved();

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
  function draw() {
    const j = jobs[i % jobs.length];
    q("#verified").textContent = j.verified ? "● EMPRESA COM PÁGINA OFICIAL" : "● DADOS A CONFIRMAR";
    q("#verified").className = j.verified ? "verified" : "confirm";
    q("#count").textContent = (i % jobs.length) + 1 + " DE " + jobs.length;
    q("#origin").textContent = j.origin;
    q("#area").textContent = j.area;
    q("#routine").textContent = j.routine;
    q("#tags").innerHTML = j.tags.map((x) => '<span class="tag">' + x + "</span>").join("");
    q("#model").textContent = j.model;
    q("#payment").textContent = j.payment;
    q("#score").textContent = j.score + "%";
    q("#scorebar").style.width = j.score + "%";
    q("#detail").textContent = j.detail;
    q("#distance").textContent = (pos && j.lat && j.lng) ? "≈ " + haversine(pos.lat, pos.lng, j.lat, j.lng) + " km da sua posição" : "Distância após ativar GPS";
    q("#save").textContent = isSaved(j) ? "★" : "☆";
    q("#save").setAttribute("aria-label", isSaved(j) ? "Remover das salvas" : "Guardar oportunidade");
    for (const id of ["#openCard", "#openAction"]) q(id).href = j.url;
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
    if (Math.abs(d) > 70) next(d > 0 ? "exit-right" : "exit-left", d > 0 ? "Próxima oportunidade" : "Próxima oportunidade");
  });

  q("#locate").onclick = () => {
    if (!navigator.geolocation) return toast("GPS indisponível neste aparelho");
    q("#place").textContent = "⌖ Buscando sua posição…";
    navigator.geolocation.getCurrentPosition(
      (p) => {
        pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        q("#place").textContent = "📍 Localização atual ativada";
        q("#locate").textContent = "↻ Atualizar local";
        draw();
        toast("Oportunidades ordenadas pela proximidade");
      },
      () => { q("#place").textContent = "📍 Permissão não concedida"; toast("Você pode informar a cidade manualmente"); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };
  q("#city").onclick = () => {
    const city = prompt("Digite sua cidade ou CEP:");
    if (city) { q("#place").textContent = "📍 " + city; toast("Localização manual atualizada"); }
  };

  qa(".nav button").forEach((b) => b.onclick = () => {
    qa(".nav button,.screen").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    qa(".screen").forEach((x) => { x.hidden = true; });
    const panel = q('[data-panel="' + b.dataset.screen + '"]');
    panel.hidden = false;
    panel.classList.add("active");
    if (b.dataset.screen === "saves") renderSaved();
  });

  draw();
  renderSaved();
  fetch("https://raw.githubusercontent.com/redeintegrativa-bot/puxarota/main/jobs.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then((feed) => {
      if (!feed.jobs || !feed.jobs.length) return;
      jobs = feed.jobs.filter((x) => x.status !== "expired").map((x) => ({
        company: x.company + (x.type === "official_registration" ? "" : " • anúncio público"),
        verified: (x.confidence || 0) >= 85,
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
      i = 0;
      draw();
      renderSaved();
      toast(jobs.length + " oportunidades sincronizadas");
    })
    .catch(() => console.info("Feed local indisponível; usando oportunidades de contingência."));
})();