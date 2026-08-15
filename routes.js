(function () {
  "use strict";

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const store = window.Retroix?.storage ? window.Retroix.storage("puxarota-routes") : {
    get(key, fallback) { try { const value = localStorage.getItem("puxarota.routes." + key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem("puxarota.routes." + key, JSON.stringify(value)); } catch (_) {} return value; }
  };
  const RIPIO_LINK = "https://join.ripio.com/ref/ricardo_m_76";
  const CRYPTO_ARTICLE = "https://www.redeintegrativa.com/rede/blog/crypto-para-iniciantes-2026";
  const COMMUNITY_LINK = "https://www.facebook.com/groups/redeintegrativafretes/";
  const SHARE_TEXT = "Estou avançando nas Rotas do PuxaRota e aprendendo com a Rede Integrativa.";
  const audio = window.Retroix?.audio ? window.Retroix.audio({ volume: 0.18 }) : null;

  const ROUTES = [
    {
      id: "beneficios-ripio",
      audience: "professional",
      category: "Benefícios",
      title: "Aprenda a usar a Ripio",
      short: "Cripto sem complicação, cashback e cadastro seguro.",
      icon: "₿",
      badge: { id: "explorador-beneficios", icon: "✦", name: "Explorador de Benefícios", description: "Concluiu a jornada educativa sobre cripto, cashback e Ripio." },
      sponsor: "Conteúdo educativo · link de indicação",
      lessons: [
        { title: "Cripto sem complicação", eyebrow: "LIÇÃO 1 · 2 MIN", summary: "Dinheiro digital que circula pela internet. Pode facilitar pagamentos internacionais, mas o preço oscila.", checkpoint: { question: "Qual atitude é mais segura?", options: ["Estudar antes de usar", "Acreditar em lucro garantido"], correct: 0 }, action: { label: "Ler o guia completo", url: CRYPTO_ARTICLE, event: "crypto_article_opened" }, done: "Avançar" },
        { title: "O que é cashback", eyebrow: "LIÇÃO 2 · 1 MIN", summary: "Você paga e uma parte pode voltar depois, conforme as regras da oferta.", checkpoint: { question: "O cashback é sempre igual?", options: ["Não, depende da oferta", "Sim, nunca muda"], correct: 0 }, done: "Avançar" },
        { title: "Baixe o aplicativo oficial", eyebrow: "LIÇÃO 3 · AÇÃO", summary: "Acesse a página da campanha e escolha a loja oficial do seu celular. Evite APKs e links recebidos de desconhecidos.", action: { label: "Baixar a Ripio", url: RIPIO_LINK, event: "ripio_download_opened" }, done: "Já baixei, continuar" },
        { title: "Cadastro pelo link", eyebrow: "LIÇÃO 4 · AÇÃO", summary: "Comece o cadastro pelo link da campanha para que a indicação seja vinculada corretamente. Você não paga a mais por isso.", bullets: ["Crie uma senha exclusiva.", "Ative biometria ou autenticação em duas etapas.", "Nunca compartilhe código de acesso."], action: { label: "Fazer meu cadastro", url: RIPIO_LINK, event: "ripio_signup_opened" }, done: "Cadastro iniciado" },
        { title: "Pagando e acompanhando", eyebrow: "LIÇÃO 5 · FINAL", summary: "Escolha a oferta, confira as regras e acompanhe o retorno no app.", checkpoint: { question: "Antes de pagar, você deve…", options: ["Conferir as condições", "Ignorar prazo e percentual"], correct: 0 }, action: { label: "Ativar de vez", url: RIPIO_LINK, event: "ripio_activation_opened" }, done: "Ganhar meu selo" }
      ]
    },
    {
      id: "comunidade",
      audience: "professional",
      category: "Comunidade",
      title: "Entre para a Rede de Fretes",
      short: "Conecte-se a motoristas, agregados e oportunidades.",
      icon: "◎",
      badge: { id: "conectado-rede", icon: "⌁", name: "Conectado à Rede", description: "Entrou na comunidade da Rede Integrativa de Fretes." },
      lessons: [
        { title: "Conheça a comunidade", eyebrow: "PASSO 1 · 1 MIN", summary: "A Rede Integrativa reúne profissionais da estrada, transportadoras, oportunidades e informações úteis.", done: "Quero conhecer" },
        { title: "Entre no grupo", eyebrow: "PASSO 2 · AÇÃO", summary: "Abra o grupo oficial no Facebook e solicite sua participação.", action: { label: "Abrir grupo no Facebook", url: COMMUNITY_LINK, event: "community_group_opened" }, done: "Solicitei para entrar" },
        { title: "Faça parte da conversa", eyebrow: "PASSO 3 · CONCLUSÃO", summary: "Ao participar, preserve seus dados, confirme as condições diretamente com as empresas e ajude a manter a comunidade segura.", bullets: ["Não envie documentos em comentários públicos.", "Desconfie de cobrança antecipada.", "Reporte oportunidades suspeitas."], done: "Concluir missão" }
      ]
    },
    {
      id: "voz-estrada",
      audience: "professional",
      category: "Colaboração",
      title: "Compartilhe a Rede",
      short: "Convide outros profissionais e fortaleça a comunidade.",
      icon: "↗",
      badge: { id: "voz-estrada", icon: "★", name: "Voz da Estrada", description: "Compartilhou o PuxaRota com outros profissionais." },
      lessons: [
        { title: "Espalhe uma rota útil", eyebrow: "MISSÃO RÁPIDA", summary: "Compartilhe o PuxaRota com alguém que possa aproveitar oportunidades e conteúdos da Rede.", share: true, done: "Compartilhei, concluir" }
      ]
    },
    {
      id: "empresa-vaga-confiavel", audience: "company", category: "Para empresas",
      title: "Publique uma vaga confiável", short: "Informações claras atraem profissionais mais alinhados.", icon: "▦",
      badge: { id: "empresa-vaga-clara", icon: "✓", name: "Vaga Clara", description: "Aprendeu a publicar oportunidades completas e verificáveis." },
      lessons: [
        { title: "Comece pelo essencial", eyebrow: "TRECHO 1 · 1 MIN", summary: "Informe rota, veículo, rotina e condição antes de publicar.", checkpoint: { question: "O que gera mais confiança?", options: ["Condições claras", "Promessa sem detalhes"], correct: 0 }, done: "Avançar" },
        { title: "Proteja quem se candidata", eyebrow: "TRECHO 2 · 1 MIN", summary: "Nunca peça pagamento antecipado, senha ou documento em comentário público.", checkpoint: { question: "Onde pedir documentos?", options: ["Em canal seguro e autorizado", "Em qualquer comentário"], correct: 0 }, done: "Avançar" },
        { title: "Revise antes de publicar", eyebrow: "TRECHO 3 · FINAL", summary: "Confira prazo, região e contato responsável. A vaga entra para análise antes de aparecer.", bullets: ["Sem cobrança antecipada.", "Contato empresarial verificável.", "Prazo e condições atualizados."], done: "Ganhar selo" }
      ]
    },
    {
      id: "empresa-contratacao-responsavel", audience: "company", category: "Para empresas",
      title: "Contrate com consentimento", short: "Do pedido de acesso à avaliação final, com histórico.", icon: "◎",
      badge: { id: "empresa-contrata-bem", icon: "◆", name: "Contratação Responsável", description: "Concluiu a jornada de contato, contratação e avaliação segura." },
      lessons: [
        { title: "Solicite, não capture", eyebrow: "TRECHO 1 · 1 MIN", summary: "Peça acesso ao perfil. O contato só é liberado após autorização do profissional.", checkpoint: { question: "Quem libera o contato?", options: ["O profissional", "A empresa sozinha"], correct: 0 }, done: "Avançar" },
        { title: "Registre a contratação", eyebrow: "TRECHO 2 · 1 MIN", summary: "Vincule empresa, profissional e vaga para formar um histórico confiável para os dois lados.", done: "Avançar" },
        { title: "Avalie uma relação real", eyebrow: "TRECHO 3 · FINAL", summary: "A avaliação fica disponível depois da contratação e aparece como média, sem expor dados privados.", checkpoint: { question: "Quando avaliar?", options: ["Após uma contratação real", "Antes de qualquer contato"], correct: 0 }, done: "Ganhar selo" }
      ]
    }
  ];

  const FUTURE_ROUTES = [
    { icon: "⬡", title: "Segurança Digital", text: "Golpes, documentos e proteção do WhatsApp." },
    { icon: "◫", title: "Finanças da Estrada", text: "Custos, reserva e organização por rota." }
  ];
  const GRADES = [
    { min: 0, name: "Na Partida" },
    { min: 1, name: "Explorador" },
    { min: 3, name: "Conectado" },
    { min: 5, name: "Desbravador" },
    { min: 10, name: "Mestre das Rotas" },
    { min: 20, name: "Lenda da Estrada" }
  ];

  const emptyState = () => ({ routes: {}, badges: [], events: [] });
  let state = store.get("progress", emptyState());
  let activeRoute = null;
  let activeLesson = 0;
  let authenticated = false;
  let activeUserId = null;
  let accountType = null;
  let remoteSaveTimer = null;
  function normalize() {
    state.routes ||= {};
    state.badges ||= [];
    state.events ||= [];
    ROUTES.forEach((route) => { state.routes[route.id] ||= { step: 0, complete: false, started: false }; });
  }
  normalize();
  function save() {
    store.set("progress", state);
    renderProfile();
    if (authenticated && activeUserId && window.PuxaRotaAuth?.saveRouteProgress) {
      clearTimeout(remoteSaveTimer);
      remoteSaveTimer = setTimeout(() => window.PuxaRotaAuth.saveRouteProgress(state), 250);
    }
  }
  function routeState(route) { return state.routes[route.id]; }
  function track(type, routeId, lessonIndex, extra = {}) {
    state.events.unshift({ type, routeId, lessonIndex, at: new Date().toISOString(), ...extra });
    state.events = state.events.slice(0, 100);
    save();
    if (authenticated) window.PuxaRotaAuth?.recordActivity?.(type, "route", routeId, { lessonIndex, ...extra });
  }
  function grade() {
    return GRADES.reduce((current, item) => state.badges.length >= item.min ? item : current, GRADES[0]);
  }
  function nextGrade() { return GRADES.find((item) => item.min > state.badges.length); }
  function completedLessons(route) {
    const progress = routeState(route);
    return progress.complete ? route.lessons.length : Math.min(progress.step, route.lessons.length);
  }
  function availableRoutes() {
    const audience = accountType === "company" ? "company" : "professional";
    return ROUTES.filter((route) => route.audience === audience);
  }
  function toast(message) {
    const element = q(".toast"); if (!element) return;
    element.textContent = message; element.classList.remove("hidden");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.add("hidden"), 2200);
  }

  function renderHub() {
    activeRoute = null;
    const root = q("#routes-app"); if (!root) return;
    const currentGrade = grade(), upcoming = nextGrade(), catalog = availableRoutes();
    const inProgress = catalog.find((route) => routeState(route).started && !routeState(route).complete);
    root.innerHTML = `
      <header class="journey-hero">
        <div><span class="journey-kicker">${accountType === "company" ? "JORNADA EMPRESARIAL" : "TEMPORADA 1 · PÉ NA ESTRADA"}</span><h1>${accountType === "company" ? "Evolua sua operação" : "Escolha sua próxima rota"}</h1><p>Toque, aprenda e ganhe selos.</p></div>
        <div class="grade-medal"><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "🔇" : "♪"}</button><small>SEU GRAU</small><b>${esc(currentGrade.name)}</b><span>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"}</span></div>
        <div class="journey-character"><span class="character-road" aria-hidden="true"></span><img src="rupi-next.png" alt="Rupi seguindo para o próximo trecho"><small>Rupi mostra o próximo passo.</small></div>
      </header>
      <section class="journey-progress">
        <div><span>Minha evolução</span><strong>${upcoming ? state.badges.length + " de " + upcoming.min + " para " + upcoming.name : "Grau máximo alcançado"}</strong></div>
        <div class="progress-track"><i style="width:${upcoming ? Math.max(8, state.badges.length / upcoming.min * 100) : 100}%"></i></div>
      </section>
      ${inProgress ? continueCard(inProgress) : ""}
      <div class="routes-heading"><div><span>ROTAS DISPONÍVEIS</span><h2>Seu mapa de missões</h2></div><b>${catalog.filter((route) => routeState(route).complete).length}/${catalog.length}</b></div>
      <div class="mission-map">${catalog.map(routeCard).join("")}</div>
      <section class="badge-shelf"><span>COLEÇÃO</span><h2>Selos da jornada</h2><div>${catalog.map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div></section>
      <section class="future-routes"><span>NO HORIZONTE</span><h2>Próximas rotas</h2>${FUTURE_ROUTES.map((item) => `<article><i>${item.icon}</i><div><strong>${item.title}</strong><p>${item.text}</p></div><b>EM BREVE</b></article>`).join("")}</section>
      <p class="route-disclosure">Conteúdo educativo. Algumas rotas podem conter links de parceiros ou indicação, sempre identificados. Nenhuma etapa promete ganhos ou substitui orientação financeira.</p>`;
    bindHub();
  }
  function renderLocked() {
    const root = q("#routes-app"); if (!root) return;
    root.innerHTML = `<section class="routes-gate">
      <div class="gate-glow" aria-hidden="true"></div>
      <img src="carcara-scout.png" alt="Carcará observando as próximas Rotas">
      <span>ROTAS EXCLUSIVAS</span>
      <h1>Seu próximo passo começa aqui</h1>
      <p>Crie seu acesso grátis para aprender, avançar e guardar suas conquistas.</p>
      <div class="gate-benefits">
        <article><i>✓</i><b>Missões rápidas</b><small>Uma ideia por tela</small></article>
        <article><i>✦</i><b>Selos no perfil</b><small>Seu progresso fica salvo</small></article>
        <article><i>◎</i><b>Conteúdo útil</b><small>Benefícios e segurança</small></article>
      </div>
      <div class="gate-badges"><i>?</i><i>?</i><i>?</i><span>Seus primeiros selos estão esperando.</span></div>
      <button type="button" data-create-account>Criar meu acesso grátis</button>
      <button type="button" class="gate-login" data-login-account>Já tenho conta</button>
      <small class="gate-note">Leva menos de um minuto.</small>
    </section>`;
    q("[data-create-account]", root).onclick = () => openAccount(true);
    q("[data-login-account]", root).onclick = () => openAccount(false);
  }
  function openAccount(signup) {
    q('[data-screen="profile"]')?.click();
    const status = q("#account-status");
    if (status) status.textContent = signup ? "Informe seu e-mail e crie uma senha para liberar as Rotas." : "Entre para continuar sua jornada.";
    setTimeout(() => q("#account-email")?.focus(), 80);
  }
  function continueCard(route) {
    const progress = routeState(route);
    return `<button class="continue-route" type="button" data-open-route="${route.id}"><i>${route.icon}</i><span><small>CONTINUAR JORNADA</small><strong>${esc(route.title)}</strong><em>${completedLessons(route)}/${route.lessons.length} lições concluídas</em></span><b>Continuar →</b></button>`;
  }
  function lessonMascot(route, lesson) {
    if (route.id === "empresa-vaga-confiavel") return { src: "carcara-scout.png", alt: "Carcará revisando a oportunidade", state: "is-thinking" };
    if (route.audience === "company") return { src: "faro.png", alt: "Faro protegendo a contratação", state: lesson.checkpoint ? "is-thinking" : "is-moving" };
    if (route.id === "beneficios-ripio") return { src: "faro.png", alt: "Faro iluminando uma decisão segura", state: lesson.checkpoint ? "is-thinking" : "is-moving" };
    if (route.id === "voz-estrada") return { src: "carcara-flight.png", alt: "Carcará explorando novos caminhos", state: "is-moving" };
    return { src: lesson.checkpoint ? "rupi-hint.png" : "rupi-next.png", alt: "Rupi acompanhando este trecho", state: lesson.checkpoint ? "is-thinking" : "is-moving" };
  }
  function routeCard(route, index) {
    const progress = routeState(route), done = completedLessons(route), percent = done / route.lessons.length * 100;
    return `<button class="mission-card ${progress.complete ? "complete" : ""}" type="button" data-open-route="${route.id}">
      <span class="map-marker">${index + 1}</span><i class="mission-icon">${route.icon}</i>
      <span class="mission-copy"><small>${esc(route.category)} · ${progress.complete ? "CONCLUÍDA" : done ? "EM ANDAMENTO" : "NOVA ROTA"}</small><strong>${esc(route.title)}</strong><em>${esc(route.short)}</em><span class="mini-progress"><i style="width:${percent}%"></i></span><b>${done}/${route.lessons.length} etapas</b></span>
      <span class="mission-arrow">›</span>
    </button>`;
  }
  function badgeView(badge, earned) {
    return `<article class="badge ${earned ? "earned" : "locked"}"><i>${earned ? badge.icon : "?"}</i><strong>${esc(badge.name)}</strong><span>${earned ? "Conquistado" : "Bloqueado"}</span></article>`;
  }
  function bindHub() {
    qa("[data-open-route]", q("#routes-app")).forEach((button) => button.onclick = () => openRoute(button.dataset.openRoute));
    q("[data-sound-toggle]", q("#routes-app"))?.addEventListener("click", toggleSound);
  }
  function toggleSound(event) {
    if (!audio) return;
    audio.toggle(); event.currentTarget.textContent = audio.muted() ? "🔇" : "♪";
    if (!audio.muted()) audio.play("select");
  }
  function feel(sound, vibration) {
    if (audio && !audio.muted()) audio.play(sound);
    if (navigator.vibrate) navigator.vibrate(vibration || 18);
  }

  function openRoute(id) {
    activeRoute = ROUTES.find((route) => route.id === id); if (!activeRoute) return;
    if (!availableRoutes().includes(activeRoute)) return;
    const progress = routeState(activeRoute);
    if (!progress.started) { progress.started = true; track("route_started", id, 0); }
    activeLesson = Math.min(progress.step, activeRoute.lessons.length - 1);
    feel("select", 12);
    renderLesson();
  }
  function renderLesson() {
    const root = q("#routes-app"), route = activeRoute, lesson = route.lessons[activeLesson], progress = routeState(route);
    if (!root || !route || !lesson) return;
    const mascotView = lessonMascot(route, lesson);
    const percent = (activeLesson + (progress.complete ? 1 : 0)) / route.lessons.length * 100;
    root.innerHTML = `<section class="lesson-shell">
      <header class="lesson-top"><button type="button" data-back-routes aria-label="Voltar">←</button><div><small>${esc(route.category)}</small><strong>${esc(route.title)}</strong></div><span>${activeLesson + 1}/${route.lessons.length}</span><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "🔇" : "♪"}</button></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <article class="lesson-card">
        <span class="lesson-eyebrow">${esc(lesson.eyebrow)}</span><div class="lesson-scene scene-${route.id}"><span class="road-line"></span><div class="lesson-symbol">${route.icon}</div><img class="rupi-scene ${mascotView.state}" src="${mascotView.src}" alt="${mascotView.alt}"></div>
        <h1>${esc(lesson.title)}</h1><p class="lesson-summary">${esc(lesson.summary)}</p>
        ${lesson.bullets ? `<ul>${lesson.bullets.map((item) => `<li><i>✓</i>${esc(item)}</li>`).join("")}</ul>` : ""}
        ${lesson.checkpoint ? `<div class="route-checkpoint"><strong>${esc(lesson.checkpoint.question)}</strong><div>${lesson.checkpoint.options.map((option, index) => `<button type="button" data-answer="${index}">${esc(option)}</button>`).join("")}</div><small>Toque em uma resposta</small></div>` : ""}
        ${lesson.action ? `<a class="lesson-action" data-route-action="${esc(lesson.action.event)}" href="${esc(lesson.action.url)}" target="_blank" rel="noopener nofollow">↗ <span>${esc(lesson.action.label)}</span></a>` : ""}
        ${lesson.share ? `<button class="lesson-action" type="button" data-share-route>↗ <span>Compartilhar conquista</span></button>` : ""}
        ${route.id === "beneficios-ripio" ? '<p class="lesson-warning">⚠ Criptoativos oscilam e envolvem riscos. Este conteúdo é educativo e não é recomendação de investimento.</p>' : ""}
      </article>
      <div class="lesson-controls"><button class="lesson-later" type="button" data-back-routes>Deixar para depois</button><button class="lesson-done" type="button" data-complete-lesson>${esc(lesson.done || "Continuar")}</button></div>
    </section>`;
    qa("[data-back-routes]", root).forEach((button) => button.onclick = renderHub);
    q("[data-sound-toggle]", root)?.addEventListener("click", toggleSound);
    q("[data-route-action]", root)?.addEventListener("click", (event) => track(event.currentTarget.dataset.routeAction, route.id, activeLesson));
    qa("[data-answer]", root).forEach((button) => button.onclick = () => {
      const correct = Number(button.dataset.answer) === lesson.checkpoint.correct;
      qa("[data-answer]", root).forEach((item) => item.classList.remove("correct", "wrong"));
      button.classList.add(correct ? "correct" : "wrong");
      const mascot = q(".rupi-scene", root);
      if (mascot) mascot.classList.toggle("is-correct", correct);
      q(".route-checkpoint small", root).textContent = correct ? "Boa! Você pode avançar." : "Quase. Tente a outra opção.";
      feel(correct ? "coin" : "blip", correct ? [18, 30, 18] : 22);
      track("checkpoint_answered", route.id, activeLesson, { correct });
    });
    q("[data-share-route]", root)?.addEventListener("click", shareRoute);
    q("[data-complete-lesson]", root).onclick = completeLesson;
  }
  async function shareRoute() {
    track("share_opened", activeRoute.id, activeLesson);
    try {
      if (navigator.share) await navigator.share({ title: "PuxaRota", text: SHARE_TEXT, url: location.origin + location.pathname });
      else {
        await navigator.clipboard.writeText(SHARE_TEXT + " " + location.origin + location.pathname);
        toast("Texto copiado para compartilhar");
      }
    } catch (_) {}
  }
  function completeLesson() {
    const route = activeRoute, progress = routeState(route);
    track("lesson_completed", route.id, activeLesson);
    feel("coin", [18, 25, 18]);
    if (activeLesson < route.lessons.length - 1) {
      progress.step = Math.max(progress.step, activeLesson + 1);
      save(); activeLesson += 1; renderLesson(); return;
    }
    progress.step = route.lessons.length;
    progress.complete = true;
    if (!state.badges.includes(route.badge.id)) state.badges.push(route.badge.id);
    if (state.badges.length >= 3 && !state.badges.includes("desbravador")) state.badges.push("desbravador");
    save(); renderCelebration(route);
  }
  function renderCelebration(route) {
    const root = q("#routes-app"), currentGrade = grade();
    root.innerHTML = `<section class="route-celebration"><div class="confetti" aria-hidden="true">✦ · ✧ · ★</div><img class="rupi-celebrate" src="rupi-badge.png" alt="Rupi comemorando"><span>ROTA CONCLUÍDA</span><div class="earned-medal">${route.badge.icon}</div><h1>${esc(route.badge.name)}</h1><p>${esc(route.badge.description)}</p><strong>Novo grau: ${esc(currentGrade.name)}</strong><button type="button" data-finish-route>Voltar ao mapa</button></section>`;
    q("[data-finish-route]", root).onclick = renderHub;
    if (audio && !audio.muted()) audio.jingle("levelup");
    if (navigator.vibrate) navigator.vibrate([35, 45, 35, 45, 70]);
    track("route_completed", route.id, route.lessons.length - 1);
  }
  function renderProfile() {
    const root = q("#journey-profile"); if (!root) return;
    if (!authenticated) { root.innerHTML = ""; root.hidden = true; return; }
    root.hidden = false;
    const currentGrade = grade();
    root.innerHTML = `<div class="journey-profile-head"><div><small>${accountType === "company" ? "JORNADA DA EMPRESA" : "MINHA JORNADA"}</small><h2>${esc(currentGrade.name)}</h2><p>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"} conquistado${state.badges.length === 1 ? "" : "s"}</p></div><button type="button" data-profile-routes>Ver rotas</button></div><div class="profile-badges">${availableRoutes().map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div>`;
    q("[data-profile-routes]", root).onclick = () => q('[data-screen="routes"]')?.click();
  }
  function render() { authenticated ? renderHub() : renderLocked(); renderProfile(); }
  window.PuxaRotaRoutes = { render, catalog: ROUTES, getState: () => state };
  document.addEventListener("DOMContentLoaded", renderProfile);
  window.addEventListener("puxarota:auth", async (event) => {
    authenticated = Boolean(event.detail?.session);
    activeUserId = event.detail?.user?.id || null;
    accountType = event.detail?.account?.account_type || null;
    if (authenticated && activeUserId) {
      const owner = store.get("owner", null);
      const remote = await window.PuxaRotaAuth?.loadRouteProgress?.();
      if (remote?.ok && remote.state) state = remote.state;
      else if (owner !== activeUserId) state = emptyState();
      store.set("owner", activeUserId);
      normalize();
      store.set("progress", state);
    } else {
      activeUserId = null;
      state = emptyState();
      normalize();
    }
    if (q("#screen-routes")?.classList.contains("active")) render();
    else renderProfile();
  });
})();
