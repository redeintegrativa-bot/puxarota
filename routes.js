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
      short: "Do cartão pré-pago ao cashback em USDT, sem complicação.",
      icon: "₿",
      badge: { id: "explorador-beneficios", icon: "✦", name: "Explorador de Benefícios", description: "Concluiu a jornada educativa sobre cartão pré-pago, cripto, USDT e cashback." },
      sponsor: "Conteúdo educativo · link de indicação",
      lessons: [
        { title: "Cartão pré-pago: o que é", eyebrow: "LIÇÃO 1 · 2 MIN", summary: "É um cartão que você carrega antes de usar: paga direto do saldo que já está lá. Sem fatura, sem parcelamento e sem surpresa no fim do mês.", learn: ["Cartão pré-pago não é crédito: você coloca o dinheiro antes de gastar.", "Dá para pagar com o app ou aproximando o celular (NFC), sempre do seu saldo.", "O limite de gasto é o que foi carregado — você controla quanto usa."], checkpoint: { question: "Cartão pré-pago é…", options: ["Pago com o saldo que você carrega antes", "Um crédito com fatura no fim do mês"], correct: 0 }, done: "Avançar" },
        { title: "Cripto e USDT na prática", eyebrow: "LIÇÃO 2 · 2 MIN", summary: "Cripto é dinheiro digital. O USDT é uma cripto estável: cada unidade vale cerca de 1 dólar, sem cédulas nem banco no meio.", warn: true, learn: ["Cripto é dinheiro digital, que circula pela internet sem cédulas.", "O USDT é uma cripto estável: cada unidade vale cerca de 1 dólar.", "Facilita pagamentos no Brasil e fora, mas outras criptos podem oscilar de preço."], checkpoint: { question: "O USDT é…", options: ["Estável, vale cerca de 1 dólar", "Nunca muda de valor"], correct: 0 }, action: { label: "Ler o guia completo", url: CRYPTO_ARTICLE, event: "crypto_article_opened" }, done: "Avançar" },
        { title: "Parceiros e como usar o cashback", eyebrow: "LIÇÃO 3 · 2 MIN", summary: "Dentro do app, parceiros oferecem ofertas: você paga e uma parte do valor volta depois, conforme as regras.", learn: ["Parceiros são lojas e serviços que aparecem dentro do app da Ripio.", "Pagando pelas ofertas, uma parte do valor volta como cashback.", "Cada oferta tem regras próprias: percentual, prazo e forma de pagamento."], checkpoint: { question: "Onde o cashback aparece?", options: ["Nas ofertas dos parceiros", "Em qualquer pagamento automático"], correct: 0 }, done: "Avançar" },
        { title: "Cashback maior em USDT", eyebrow: "LIÇÃO 4 · 2 MIN", summary: "Pagando em USDT, o cashback costuma ser maior do que pagando em reais — vale conferir as ofertas que premiam esse formato.", warn: true, learn: ["Algumas ofertas dão cashback maior quando o pagamento é em USDT.", "O percentual sobe porque o parceiro economiza na conversão da moeda.", "Sempre confira as regras da oferta para saber o quanto volta de verdade."], checkpoint: { question: "Cashback maior é pago em…", options: ["USDT", "Qualquer forma, igualmente"], correct: 0 }, done: "Avançar" },
        { title: "Baixe o aplicativo oficial", eyebrow: "LIÇÃO 5 · AÇÃO", summary: "Acesse a página da campanha e escolha a loja oficial do seu celular. Evite APKs e links recebidos de desconhecidos.", action: { label: "Baixar a Ripio", url: RIPIO_LINK, event: "ripio_download_opened" }, done: "Já baixei, continuar" },
        { title: "Cadastro pelo link", eyebrow: "LIÇÃO 6 · AÇÃO", summary: "Comece o cadastro pelo link da campanha para que a indicação seja vinculada corretamente. Você não paga a mais por isso.", bullets: ["Crie uma senha exclusiva.", "Ative biometria ou autenticação em duas etapas.", "Nunca compartilhe código de acesso."], action: { label: "Fazer meu cadastro", url: RIPIO_LINK, event: "ripio_signup_opened" }, done: "Cadastro iniciado" },
        { title: "Pagando e acompanhando", eyebrow: "LIÇÃO 7 · FINAL", summary: "Escolha a oferta, confira as regras e acompanhe o retorno no app.", learn: ["Antes de pagar, leia o que a oferta devolve, em quanto tempo e com quais condições.", "Guarde o comprovante e acompanhe o retorno direto no app.", "Conferir prazos e percentuais evita surpresas depois do pagamento."], checkpoint: { question: "Antes de pagar, você deve…", options: ["Conferir as condições", "Ignorar prazo e percentual"], correct: 0 }, action: { label: "Ativar de vez", url: RIPIO_LINK, event: "ripio_activation_opened" }, done: "Ganhar meu selo" }
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
        { title: "Conheça a comunidade", eyebrow: "PASSO 1 · 1 MIN", summary: "A Rede Integrativa reúne profissionais da estrada, transportadoras, oportunidades e informações úteis.", learn: ["A Rede Integrativa conecta motoristas, agregados e transportadoras.", "Por lá circulam oportunidades de frete e informações úteis da estrada.", "Participar amplia sua rede de contatos e chances de trabalho."], done: "Quero conhecer" },
        { title: "Entre no grupo", eyebrow: "PASSO 2 · AÇÃO", summary: "Abra o grupo oficial no Facebook e solicite sua participação.", learn: ["O grupo oficial reúne a comunidade da Rede Integrativa.", "Solicite sua entrada pelo botão abaixo.", "A aprovação pode levar algumas horas."], action: { label: "Abrir grupo no Facebook", url: COMMUNITY_LINK, event: "community_group_opened" }, done: "Solicitei para entrar" },
        { title: "Faça parte da conversa", eyebrow: "PASSO 3 · CONCLUSÃO", summary: "Ao participar, preserve seus dados, confirme as condições diretamente com as empresas e ajude a manter a comunidade segura.", learn: ["Preserve seus dados: evite documentos em comentários públicos.", "Desconfie de cobrança antecipada e de oportunidades vagas.", "Reporte suspeitas e ajude a manter a comunidade segura."], bullets: ["Não envie documentos em comentários públicos.", "Desconfie de cobrança antecipada.", "Reporte oportunidades suspeitas."], done: "Concluir missão" }
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
        { title: "Espalhe uma rota útil", eyebrow: "MISSÃO RÁPIDA", summary: "Compartilhe o PuxaRota com alguém que possa aproveitar oportunidades e conteúdos da Rede.", learn: ["Compartilhar ajuda outro profissional a descobrir a Rede.", "Cada convite fortalece a comunidade e abre novas rotas.", "Seu selo mostra que você ajuda a estrada a andar junto."], share: true, done: "Compartilhei, concluir" }
      ]
    },
    {
      id: "seguranca-digital", audience: "professional", category: "Segurança",
      title: "Segurança Digital", short: "Golpes, documentos e proteção do WhatsApp.", icon: "⬢",
      badge: { id: "guarda-estrada", icon: "🛡", name: "Guarda da Estrada", description: "Concluiu a jornada de segurança digital para atuar sem cair em golpes." },
      lessons: [
        { title: "Os golpes mais comuns", eyebrow: "LIÇÃO 1 · 2 MIN", summary: "Cobrança antecipada, falsa carga e 'frete' que some depois do contato são os golpes que mais atingem quem vive da estrada.", learn: ["Cobrança antecipada, falsa carga e frete que some são os golpes mais comuns.", "O golpista cria urgência, pressão e pede dinheiro ou dados antes de qualquer serviço.", "Quem pede dinheiro antes do serviço é sinal de alerta — confirme tudo por escrito."], checkpoint: { question: "O que é um sinal de alerta?", options: ["Pedir dinheiro antes do serviço", "Confirmar tudo por escrito"], correct: 0 }, done: "Avançar" },
        { title: "Proteja seus documentos", eyebrow: "LIÇÃO 2 · 1 MIN", summary: "CNH, RG, CPF e comprovantes não devem ser enviados em comentários públicos, grupos abertos ou para desconhecidos.", learn: ["Documentos são dados sensíveis: envie só depois de validar a empresa.", "Ao mostrar, oculte números e evite fotos completas.", "Guarde cópias separadas do aparelho para evitar perda e golpes."], bullets: ["Envie só depois de validar a empresa.", "Oculte números ao mostrar documentos.", "Guarde cópias separadas do aparelho."], done: "Avançar" },
        { title: "WhatsApp seguro", eyebrow: "LIÇÃO 3 · 1 MIN", summary: "Links recebidos, códigos de verificação e APKs são caminhos comuns de golpe. O código do WhatsApp nunca é pedido por ninguém.", learn: ["Links recebidos, códigos de verificação e APKs são caminhos comuns de golpe.", "O código de verificação do WhatsApp é pessoal e nunca deve ser compartilhado.", "Se alguém pedir seu código, é golpe: ninguém legítimo precisa dele."], checkpoint: { question: "Recebeu pedido do seu código de verificação?", options: ["Não compartilho nunca", "Envio para confirmar"], correct: 0 }, done: "Avançar" },
        { title: "Pagamentos e adiantamentos", eyebrow: "LIÇÃO 4 · 1 MIN", summary: "Desconfie de pagamento 'adiantado' que exige depósito ou taxa para liberar. Combinado por escrito e fonte verificada reduzem o risco.", learn: ["Cobrança antecipada para liberar frete é o golpe mais comum na estrada.", "Registre valores e prazos por escrito antes de aceitar qualquer coisa.", "Fonte verificada e urgência controlada são suas melhores defesas."], bullets: ["Confirme a fonte da oportunidade.", "Registre valores e prazos combinados.", "Desconfie de urgência para pagar rápido."], done: "Avançar" },
        { title: "Sua regra de ouro", eyebrow: "LIÇÃO 5 · FINAL", summary: "A regra que resume tudo: se pede dinheiro antes, cobra urgência ou pressiona no WhatsApp, confirme antes de agir.", learn: ["Se pede dinheiro antes, cobra urgência ou pressiona no WhatsApp, é hora de parar.", "Verifique a empresa e o que é público antes de seguir com um contato novo.", "Confirmar antes de agir protege seu trabalho e seu dinheiro."], checkpoint: { question: "Antes de seguir um contato novo…", options: ["Verifico a empresa e o que é público", "Aceito a oferta direto"], correct: 0 }, done: "Ganhar selo" }
      ]
    },
    {
      id: "financas-estrada", audience: "professional", category: "Finanças",
      title: "Finanças da Estrada", short: "Custos, reserva e organização por rota.", icon: "◫",
      badge: { id: "caixa-estrada", icon: "◈", name: "Caixa da Estrada", description: "Concluiu a jornada para organizar custos, reserva e o retorno das rotas." },
      lessons: [
        { title: "O custo vai além do combustível", eyebrow: "LIÇÃO 1 · 2 MIN", summary: "Manutenção, pneus, alimentação e o tempo parado também entram no custo de cada rota. Calcule antes de aceitar.", learn: ["O custo da rota vai além do combustível: manutenção, pneus, alimentação e paradas contam.", "Calcular só o valor do combustível esconde quanto a rota realmente custa.", "Somando tudo antes de aceitar, você descobre se o frete vale a pena."], checkpoint: { question: "O que entra no custo da rota?", options: ["Combustível, manutenção e paradas", "Só o valor do combustível"], correct: 0 }, done: "Avançar" },
        { title: "Reserva para imprevistos", eyebrow: "LIÇÃO 2 · 1 MIN", summary: "Uma reserva pequena por rota evita que um pneu ou uma espera virem aperto no fim do mês.", learn: ["Reserva é o dinheiro que fica guardado para os imprevistos da estrada.", "Separe um valor fixo por viagem — pequeno, mas constante.", "Não misture a reserva com o dinheiro de gastos do dia a dia."], bullets: ["Separe um valor fixo por viagem.", "Não misture a reserva com o dinheiro de gastos.", "Recomponha a reserva sempre que usar."], done: "Avançar" },
        { title: "Organize por rota", eyebrow: "LIÇÃO 3 · 1 MIN", summary: "Registrar ganho e gasto de cada rota mostra quais valem a pena e quais pesam mais do que rendem.", learn: ["Registrar ganho e gasto de cada rota mostra quais valem a pena.", "Uma rota de valor bruto alto pode render menos depois de somar os custos.", "Comparar ganho e custo da mesma rota é o jeito certo de decidir."], checkpoint: { question: "Para saber se uma rota compensa…", options: ["Comparo ganho e custo daquela rota", "Só olho o valor bruto"], correct: 0 }, done: "Avançar" },
        { title: "Meta de reserva", eyebrow: "LIÇÃO 4 · FINAL", summary: "Defina uma meta simples, como uma reserva que cubra um mês de manutenção. Pequenos depósitos constantes constroem isso.", learn: ["Reserva é o dinheiro separado para imprevistos, como um pneu ou uma espera.", "Uma meta simples, como cobrir um mês de manutenção, já tira o aperto.", "Pequenos depósitos constantes constroem a reserva — esperar sobrar quase nunca funciona."], checkpoint: { question: "O melhor jeito de criar reserva é…", options: ["Guardar um pouco sempre", "Guardar só quando sobra"], correct: 0 }, done: "Ganhar selo" }
      ]
    },
    {
      id: "empresa-vaga-confiavel", audience: "company", category: "Para empresas",
      title: "Publique uma vaga confiável", short: "Informações claras atraem profissionais mais alinhados.", icon: "▦",
      badge: { id: "empresa-vaga-clara", icon: "✓", name: "Vaga Clara", description: "Aprendeu a publicar oportunidades completas e verificáveis." },
      lessons: [
        { title: "Comece pelo essencial", eyebrow: "TRECHO 1 · 1 MIN", summary: "Informe rota, veículo, rotina e condição antes de publicar.", learn: ["Informe rota, veículo, rotina e condição antes de publicar.", "Uma vaga clara atrai profissionais mais alinhados e menos retrabalho.", "Condições transparentes geram confiança desde o primeiro contato."], checkpoint: { question: "O que gera mais confiança?", options: ["Condições claras", "Promessa sem detalhes"], correct: 0 }, done: "Avançar" },
        { title: "Proteja quem se candidata", eyebrow: "TRECHO 2 · 1 MIN", summary: "Nunca peça pagamento antecipado, senha ou documento em comentário público.", learn: ["Nunca peça pagamento antecipado, senha ou documento em comentário público.", "Peça documentos apenas em canal seguro e autorizado.", "Proteger quem se candidata é proteger a reputação da sua vaga."], checkpoint: { question: "Onde pedir documentos?", options: ["Em canal seguro e autorizado", "Em qualquer comentário"], correct: 0 }, done: "Avançar" },
        { title: "Revise antes de publicar", eyebrow: "TRECHO 3 · FINAL", summary: "Confira prazo, região e contato responsável. A vaga entra para análise antes de aparecer.", bullets: ["Sem cobrança antecipada.", "Contato empresarial verificável.", "Prazo e condições atualizados."], done: "Ganhar selo" }
      ]
    },
    {
      id: "empresa-contratacao-responsavel", audience: "company", category: "Para empresas",
      title: "Contrate com consentimento", short: "Do pedido de acesso à avaliação final, com histórico.", icon: "◎",
      badge: { id: "empresa-contrata-bem", icon: "◆", name: "Contratação Responsável", description: "Concluiu a jornada de contato, contratação e avaliação segura." },
      lessons: [
        { title: "Solicite, não capture", eyebrow: "TRECHO 1 · 1 MIN", summary: "Peça acesso ao perfil. O contato só é liberado após autorização do profissional.", learn: ["Peça acesso ao perfil antes de usar os dados.", "O contato só é liberado após a autorização do profissional.", "Consentimento claro constrói um histórico confiável para os dois lados."], checkpoint: { question: "Quem libera o contato?", options: ["O profissional", "A empresa sozinha"], correct: 0 }, done: "Avançar" },
        { title: "Registre a contratação", eyebrow: "TRECHO 2 · 1 MIN", summary: "Vincule empresa, profissional e vaga para formar um histórico confiável para os dois lados.", done: "Avançar" },
        { title: "Avalie uma relação real", eyebrow: "TRECHO 3 · FINAL", summary: "A avaliação fica disponível depois da contratação e aparece como média, sem expor dados privados.", learn: ["A avaliação fica disponível depois de uma contratação real.", "Ela aparece como média, sem expor dados privados.", "Avaliar relações reais protege a reputação de todos."], checkpoint: { question: "Quando avaliar?", options: ["Após uma contratação real", "Antes de qualquer contato"], correct: 0 }, done: "Ganhar selo" }
      ]
    }
  ];

  const FUTURE_ROUTES = [
    { icon: "▧", title: "Contratos e documentos", text: "O que conferir antes de assinar um frete." },
    { icon: "★", title: "Reputação do motorista", text: "Como boas avaliações abrem novas oportunidades." }
  ];
  const GRADES = [
    { min: 0, name: "Na Partida" },
    { min: 1, name: "Explorador" },
    { min: 3, name: "Conectado" },
    { min: 5, name: "Desbravador" },
    { min: 10, name: "Mestre das Rotas" },
    { min: 20, name: "Lenda da Estrada" }
  ];

  const emptyState = () => ({ routes: {}, badges: [], events: [], xp: 0, streak: 0, lastActiveDay: null, missionDay: null });
  let state = store.get("progress", emptyState());
  let activeRoute = null;
  let activeLesson = 0;
  let authenticated = false;
  let activeUserId = null;
  let accountType = null;
  let remoteSaveTimer = null;
  let activePhase = "learn";
  let learnStep = 0;
  const XP_LEVELS = [
    { min: 0, name: "Iniciante da Estrada" },
    { min: 60, name: "Aprendiz de Rota" },
    { min: 150, name: "Estradeiro" },
    { min: 280, name: "Navegador Experiente" },
    { min: 450, name: "Mestre da Jornada" }
  ];
  const dayKey = (date = new Date()) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  function normalize() {
    state.routes ||= {};
    state.badges ||= [];
    state.events ||= [];
    state.xp ||= 0;
    state.streak ||= 0;
    state.lastActiveDay ||= null;
    state.missionDay ||= null;
    ROUTES.forEach((route) => { state.routes[route.id] ||= { step: 0, complete: false, started: false, seen: [] }; });
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
  function gainXp(amount) {
    state.xp = (state.xp || 0) + amount;
    return amount;
  }
  function touchStreak() {
    const today = dayKey();
    if (state.lastActiveDay === today) return state.streak || 1;
    const yesterday = new Date(Date.now() - 86400000);
    state.streak = state.lastActiveDay === dayKey(yesterday) ? (state.streak || 0) + 1 : 1;
    state.lastActiveDay = today;
    return state.streak;
  }
  function xpLevel() {
    return XP_LEVELS.reduce((current, item) => state.xp >= item.min ? item : current, XP_LEVELS[0]);
  }
  function nextXpLevel() { return XP_LEVELS.find((item) => item.min > state.xp); }
  function dailyMission() {
    const today = dayKey();
    if (state.missionDay && state.missionDay.date === today) {
      const mission = state.missionDay;
      const route = ROUTES.find((item) => item.id === mission.routeId);
      const lesson = route?.lessons?.[mission.lessonIndex];
      if (route && lesson && !routeState(route).complete) return { route, lessonIndex: mission.lessonIndex, lesson, done: Boolean(mission.done) };
    }
    const catalog = availableRoutes();
    const pending = catalog.filter((route) => !routeState(route).complete);
    if (!pending.length) return null;
    const active = pending.find((route) => routeState(route).started) || pending[0];
    const progress = routeState(active);
    const lessonIndex = Math.min(progress.step, active.lessons.length - 1);
    state.missionDay = { date: today, routeId: active.id, lessonIndex, done: false };
    save();
    return { route: active, lessonIndex, lesson: active.lessons[lessonIndex], done: false };
  }
  function grade() {
    return GRADES.reduce((current, item) => state.badges.length >= item.min ? item : current, GRADES[0]);
  }
  function completedLessons(route) {    const progress = routeState(route);
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
    const currentGrade = grade(), catalog = availableRoutes();
    const inProgress = catalog.find((route) => routeState(route).started && !routeState(route).complete);
    const mission = dailyMission();
    const level = xpLevel(), nextLevel = nextXpLevel();
    root.innerHTML = `
      <header class="journey-hero">
        <div><span class="journey-kicker">${accountType === "company" ? "JORNADA EMPRESARIAL" : "TEMPORADA 1 · PÉ NA ESTRADA"}</span><h1>${accountType === "company" ? "Evolua sua operação" : "Escolha sua próxima rota"}</h1><p>Toque, aprenda e ganhe selos.</p></div>
        <div class="grade-medal"><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "🔇" : "♪"}</button><small>SEU GRAU</small><b>${esc(currentGrade.name)}</b><span>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"}</span></div>
        <div class="journey-character"><span class="character-road" aria-hidden="true"></span><img src="rupi-next.png" alt="Rupi seguindo para o próximo trecho"><small>Rupi mostra o próximo passo.</small></div>
      </header>
      <section class="journey-stats">
        <article><small>XP</small><b>${state.xp || 0}</b><i>${esc(level.name)}</i></article>
        <article><small>SEQUÊNCIA</small><b>${state.streak || 0}</b><i>dias seguidos</i></article>
        <article><small>LIÇÕES</small><b>${catalog.reduce((sum, route) => sum + completedLessons(route), 0)}</b><i>concluídas</i></article>
      </section>
      ${nextLevel ? `<section class="journey-progress"><div><span>Próximo nível</span><strong>${nextLevel.min - state.xp} XP para ${nextLevel.name}</strong></div><div class="progress-track"><i style="width:${Math.max(6, state.xp / nextLevel.min * 100)}%"></i></div></section>` : ""}
      ${mission ? `<section class="daily-mission ${mission.done ? "done" : ""}"><span>MISSÃO DO DIA</span><h2>${esc(mission.lesson.title)}</h2><p>${esc(mission.route.title)}${mission.done ? " · concluída hoje ✓" : " · próxima lição"}</p>${mission.done ? "" : '<button type="button" data-start-mission>Começar (+15 XP)</button>'}</section>` : ""}
      ${inProgress ? continueCard(inProgress) : ""}
      <div class="routes-heading"><div><span>ROTAS DISPONÍVEIS</span><h2>Seu mapa de missões</h2></div><b>${catalog.filter((route) => routeState(route).complete).length}/${catalog.length}</b></div>
      <div class="mission-map">${catalog.map(routeCard).join("")}</div>
      <section class="badge-shelf"><span>COLEÇÃO</span><h2>Selos da jornada</h2><div>${catalog.map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div></section>
      <section class="future-routes"><span>NO HORIZONTE</span><h2>Próximas rotas</h2>${FUTURE_ROUTES.map(
    (item) => `<article><i>${item.icon}</i><div><strong>${item.title}</strong><p>${item.text}</p></div><b>EM BREVE</b></article>`).join("")}</section>
      <p class="route-disclosure">Conteúdo educativo. Algumas rotas podem conter links de parceiros ou indicação, sempre identificados. Nenhuma etapa promete ganhos ou substitui orientação financeira.</p>`;
    bindHub();
    q("[data-start-mission]", root)?.addEventListener("click", () => { track("mission_started", mission.route.id, mission.lessonIndex); openRoute(mission.route.id); });
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
    activeLesson = progress.complete ? 0 : Math.min(progress.step, activeRoute.lessons.length - 1);
    activePhase = "learn";
    learnStep = 0;
    feel("select", 12);
    renderLesson();
  }
  function goLesson(delta) {
    const route = activeRoute; if (!route) return;
    const next = activeLesson + delta;
    if (next < 0 || next >= route.lessons.length) return;
    activeLesson = next;
    activePhase = "learn";
    learnStep = 0;
    feel("select", 10);
    renderLesson();
  }
  function renderLesson() {
    const root = q("#routes-app"), route = activeRoute, lesson = route.lessons[activeLesson], progress = routeState(route);
    if (!root || !route || !lesson) return;
    const mascotView = lessonMascot(route, lesson);
    const percent = (activeLesson + (progress.complete ? 1 : 0)) / route.lessons.length * 100;
    const seen = progress.seen || (progress.seen = []);
    if (lesson.learn && !seen.includes(activeLesson)) {
      if (activePhase === "learn") return renderTeach(route, lesson, progress, mascotView, percent);
      seen.push(activeLesson);
      activePhase = "learn";
    }
    root.innerHTML = `<section class="lesson-shell">
      <header class="lesson-top"><button type="button" data-back-routes aria-label="Voltar">←</button><div><small>${esc(route.category)}</small><strong>${esc(route.title)}</strong></div><span class="lesson-count"><button type="button" data-prev-lesson aria-label="Lição anterior">‹</button><b>${activeLesson + 1}/${route.lessons.length}</b><button type="button" data-next-lesson aria-label="Próxima lição">›</button></span><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "🔇" : "♪"}</button></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <article class="lesson-card">
        <span class="lesson-eyebrow">${esc(lesson.eyebrow)}</span><div class="lesson-scene scene-${route.id}"><span class="road-line"></span><div class="lesson-symbol">${route.icon}</div><img class="rupi-scene ${mascotView.state}" src="${mascotView.src}" alt="${mascotView.alt}"></div>
        <h1>${esc(lesson.title)}</h1><p class="lesson-summary">${esc(lesson.summary)}</p>
        ${lesson.bullets ? `<ul>${lesson.bullets.map((item) => `<li><i>✓</i>${esc(item)}</li>`).join("")}</ul>` : ""}
        ${lesson.checkpoint ? `<div class="route-checkpoint"><strong>${esc(lesson.checkpoint.question)}</strong><div>${lesson.checkpoint.options.map((option, index) => `<button type="button" data-answer="${index}">${esc(option)}</button>`).join("")}</div><small>Toque em uma resposta</small></div>` : ""}
        ${lesson.action ? `<a class="lesson-action" data-route-action="${esc(lesson.action.event)}" href="${esc(lesson.action.url)}" target="_blank" rel="noopener nofollow">↗ <span>${esc(lesson.action.label)}</span></a>` : ""}
        ${lesson.share ? `<button class="lesson-action" type="button" data-share-route>↗ <span>Compartilhar conquista</span></button>` : ""}
        ${route.id === "beneficios-ripio" && lesson.warn ? '<p class="lesson-warning">⚠ Criptoativos oscilam e envolvem riscos. Este conteúdo é educativo e não é recomendação de investimento.</p>' : ""}
      </article>
      <div class="lesson-controls"><button class="lesson-later" type="button" data-back-routes>Deixar para depois</button><button class="lesson-done" type="button" data-complete-lesson>${esc(lesson.done || "Continuar")}</button></div>
    </section>`;
    qa("[data-back-routes]", root).forEach((button) => button.onclick = renderHub);
    q("[data-prev-lesson]", root)?.addEventListener("click", () => goLesson(-1));
    q("[data-next-lesson]", root)?.addEventListener("click", () => goLesson(1));
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
  function renderTeach(route, lesson, progress, mascotView, percent) {
    const root = q("#routes-app");
    const content = lesson.learn[learnStep] || lesson.learn[0];
    const last = learnStep >= lesson.learn.length - 1;
    root.innerHTML = `<section class="lesson-shell">
      <header class="lesson-top"><button type="button" data-back-routes aria-label="Voltar">←</button><div><small>${esc(route.category)}</small><strong>${esc(route.title)}</strong></div><span class="lesson-count"><button type="button" data-prev-lesson aria-label="Lição anterior">‹</button><b>${activeLesson + 1}/${route.lessons.length}</b><button type="button" data-next-lesson aria-label="Próxima lição">›</button></span><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "🔇" : "♪"}</button></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <article class="lesson-card lesson-teach">
        <span class="lesson-eyebrow">AULINHA · ${esc(lesson.eyebrow)}</span>
        <div class="lesson-scene scene-${route.id}"><span class="road-line"></span><div class="lesson-symbol">${route.icon}</div><img class="rupi-scene ${mascotView.state}" src="${mascotView.src}" alt="${mascotView.alt}"></div>
        <h1>${esc(lesson.title)}</h1>
        <p class="lesson-summary lesson-teach-text">${esc(content)}</p>
        <div class="teach-dots">${lesson.learn.map((_, index) => `<i class="${index === learnStep ? "on" : ""}"></i>`).join("")}</div>
      </article>
      <div class="lesson-controls"><button class="lesson-later" type="button" data-back-routes>Deixar para depois</button><button class="lesson-done" type="button" data-next-learn>${last ? (lesson.checkpoint ? "Ir para o desafio" : "Ver conteúdo") : "Continuar"}</button></div>
    </section>`;
    qa("[data-back-routes]", root).forEach((button) => button.onclick = () => { activePhase = "learn"; learnStep = 0; renderHub(); });
    q("[data-prev-lesson]", root)?.addEventListener("click", () => goLesson(-1));
    q("[data-next-lesson]", root)?.addEventListener("click", () => goLesson(1));
    q("[data-sound-toggle]", root)?.addEventListener("click", toggleSound);
    q("[data-next-learn]", root).onclick = () => {
      feel("select", 12);
      if (!last) { learnStep += 1; renderTeach(route, lesson, progress, mascotView, percent); return; }
      learnStep = 0;
      (progress.seen || (progress.seen = [])).push(activeLesson);
      save();
      renderLesson();
    };
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
    if (progress.complete) {
      if (activeLesson < route.lessons.length - 1) { activeLesson += 1; activePhase = "learn"; learnStep = 0; renderLesson(); }
      else renderHub();
      return;
    }
    track("lesson_completed", route.id, activeLesson);
    feel("coin", [18, 25, 18]);
    gainXp(10);
    const mission = dailyMission();
    if (mission && !mission.done && mission.route.id === route.id && mission.lessonIndex === activeLesson) {
      gainXp(15);
      state.missionDay = { ...state.missionDay, date: dayKey(), done: true };
      track("mission_completed", route.id, activeLesson);
    }
    touchStreak();
    if (activeLesson < route.lessons.length - 1) {
      progress.step = Math.max(progress.step, activeLesson + 1);
      save(); activeLesson += 1; activePhase = "learn"; learnStep = 0; renderLesson(); return;
    }
    progress.step = route.lessons.length;
    progress.complete = true;
    gainXp(40);
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
    const currentGrade = grade(), level = xpLevel();
    root.innerHTML = `<div class="journey-profile-head"><div><small>${accountType === "company" ? "JORNADA DA EMPRESA" : "MINHA JORNADA"}</small><h2>${esc(currentGrade.name)}</h2><p>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"} conquistado${state.badges.length === 1 ? "" : "s"}</p></div><button type="button" data-profile-routes>Ver rotas</button></div><div class="journey-profile-meta"><span><i>${state.xp || 0}</i> XP · ${esc(level.name)}</span><span><i>${state.streak || 0}</i> ${state.streak === 1 ? "dia" : "dias"} seguidos</span></div><div class="profile-badges">${availableRoutes().map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div>`;
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
