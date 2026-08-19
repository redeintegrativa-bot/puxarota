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
  let NEXT_EVENT = {
    subject: "Conex�es PuxaRota � pr�ximo encontro",
    description: "Assunto definido. Data, hor�rio e link do evento ser�o anunciados aqui.",
    date: "",
    minutes: 90,
    link: "",
    facebook: COMMUNITY_LINK
  };
  const SHARE_TEXT = "Estou avan�ando nas Rotas do PuxaRota e aprendendo com a Rede Integrativa.";
  const audio = window.Retroix?.audio ? window.Retroix.audio({ volume: 0.18 }) : null;

  const ROUTES = [
    {
      id: "instalar-app",
      audience: "professional",
      category: "Primeiros passos",
      title: "Instale o PuxaRota no celular",
      short: "Deixe o app na tela inicial e acesse oportunidades em um toque.",
      icon: "",
      badge: { id: "primeiro-passo", icon: "", name: "Primeiro Passo", description: "Instalou o PuxaRota no celular para ter as oportunidades sempre � m�o." },
      lessons: [
        { title: "Instale o PuxaRota no celular", eyebrow: "1 MIN � A��O", summary: "Instalado, o PuxaRota vira um app de verdade na tela inicial do seu celular, com as oportunidades e as Rotas sempre � m�o.", learn: ["O atalho fica na tela inicial, como um aplicativo comum.", "Carrega mais r�pido e abre as oportunidades em um toque.", "� gratuito e n�o ocupa espa�o como um app tradicional."], install: true, done: "Entendi" },
        { title: "Seu acesso continua igual", eyebrow: "PASSO 2 � CONCLUS�O", summary: "Depois de instalar, voc� continua entrando com a mesma conta, com o mesmo progresso e as mesmas oportunidades salvas.", learn: ["Entre pelo novo atalho na tela inicial.", "Sua conta, seu progresso e suas rotas continuam salvos.", "Se quiser, pode continuar usando pelo navegador normalmente."], bullets: ["Mesma conta e mesmo progresso.", "Atalho r�pido na tela inicial.", "Instala��o gratuita."], done: "Ganhar selo" }
      ]
    },
    {
      id: "beneficios-ripio",
      audience: "professional",
      category: "Benef�cios",
      title: "Cart�o pr�-pago, USDT e cashback",
      short: "Carregue antes de gastar, conhe�a o USDT e ganhe cashback.",
      icon: "",
      badge: { id: "explorador-beneficios", icon: "", name: "Explorador de Benef�cios", description: "Concluiu a jornada educativa sobre cart�o pr�-pago, cripto, USDT e cashback." },
      sponsor: "Conte�do educativo � link de indica��o",
      lessons: [
        { title: "Cart�o pr�-pago: o que �", eyebrow: "LI��O 1 � 2 MIN", summary: "� um cart�o que voc� carrega antes de usar: paga direto do saldo que j� est� l�. Sem fatura, sem parcelamento e sem surpresa no fim do m�s.", learn: ["Cart�o pr�-pago n�o � cr�dito: voc� coloca o dinheiro antes de gastar.", "D� para pagar com o app ou aproximando o celular (NFC), sempre do seu saldo.", "O limite de gasto � o que foi carregado  voc� controla quanto usa."], checkpoint: { question: "Cart�o pr�-pago �", options: ["Pago com o saldo que voc� carrega antes", "Um cr�dito com fatura no fim do m�s"], correct: 0 }, done: "Avan�ar" },
        { title: "Cripto e USDT na pr�tica", eyebrow: "LI��O 2 � 2 MIN", summary: "Cripto � dinheiro digital. O USDT � uma cripto est�vel: cada unidade vale cerca de 1 d�lar, sem c�dulas nem banco no meio.", warn: true, learn: ["Cripto � dinheiro digital, que circula pela internet sem c�dulas.", "O USDT � uma cripto est�vel: cada unidade vale cerca de 1 d�lar.", "Facilita pagamentos no Brasil e fora, mas outras criptos podem oscilar de pre�o."], checkpoint: { question: "O USDT �", options: ["Est�vel, vale cerca de 1 d�lar", "Nunca muda de valor"], correct: 0 }, action: { label: "Ler o guia completo", url: CRYPTO_ARTICLE, event: "crypto_article_opened" }, done: "Avan�ar" },
        { title: "Parceiros e como usar o cashback", eyebrow: "LI��O 3 � 2 MIN", summary: "Dentro do app, parceiros oferecem ofertas: voc� paga e uma parte do valor volta depois, conforme as regras.", learn: ["Parceiros s�o lojas e servi�os que aparecem dentro do app da Ripio.", "Pagando pelas ofertas, uma parte do valor volta como cashback.", "Cada oferta tem regras pr�prias: percentual, prazo e forma de pagamento."], checkpoint: { question: "Onde o cashback aparece?", options: ["Nas ofertas dos parceiros", "Em qualquer pagamento autom�tico"], correct: 0 }, done: "Avan�ar" },
        { title: "Cashback maior em USDT", eyebrow: "LI��O 4 � 2 MIN", summary: "Pagando em USDT, o cashback costuma ser maior do que pagando em reais  vale conferir as ofertas que premiam esse formato.", warn: true, learn: ["Algumas ofertas d�o cashback maior quando o pagamento � em USDT.", "O percentual sobe porque o parceiro economiza na convers�o da moeda.", "Sempre confira as regras da oferta para saber o quanto volta de verdade."], checkpoint: { question: "Cashback maior � pago em", options: ["USDT", "Qualquer forma, igualmente"], correct: 0 }, done: "Avan�ar" },
        { title: "Baixe o aplicativo oficial", eyebrow: "LI��O 5 � A��O", summary: "Acesse a p�gina da campanha e escolha a loja oficial do seu celular. Evite APKs e links recebidos de desconhecidos.", action: { label: "Baixar a Ripio", url: RIPIO_LINK, event: "ripio_download_opened" }, done: "J� baixei, continuar" },
        { title: "Cadastro pelo link", eyebrow: "LI��O 6 � A��O", summary: "Comece o cadastro pelo link da campanha para que a indica��o seja vinculada corretamente. Voc� n�o paga a mais por isso.", bullets: ["Crie uma senha exclusiva.", "Ative biometria ou autentica��o em duas etapas.", "Nunca compartilhe c�digo de acesso."], action: { label: "Fazer meu cadastro", url: RIPIO_LINK, event: "ripio_signup_opened" }, done: "Cadastro iniciado" },
        { title: "Pagando e acompanhando", eyebrow: "LI��O 7 � FINAL", summary: "Escolha a oferta, confira as regras e acompanhe o retorno no app.", learn: ["Antes de pagar, leia o que a oferta devolve, em quanto tempo e com quais condi��es.", "Guarde o comprovante e acompanhe o retorno direto no app.", "Conferir prazos e percentuais evita surpresas depois do pagamento."], checkpoint: { question: "Antes de pagar, voc� deve", options: ["Conferir as condi��es", "Ignorar prazo e percentual"], correct: 0 }, action: { label: "Ativar de vez", url: RIPIO_LINK, event: "ripio_activation_opened" }, done: "Ganhar meu selo" }
      ]
    },
    {
      id: "comunidade",
      audience: "professional",
      category: "Comunidade",
      title: "Conecte-se com a Rede de Fretes",
      short: "Motoristas e empresas em um s� lugar.",
      icon: "",
      badge: { id: "conectado-rede", icon: "", name: "Conectado � Rede", description: "Entrou na comunidade da Rede Integrativa de Fretes." },
      lessons: [
        { title: "Conhe�a a comunidade", eyebrow: "PASSO 1 � 1 MIN", summary: "A Rede Integrativa re�ne profissionais da estrada, transportadoras, oportunidades e informa��es �teis.", learn: ["A Rede Integrativa conecta motoristas, agregados e transportadoras.", "Por l� circulam oportunidades de frete e informa��es �teis da estrada.", "Participar amplia sua rede de contatos e chances de trabalho."], done: "Quero conhecer" },
        { title: "Entre no grupo", eyebrow: "PASSO 2 � A��O", summary: "Abra o grupo oficial no Facebook e solicite sua participa��o.", learn: ["O grupo oficial re�ne a comunidade da Rede Integrativa.", "Solicite sua entrada pelo bot�o abaixo.", "A aprova��o pode levar algumas horas."], action: { label: "Abrir grupo no Facebook", url: COMMUNITY_LINK, event: "community_group_opened" }, done: "Solicitei para entrar" },
        { title: "Fa�a parte da conversa", eyebrow: "PASSO 3 � CONCLUS�O", summary: "Ao participar, preserve seus dados, confirme as condi��es diretamente com as empresas e ajude a manter a comunidade segura.", learn: ["Preserve seus dados: evite documentos em coment�rios p�blicos.", "Desconfie de cobran�a antecipada e de oportunidades vagas.", "Reporte suspeitas e ajude a manter a comunidade segura."], bullets: ["N�o envie documentos em coment�rios p�blicos.", "Desconfie de cobran�a antecipada.", "Reporte oportunidades suspeitas."], done: "Concluir miss�o" }
      ]
    },
    {
      id: "voz-estrada",
      audience: "professional",
      category: "Colabora��o",
      title: "Ganhe o selo Voz da Estrada",
      short: "Compartilhe uma rota e ganhe seu selo.",
      icon: "",
      badge: { id: "voz-estrada", icon: "", name: "Voz da Estrada", description: "Compartilhou o PuxaRota com outros profissionais." },
      lessons: [
        { title: "Espalhe uma rota �til", eyebrow: "MISS�O R�PIDA", summary: "Compartilhe o PuxaRota com algu�m que possa aproveitar oportunidades e conte�dos da Rede.", learn: ["Compartilhar ajuda outro profissional a descobrir a Rede.", "Cada convite fortalece a comunidade e abre novas rotas.", "Seu selo mostra que voc� ajuda a estrada a andar junto."], share: true, done: "Compartilhei, concluir" }
      ]
    },
    {
      id: "seguranca-digital", audience: "professional", category: "Seguran�a",
      title: "N�o caia nos golpes da estrada", short: "Reconhe�a o alerta antes de agir.", icon: "",
      badge: { id: "guarda-estrada", icon: "", name: "Guarda da Estrada", description: "Concluiu a jornada de seguran�a digital para atuar sem cair em golpes." },
      lessons: [
        { title: "Os golpes mais comuns", eyebrow: "LI��O 1 � 2 MIN", summary: "Cobran�a antecipada, falsa carga e 'frete' que some depois do contato s�o os golpes que mais atingem quem vive da estrada.", learn: ["Cobran�a antecipada, falsa carga e frete que some s�o os golpes mais comuns.", "O golpista cria urg�ncia, press�o e pede dinheiro ou dados antes de qualquer servi�o.", "Quem pede dinheiro antes do servi�o � sinal de alerta  confirme tudo por escrito."], checkpoint: { question: "O que � um sinal de alerta?", options: ["Pedir dinheiro antes do servi�o", "Confirmar tudo por escrito"], correct: 0 }, done: "Avan�ar" },
        { title: "Proteja seus documentos", eyebrow: "LI��O 2 � 1 MIN", summary: "CNH, RG, CPF e comprovantes n�o devem ser enviados em coment�rios p�blicos, grupos abertos ou para desconhecidos.", learn: ["Documentos s�o dados sens�veis: envie s� depois de validar a empresa.", "Ao mostrar, oculte n�meros e evite fotos completas.", "Guarde c�pias separadas do aparelho para evitar perda e golpes."], bullets: ["Envie s� depois de validar a empresa.", "Oculte n�meros ao mostrar documentos.", "Guarde c�pias separadas do aparelho."], done: "Avan�ar" },
        { title: "WhatsApp seguro", eyebrow: "LI��O 3 � 1 MIN", summary: "Links recebidos, c�digos de verifica��o e APKs s�o caminhos comuns de golpe. O c�digo do WhatsApp nunca � pedido por ningu�m.", learn: ["Links recebidos, c�digos de verifica��o e APKs s�o caminhos comuns de golpe.", "O c�digo de verifica��o do WhatsApp � pessoal e nunca deve ser compartilhado.", "Se algu�m pedir seu c�digo, � golpe: ningu�m leg�timo precisa dele."], checkpoint: { question: "Recebeu pedido do seu c�digo de verifica��o?", options: ["N�o compartilho nunca", "Envio para confirmar"], correct: 0 }, done: "Avan�ar" },
        { title: "Pagamentos e adiantamentos", eyebrow: "LI��O 4 � 1 MIN", summary: "Desconfie de pagamento 'adiantado' que exige dep�sito ou taxa para liberar. Combinado por escrito e fonte verificada reduzem o risco.", learn: ["Cobran�a antecipada para liberar frete � o golpe mais comum na estrada.", "Registre valores e prazos por escrito antes de aceitar qualquer coisa.", "Fonte verificada e urg�ncia controlada s�o suas melhores defesas."], bullets: ["Confirme a fonte da oportunidade.", "Registre valores e prazos combinados.", "Desconfie de urg�ncia para pagar r�pido."], done: "Avan�ar" },
        { title: "Sua regra de ouro", eyebrow: "LI��O 5 � FINAL", summary: "A regra que resume tudo: se pede dinheiro antes, cobra urg�ncia ou pressiona no WhatsApp, confirme antes de agir.", learn: ["Se pede dinheiro antes, cobra urg�ncia ou pressiona no WhatsApp, � hora de parar.", "Verifique a empresa e o que � p�blico antes de seguir com um contato novo.", "Confirmar antes de agir protege seu trabalho e seu dinheiro."], checkpoint: { question: "Antes de seguir um contato novo", options: ["Verifico a empresa e o que � p�blico", "Aceito a oferta direto"], correct: 0 }, done: "Ganhar selo" }
      ]
    },
    {
      id: "financas-estrada", audience: "professional", category: "Finan�as",
      title: "Descubra quanto cada rota rende de verdade", short: "Combust�vel, manuten��o, pneus e paradas: calcule o custo real, crie reserva e escolha fretes que valem a pena.", icon: "",
      badge: { id: "caixa-estrada", icon: "", name: "Caixa da Estrada", description: "Concluiu a jornada para organizar custos, reserva e o retorno das rotas." },
      lessons: [
        { title: "O custo vai al�m do combust�vel", eyebrow: "LI��O 1 � 2 MIN", summary: "Manuten��o, pneus, alimenta��o e o tempo parado tamb�m entram no custo de cada rota. Calcule antes de aceitar.", learn: ["O custo da rota vai al�m do combust�vel: manuten��o, pneus, alimenta��o e paradas contam.", "Calcular s� o valor do combust�vel esconde quanto a rota realmente custa.", "Somando tudo antes de aceitar, voc� descobre se o frete vale a pena."], checkpoint: { question: "O que entra no custo da rota?", options: ["Combust�vel, manuten��o e paradas", "S� o valor do combust�vel"], correct: 0 }, done: "Avan�ar" },
        { title: "Reserva para imprevistos", eyebrow: "LI��O 2 � 1 MIN", summary: "Uma reserva pequena por rota evita que um pneu ou uma espera virem aperto no fim do m�s.", learn: ["Reserva � o dinheiro que fica guardado para os imprevistos da estrada.", "Separe um valor fixo por viagem  pequeno, mas constante.", "N�o misture a reserva com o dinheiro de gastos do dia a dia."], bullets: ["Separe um valor fixo por viagem.", "N�o misture a reserva com o dinheiro de gastos.", "Recomponha a reserva sempre que usar."], done: "Avan�ar" },
        { title: "Organize por rota", eyebrow: "LI��O 3 � 1 MIN", summary: "Registrar ganho e gasto de cada rota mostra quais valem a pena e quais pesam mais do que rendem.", learn: ["Registrar ganho e gasto de cada rota mostra quais valem a pena.", "Uma rota de valor bruto alto pode render menos depois de somar os custos.", "Comparar ganho e custo da mesma rota � o jeito certo de decidir."], checkpoint: { question: "Para saber se uma rota compensa", options: ["Comparo ganho e custo daquela rota", "S� olho o valor bruto"], correct: 0 }, done: "Avan�ar" },
        { title: "Meta de reserva", eyebrow: "LI��O 4 � FINAL", summary: "Defina uma meta simples, como uma reserva que cubra um m�s de manuten��o. Pequenos dep�sitos constantes constroem isso.", learn: ["Reserva � o dinheiro separado para imprevistos, como um pneu ou uma espera.", "Uma meta simples, como cobrir um m�s de manuten��o, j� tira o aperto.", "Pequenos dep�sitos constantes constroem a reserva  esperar sobrar quase nunca funciona."], checkpoint: { question: "O melhor jeito de criar reserva �", options: ["Guardar um pouco sempre", "Guardar s� quando sobra"], correct: 0 }, done: "Ganhar selo" }
      ]
    },
    {
      id: "empresa-vaga-confiavel", audience: "company", category: "Para empresas",
      title: "Publique vagas que geram confian�a", short: "Rota, ve�culo, rotina e condi��es claras atraem profissionais mais alinhados. Sem cobran�a antecipada nem pedidos p�blicos de documento.", icon: "",
      badge: { id: "empresa-vaga-clara", icon: "", name: "Vaga Clara", description: "Aprendeu a publicar oportunidades completas e verific�veis." },
      lessons: [
        { title: "Comece pelo essencial", eyebrow: "TRECHO 1 � 1 MIN", summary: "Informe rota, ve�culo, rotina e condi��o antes de publicar.", learn: ["Informe rota, ve�culo, rotina e condi��o antes de publicar.", "Uma vaga clara atrai profissionais mais alinhados e menos retrabalho.", "Condi��es transparentes geram confian�a desde o primeiro contato."], checkpoint: { question: "O que gera mais confian�a?", options: ["Condi��es claras", "Promessa sem detalhes"], correct: 0 }, done: "Avan�ar" },
        { title: "Proteja quem se candidata", eyebrow: "TRECHO 2 � 1 MIN", summary: "Nunca pe�a pagamento antecipado, senha ou documento em coment�rio p�blico.", learn: ["Nunca pe�a pagamento antecipado, senha ou documento em coment�rio p�blico.", "Pe�a documentos apenas em canal seguro e autorizado.", "Proteger quem se candidata � proteger a reputa��o da sua vaga."], checkpoint: { question: "Onde pedir documentos?", options: ["Em canal seguro e autorizado", "Em qualquer coment�rio"], correct: 0 }, done: "Avan�ar" },
        { title: "Revise antes de publicar", eyebrow: "TRECHO 3 � FINAL", summary: "Confira prazo, regi�o e contato respons�vel. A vaga entra para an�lise antes de aparecer.", bullets: ["Sem cobran�a antecipada.", "Contato empresarial verific�vel.", "Prazo e condi��es atualizados."], done: "Ganhar selo" }
      ]
    },
    {
      id: "empresa-contratacao-responsavel", audience: "company", category: "Para empresas",
      title: "Contrate com consentimento e hist�rico", short: "Pe�a acesso ao perfil, registre a contrata��o e avalie rela��es reais  sem capturar dados sem autoriza��o.", icon: "",
      badge: { id: "empresa-contrata-bem", icon: "", name: "Contrata��o Respons�vel", description: "Concluiu a jornada de contato, contrata��o e avalia��o segura." },
      lessons: [
        { title: "Solicite, n�o capture", eyebrow: "TRECHO 1 � 1 MIN", summary: "Pe�a acesso ao perfil. O contato s� � liberado ap�s autoriza��o do profissional.", learn: ["Pe�a acesso ao perfil antes de usar os dados.", "O contato s� � liberado ap�s a autoriza��o do profissional.", "Consentimento claro constr�i um hist�rico confi�vel para os dois lados."], checkpoint: { question: "Quem libera o contato?", options: ["O profissional", "A empresa sozinha"], correct: 0 }, done: "Avan�ar" },
        { title: "Registre a contrata��o", eyebrow: "TRECHO 2 � 1 MIN", summary: "Vincule empresa, profissional e vaga para formar um hist�rico confi�vel para os dois lados.", done: "Avan�ar" },
        { title: "Avalie uma rela��o real", eyebrow: "TRECHO 3 � FINAL", summary: "A avalia��o fica dispon�vel depois da contrata��o e aparece como m�dia, sem expor dados privados.", learn: ["A avalia��o fica dispon�vel depois de uma contrata��o real.", "Ela aparece como m�dia, sem expor dados privados.", "Avaliar rela��es reais protege a reputa��o de todos."], checkpoint: { question: "Quando avaliar?", options: ["Ap�s uma contrata��o real", "Antes de qualquer contato"], correct: 0 }, done: "Ganhar selo" }
      ]
    }
  ];

  const FUTURE_ROUTES = [
    { icon: "", title: "Contratos e documentos", text: "O que conferir antes de assinar um frete." },
    { icon: "", title: "Reputa��o do motorista", text: "Como boas avalia��es abrem novas oportunidades." }
  ];
  const GRADES = [
    { min: 0, name: "Na Partida" },
    { min: 1, name: "Explorador" },
    { min: 3, name: "Conectado" },
    { min: 5, name: "Desbravador" },
    { min: 10, name: "Mestre das Rotas" },
    { min: 20, name: "Lenda da Estrada" }
  ];

  const SCENES = {
    "beneficios-ripio": { looks: ["amanhecer", "meio-dia", "poente", "noite", "dia-azul", "tempestade", "tarde-dourada", "aurora"], mascot: "rupi", deco: "card" },
    "comunidade": { looks: ["dia-azul", "neblina", "manha", "amanhecer"], mascot: "rupi", deco: "group" },
    "voz-estrada": { looks: ["entardecer", "poente"], mascot: "carcara", deco: "share" },
    "seguranca-digital": { looks: ["noite", "chuva", "tempestade", "neblina", "manha"], mascot: "rupi", deco: "shield" },
    "financas-estrada": { looks: ["dia-azul", "tarde-dourada", "meio-dia", "noite", "amanhecer"], mascot: "rupi", deco: "coin" },
    "empresa-vaga-confiavel": { looks: ["manha", "entardecer", "neblina", "dia-azul"], mascot: "carcara", deco: "clip" },
    "empresa-contratacao-responsavel": { looks: ["dia-azul", "poente", "noite", "amanhecer"], mascot: "rupi", deco: "handshake" },
    "instalar-app": { looks: ["manha", "dia-azul", "tarde-dourada", "amanhecer"], mascot: "rupi", deco: "install" }
  };
  const SCENE_LOOKS = {
    "dia-azul": { sky: ["#8ecbf5", "#cdeaff", "#bfe0a0", "#79a864", "#3e4642"], sun: true, clouds: 2, birds: 2 },
    "manha": { sky: ["#ffe3c2", "#fff2df", "#e8dc9f", "#8fae62", "#3e4642"], sun: true, clouds: 2, fog: true },
    "amanhecer": { sky: ["#cfe6ff", "#ffd9c9", "#f2c98f", "#a8a05c", "#3e4642"], sun: true, clouds: 1, birds: 1, fog: true },
    "meio-dia": { sky: ["#3f8fd0", "#8ecbf0", "#a9d77e", "#5d9e52", "#323a36"], sun: true, clouds: 1, birds: 2 },
    "poente": { sky: ["#ffb47a", "#ff7f5f", "#d96a92", "#7a5a66", "#3e4642"], sun: true, clouds: 2, birds: 2 },
    "entardecer": { sky: ["#f2a35f", "#cf6bb0", "#8a5ca8", "#4e4363", "#2e2833"], moon: true, stars: 2, clouds: 2 },
    "noite": { sky: ["#1c2135", "#28304d", "#3a4a63", "#26342c", "#22262a"], moon: true, stars: 4 },
    "tempestade": { sky: ["#38414f", "#55606e", "#65704f", "#39413d", "#262c28"], lightning: true, clouds: 3, storm: true },
    "chuva": { sky: ["#7c8ea3", "#a9b8c6", "#8fa37f", "#55643f", "#2e3338"], rain: true, clouds: 3 },
    "neblina": { sky: ["#cfd6d9", "#e8ecec", "#c9cfae", "#93a17d", "#4a514c"], fog: true, clouds: 1 },
    "tarde-dourada": { sky: ["#ffc988", "#ffe3b0", "#e8c27f", "#93a05c", "#3e4642"], sun: true, clouds: 2, birds: 1 },
    "aurora": { sky: ["#7e6aa5", "#c98bb0", "#e8a06f", "#7f8a52", "#2e2a36"], sun: true, clouds: 2, birds: 1 }
  };
  const SCENE_DECOS = {
    card: { icon: "", label: "cart�o pr�-pago" },
    crypto: { icon: "", label: "cripto" },
    cashback: { icon: "", label: "cashback" },
    group: { icon: "", label: "comunidade" },
    share: { icon: "", label: "compartilhar" },
    shield: { icon: "", label: "prote��o" },
    docs: { icon: "", label: "documentos" },
    whatsapp: { icon: "", label: "WhatsApp" },
    alert: { icon: "", label: "aten��o" },
    coin: { icon: "", label: "reserva" },
    fuel: { icon: "", label: "custo" },
    chart: { icon: "", label: "organiza��o" },
    goal: { icon: "", label: "meta" },
    clip: { icon: "", label: "vaga" },
    handshake: { icon: "", label: "contrata��o" },
    install: { icon: "", label: "instala��o" },
    star: { icon: "", label: "selo" }
  };
  const SCENE_MASCOTS = {
    rupi: { next: "rupi-next.png", hint: "rupi-hint.png", pause: "rupi-pause.png", focus: "rupi-mascot.png", celebrate: "rupi-badge.png", alt: "Rupi acompanhando esta li��o" },
    faro: { next: "faro.png", hint: "faro.png", pause: "faro.png", focus: "faro.png", celebrate: "faro.png", alt: "Faro iluminando esta li��o" },
    carcara: { next: "carcara-flight.png", hint: "carcara-scout.png", pause: "carcara-scout.png", focus: "carcara-flight.png", celebrate: "carcara-scout.png", alt: "Carcar� guiando esta li��o" }
  };
  function sceneLookFor(route, lesson, lessonIndex) {
    const base = SCENES[route.id] || SCENES["comunidade"];
    const pool = base.looks || ["dia-azul"];
    const index = (lessonIndex ?? activeLesson) % pool.length;
    return SCENE_LOOKS[pool[index]] || SCENE_LOOKS["dia-azul"];
  }
  function sceneFor(route, lesson, lessonIndex) {
    const base = SCENES[route.id] || SCENES["comunidade"];
    let deco = base.deco;
    const title = (lesson.title || "") + " " + (lesson.summary || "");
    const pick = (keys, fallback) => keys.some((key) => title.toLowerCase().includes(key)) ? fallback : null;
    deco = pick(["cripto", "usdt", "bitcoin"], "crypto")
      || pick(["cashback"], "cashback")
      || pick(["cart�o", "cartao", "card"], "card")
      || pick(["documento", "cnh", "cpf", "rg"], "docs")
      || pick(["whatsapp", "mensagem", "c�digo"], "whatsapp")
      || pick(["golpe", "fraude", "cobran�a", "urg�ncia"], "alert")
      || pick(["seguro", "segura", "proteja", "prote��o"], "shield")
      || pick(["reserva", "poupar", "guardar"], "coin")
      || pick(["combust�vel", "combustivel", "custo", "manuten��o"], "fuel")
      || pick(["rota", "organize", "comparar"], "chart")
      || pick(["meta", "objetivo"], "goal")
      || pick(["vaga", "publique", "essencial", "revise"], "clip")
      || pick(["contrata��o", "contratacao", "consentimento", "registre", "avalia"], "handshake")
      || pick(["comunidade", "grupo", "conversa"], "group")
      || deco;
    const mascot = SCENE_MASCOTS[base.mascot] || SCENE_MASCOTS.rupi;
    const look = sceneLookFor(route, lesson, lessonIndex);
    const sky = look.sky.slice();
    const idx = lessonIndex ?? activeLesson;
    const tint = ((idx % 3) - 1) * 5;
    for (let i = 0; i < sky.length; i++) sky[i] = shade(sky[i], i % 2 === 0 ? tint : -tint);
    if (lesson.checkpoint) { sky[0] = shade(sky[0], -16); sky[1] = shade(sky[1], -10); }
    if (lesson.warn) { sky[2] = shade(sky[2], -20); sky[3] = shade(sky[3], -12); }
    return { sky, look, deco, decoMeta: SCENE_DECOS[deco] || SCENE_DECOS.star, mascot };
  }
  function mascotTheme(route, lesson) {
    const scene = sceneFor(route, lesson, activeLesson);
    const mood = moodFor(route, lesson, scene);
    return { tint: "", mood };
  }
  function moodFor(route, lesson, scene) {
    let mood = "mid";
    if (lesson.warn) mood = "alert";
    else if (lesson.share) mood = "happy";
    else if (lesson.action) mood = "eager";
    else if (lesson.checkpoint) mood = "think";
    else if (scene.deco === "crypto" || scene.deco === "docs") mood = "far";
    return mood;
  }
  const SCENE_SHOTS = ["wide", "close", "side", "high", "travel"];
  const TEACH_LABELS = ["AULINHA", "DICA", "SABIA?", "NA PR�TICA", "PARA LEMBRAR"];
  const BULLET_ICONS = ["", "", "", ""];
  function sceneMarkup(route, lesson, phase) {
    const scene = sceneFor(route, lesson, activeLesson);
    const mascot = scene.mascot;
    const theme = mascotTheme(route, lesson);
    const state = phase === "teach" ? (lesson.checkpoint ? "is-thinking" : "is-moving") : lesson.checkpoint ? "is-thinking" : "is-moving";
    const frame = phase === "teach" ? activeLesson * 2 + learnStep : activeLesson;
    const shot = SCENE_SHOTS[frame % SCENE_SHOTS.length];
    const look = scene.look;
    const parts = [];
    if (look.sun) parts.push('<i class="scene-sun"></i>');
    if (look.moon) parts.push('<i class="scene-moon"></i>');
    if (look.stars) {
      for (let i = 1; i <= look.stars; i++) parts.push(`<i class="scene-star s${i}"></i>`);
    }
    if (look.clouds) {
      for (let i = 1; i <= look.clouds; i++) parts.push(`<i class="scene-cloud c${i}"></i>`);
    }
    if (look.birds) {
      for (let i = 1; i <= look.birds; i++) parts.push(`<i class="scene-bird b${i}"></i>`);
    }
    if (look.rain) parts.push('<i class="scene-rain" aria-hidden="true"></i>');
    if (look.fog) parts.push('<i class="scene-fog" aria-hidden="true"></i>');
    if (look.lightning) parts.push('<i class="scene-bolt" aria-hidden="true"></i>');
    if (look.storm) parts.push('<i class="scene-gust" aria-hidden="true"></i>');
    const moodClass = theme.mood ? ` mood-${theme.mood}` : "";
    const pose = mascotPose(mascot, lesson, phase, theme.mood);
    const sky = scene.sky.map((color, index) => (phase === "teach" && learnStep > 0 ? shade(color, learnStep * 6 * (index % 2 === 0 ? 1 : -1)) : color));
    return `<div class="lesson-scene scene-${route.id} shot-${shot}" style="background:linear-gradient(${sky.join(",")})"><span class="road-line"></span>${parts.join("")}<i class="scene-deco">${scene.decoMeta.icon}</i><div class="lesson-symbol">${route.icon}</div><img class="rupi-scene ${state}${moodClass}" src="${mascot[pose]}" alt="${mascot.alt}"></div>`;
  }
  function mascotPose(mascot, lesson, phase, mood) {
    if (mascot.pause && lesson.warn) return "pause";
    if (mascot.celebrate && lesson.share) return "celebrate";
    if (mascot.hint && lesson.checkpoint) return "hint";
    if (mascot.focus && mood === "far") return "focus";
    if (phase === "teach") {
      const pool = ["welcome", "teach", "happy", "focus", "selo", "next", "hint"].filter((pose) => mascot[pose]);
      if (pool.length) return pool[activeLesson % pool.length];
    }
    if (mascot.hint && lesson.checkpoint) return "hint";
    return "next";
  }
  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
    const b = Math.min(255, Math.max(0, (n & 255) + amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

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
    if (!state || typeof state !== "object" || Array.isArray(state)) state = emptyState();
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
    window.dispatchEvent(new CustomEvent("puxarota:journey-updated"));
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
  function nextLesson() {
    if (!authenticated) return { locked: true };
    const pending = availableRoutes().filter((route) => !routeState(route).complete);
    if (!pending.length) return null;
    const route = pending.find((item) => routeState(item).started) || pending[0];
    const progress = routeState(route);
    const lessonIndex = Math.min(progress.step, route.lessons.length - 1);
    return { routeId: route.id, routeTitle: route.title, lessonIndex, lessonNumber: lessonIndex + 1, totalLessons: route.lessons.length, lessonTitle: route.lessons[lessonIndex].title };
  }
  function openNextLesson() {
    const next = nextLesson();
    q('[data-screen="routes"]')?.click();
    if (next && !next.locked) openRoute(next.routeId);
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
    const mission = dailyMission();
    const level = xpLevel(), nextLevel = nextXpLevel();
    root.innerHTML = `
      ${nextMissionCard()}
      <header class="journey-hero">
        <div><span class="journey-kicker">${accountType === "company" ? "JORNADA EMPRESARIAL" : "TEMPORADA 1 � P� NA ESTRADA"}</span><h1>${accountType === "company" ? "Evolua sua opera��o" : "Escolha sua pr�xima rota"}</h1><p>Toque, aprenda e ganhe selos.</p></div>
        <div class="grade-medal"><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "" : ""}</button><small>SEU GRAU</small><b>${esc(currentGrade.name)}</b><span>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"}</span></div>
        <div class="journey-character"><span class="character-road" aria-hidden="true"></span><img src="rupi-next.png" alt="Rupi seguindo para o pr�ximo trecho"><small>Rupi mostra o pr�ximo passo.</small></div>
      </header>
      <section class="journey-stats">
        <article><small>XP</small><b>${state.xp || 0}</b><i>${esc(level.name)}</i></article>
        <article><small>SEQU�NCIA</small><b>${state.streak || 0}</b><i>dias seguidos</i></article>
        <article><small>LI��ES</small><b>${catalog.reduce((sum, route) => sum + completedLessons(route), 0)}</b><i>conclu�das</i></article>
      </section>
      ${nextLevel ? `<section class="journey-progress"><div><span>Pr�ximo n�vel</span><strong>${nextLevel.min - state.xp} XP para ${nextLevel.name}</strong></div><div class="progress-track"><i style="width:${Math.max(6, state.xp / nextLevel.min * 100)}%"></i></div></section>` : ""}
      ${mission ? `<section class="daily-mission ${mission.done ? "done" : ""}"><span>MISS�O DO DIA</span><h2>${esc(mission.lesson.title)}</h2><p>${esc(mission.route.title)}${mission.done ? " � conclu�da hoje " : " � pr�xima li��o"}</p>${mission.done ? "" : '<button type="button" data-start-mission>Come�ar (+15 XP)</button>'}</section>` : ""}
      <div class="routes-heading"><div><span>ROTAS DISPON�VEIS</span><h2>Seu mapa de miss�es</h2></div><b>${catalog.filter((route) => routeState(route).complete).length}/${catalog.length}</b></div>
      <div class="mission-map">${catalog.map(routeCard).join("")}</div>
      <section class="badge-shelf"><span>COLE��O</span><h2>Selos da jornada</h2><div>${catalog.map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div></section>
      <section class="future-routes"><span>NO HORIZONTE</span><h2>Pr�ximas rotas</h2>${FUTURE_ROUTES.map(
    (item) => `<article><i>${item.icon}</i><div><strong>${item.title}</strong><p>${item.text}</p></div><b>EM BREVE</b></article>`).join("")}</section>
      ${eventSection()}
      <p class="route-disclosure">Conte�do educativo. Algumas rotas podem conter links de parceiros ou indica��o, sempre identificados. Nenhuma etapa promete ganhos ou substitui orienta��o financeira.</p>`;
    bindHub();
    q("[data-start-mission]", root)?.addEventListener("click", () => { track("mission_started", mission.route.id, mission.lessonIndex); openRoute(mission.route.id); });
  }
  function renderLocked() {
    const root = q("#routes-app"); if (!root) return;
    root.innerHTML = `<section class="routes-gate">
      <div class="gate-glow" aria-hidden="true"></div>
      <img src="carcara-scout.png" alt="Carcar� observando as pr�ximas Rotas">
      <span>ROTAS EXCLUSIVAS</span>
      <h1>Seu pr�ximo passo come�a aqui</h1>
      <p>Crie seu acesso gr�tis para aprender, avan�ar e guardar suas conquistas.</p>
      <div class="gate-benefits">
        <article><i></i><b>Miss�es r�pidas</b><small>Uma ideia por tela</small></article>
        <article><i></i><b>Selos no perfil</b><small>Seu progresso fica salvo</small></article>
        <article><i></i><b>Conte�do �til</b><small>Benef�cios e seguran�a</small></article>
      </div>
      <div class="gate-badges"><i>?</i><i>?</i><i>?</i><span>Seus primeiros selos est�o esperando.</span></div>
      <button type="button" data-create-account>Criar meu acesso gr�tis</button>
      <button type="button" class="gate-login" data-login-account>J� tenho conta</button>
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
  function nextMissionCard() {
    const pending = availableRoutes().filter((route) => !routeState(route).complete);
    if (!pending.length) return "";
    const route = pending[0];
    const done = completedLessons(route);
    const percent = Math.min(100, done / route.lessons.length * 100);
    const started = done > 0;
    return `<section class="next-mission"><span>PR�XIMA MISS�O</span><div class="next-mission-body"><i aria-hidden="true">${route.icon}</i><div><strong>${esc(route.title)}</strong><em>${esc(route.short)}</em><span class="mini-progress"><i style="width:${percent}%"></i></span><b>${done}/${route.lessons.length} etapas</b></div><button type="button" data-open-route="${route.id}">${started ? "Continuar" : "Come�ar"} </button></div></section>`;
  }
  function continueCard(route) {
    const progress = routeState(route);
    return `<button class="continue-route" type="button" data-open-route="${route.id}"><i>${route.icon}</i><span><small>CONTINUAR JORNADA</small><strong>${esc(route.title)}</strong><em>${completedLessons(route)}/${route.lessons.length} li��es conclu�das</em></span><b>Continuar </b></button>`;
  }
  function lessonMascot(route, lesson) {
    const scene = sceneFor(route, lesson);
    const theme = mascotTheme(route, lesson);
    const pose = mascotPose(scene.mascot, lesson, "lesson", theme.mood);
    return { src: scene.mascot[pose] || scene.mascot.next, alt: scene.mascot.alt, state: lesson.checkpoint ? "is-thinking" : "is-moving" };
  }
  function routeCard(route, index) {
    const progress = routeState(route), done = completedLessons(route), percent = done / route.lessons.length * 100;
    return `<button class="mission-card ${progress.complete ? "complete" : ""}" type="button" data-open-route="${route.id}">
      <span class="map-marker">${index + 1}</span><i class="mission-icon">${route.icon}</i>
      <span class="mission-copy"><small>${esc(route.category)} � ${progress.complete ? "CONCLU�DA" : done ? "EM ANDAMENTO" : "NOVA ROTA"}</small><strong>${esc(route.title)}</strong><em>${esc(route.short)}</em><span class="mini-progress"><i style="width:${percent}%"></i></span><b>${done}/${route.lessons.length} etapas</b></span>
      <span class="mission-arrow"></span>
    </button>`;
  }
  function badgeView(badge, earned) {
    return `<article class="badge ${earned ? "earned" : "locked"}"><i>${earned ? badge.icon : "?"}</i><strong>${esc(badge.name)}</strong><span>${earned ? "Conquistado" : "Bloqueado"}</span></article>`;
  }
  function googleCalendarLink(event) {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + (event.minutes || 60) * 60000);
    const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.subject,
      dates: stamp(start) + "/" + stamp(end),
      details: "Evento online da PuxaRota. " + (event.link ? "Link: " + event.link : "O link ser� disponibilizado em breve."),
      location: "Online"
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }
  function eventSection() {
    const event = NEXT_EVENT;
    const hasDate = Boolean(event.date) && !Number.isNaN(Date.parse(event.date));
    const when = hasDate ? new Date(event.date) : null;
    const dateDay = when ? String(when.getDate()).padStart(2, "0") : "�";
    const dateMonth = when ? when.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase() : "EM BREVE";
    const time = when ? when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
    const calendar = hasDate
      ? `href="${googleCalendarLink(event)}" target="_blank" rel="noopener"`
      : 'class="disabled" aria-disabled="true"';
    return `<section class="next-event"><header class="event-head"><span>EVENTOS DA COMUNIDADE</span><h2>Pr�ximo encontro</h2><p>Encontros ao vivo com a Rede. Participe: quem marca presen�a fica em destaque nas contrata��es.</p></header><article class="event-card">
      <div class="event-date"><b>${dateDay}</b><i>${dateMonth}</i></div>
      <div class="event-copy"><strong>${esc(event.subject)}</strong><p>${esc(event.description)}</p><em>${hasDate ? " " + time + " � " : ""}Online${event.link ? " � link dispon�vel" : " � link em breve"}</em></div>
      <div class="event-actions"><a ${calendar}>+ Google Agenda</a><a href="${esc(event.facebook)}" target="_blank" rel="noopener">Grupo no Facebook</a></div>
    </article></section>`;
  }
  function bindHub() {
    qa("[data-open-route]", q("#routes-app")).forEach((button) => button.onclick = () => openRoute(button.dataset.openRoute));
    q("[data-sound-toggle]", q("#routes-app"))?.addEventListener("click", toggleSound);
  }
  function toggleSound(event) {
    if (!audio) return;
    audio.toggle(); event.currentTarget.textContent = audio.muted() ? "" : "";
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
      <header class="lesson-top"><button type="button" data-back-routes aria-label="Voltar"></button><div><small>${esc(route.category)}</small><strong>${esc(route.title)}</strong></div><span class="lesson-count"><b>${activeLesson + 1}/${route.lessons.length}</b></span><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "" : ""}</button></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <article class="lesson-card">
        ${sceneMarkup(route, lesson, "lesson")}<span class="lesson-eyebrow">${esc(lesson.eyebrow)}</span>
        <h1>${esc(lesson.title)}</h1><p class="lesson-summary">${esc(lesson.summary)}</p>
        ${lesson.bullets ? `<ul>${lesson.bullets.map((item, index) => `<li><i>${BULLET_ICONS[index % BULLET_ICONS.length]}</i>${esc(item)}</li>`).join("")}</ul>` : ""}
        ${lesson.checkpoint ? `<div class="route-checkpoint"><strong>${esc(lesson.checkpoint.question)}</strong><div>${lesson.checkpoint.options.map((option, index) => `<button type="button" data-answer="${index}">${esc(option)}</button>`).join("")}</div><small>Responda para liberar o pr�ximo trecho</small></div>` : ""}
        ${lesson.action ? `<a class="lesson-action" data-route-action="${esc(lesson.action.event)}" href="${esc(lesson.action.url)}" target="_blank" rel="noopener nofollow"> <span>${esc(lesson.action.label)}</span></a>` : ""}
        ${lesson.install ? `<button class="lesson-action lesson-install" type="button" data-install-app><span>Instalar o PuxaRota no celular</span></button><p class="lesson-install-note">O bot�o acima instala o app na tela inicial do seu celular. Se nada acontecer, abra o menu do navegador e escolha "Instalar aplicativo".</p>` : ""}
        ${lesson.share ? `<button class="lesson-action" type="button" data-share-route> <span>Compartilhar conquista</span></button>` : ""}
        ${route.id === "beneficios-ripio" && lesson.warn ? '<p class="lesson-warning"> Criptoativos oscilam e envolvem riscos. Este conte�do � educativo e n�o � recomenda��o de investimento.</p>' : ""}
      </article>
      <div class="lesson-controls"><button class="lesson-done" type="button" data-complete-lesson ${lesson.checkpoint ? "disabled" : ""}>${esc(lesson.done || "Continuar")}</button></div>
    </section>`;
    qa("[data-back-routes]", root).forEach((button) => button.onclick = renderHub);
    q("[data-sound-toggle]", root)?.addEventListener("click", toggleSound);
    q("[data-route-action]", root)?.addEventListener("click", (event) => track(event.currentTarget.dataset.routeAction, route.id, activeLesson));
    q("[data-install-app]", root)?.addEventListener("click", async () => {
      const result = await window.PuxaRotaInstall?.prompt?.();
      if (!result || !result.ok) toast("No celular: use o menu do navegador e escolha 'Instalar aplicativo'.");
    });
    qa("[data-answer]", root).forEach((button) => button.onclick = () => {
      const correct = Number(button.dataset.answer) === lesson.checkpoint.correct;
      qa("[data-answer]", root).forEach((item) => { item.disabled = false; item.classList.remove("correct", "wrong"); });
      button.classList.add(correct ? "correct" : "wrong");
      const mascot = q(".rupi-scene", root);
      if (mascot) mascot.classList.toggle("is-correct", correct);
      const done = q("[data-complete-lesson]", root);
      if (done) done.disabled = !correct;
      q(".route-checkpoint small", root).textContent = correct ? "Boa! Voc� pode avan�ar." : "Quase. Tente a outra op��o.";
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
      <header class="lesson-top"><button type="button" data-back-routes aria-label="Voltar"></button><div><small>${esc(route.category)}</small><strong>${esc(route.title)}</strong></div><span class="lesson-count"><b>${activeLesson + 1}/${route.lessons.length}</b></span><button class="sound-toggle" type="button" data-sound-toggle aria-label="Alternar sons">${audio?.muted() ? "" : ""}</button></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <article class="lesson-card lesson-teach">
        ${sceneMarkup(route, lesson, "teach")}
        <span class="lesson-eyebrow">${TEACH_LABELS[learnStep % TEACH_LABELS.length]} � ${esc(lesson.eyebrow)}</span>
        ${learnStep === 0 ? `<h1>${esc(lesson.title)}</h1>` : `<h2 class="lesson-teach-sub">${esc(lesson.title)}</h2>`}
        <p class="lesson-summary lesson-teach-text">${esc(content)}</p>
        <div class="teach-dots">${lesson.learn.map((_, index) => `<i class="${index === learnStep ? "on" : ""}"></i>`).join("")}</div>
        <small class="teach-step">Passo ${learnStep + 1} de ${lesson.learn.length}</small>
      </article>
      <div class="lesson-controls"><button class="lesson-done" type="button" data-next-learn>${last ? (lesson.checkpoint ? "Ir para o desafio" : "Ver conte�do") : "Continuar"}</button></div>
    </section>`;
    qa("[data-back-routes]", root).forEach((button) => button.onclick = () => { activePhase = "learn"; learnStep = 0; renderHub(); });
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
    root.innerHTML = `<section class="route-celebration"><div class="confetti" aria-hidden="true"> �  � </div><img class="rupi-celebrate" src="rupi-badge.png" alt="Rupi comemorando"><span>ROTA CONCLU�DA</span><div class="earned-medal">${route.badge.icon}</div><h1>${esc(route.badge.name)}</h1><p>${esc(route.badge.description)}</p><strong>Novo grau: ${esc(currentGrade.name)}</strong><button type="button" data-finish-route>Voltar ao mapa</button></section>`;
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
    root.innerHTML = `<div class="journey-profile-head"><div><small>${accountType === "company" ? "JORNADA DA EMPRESA" : "MINHA JORNADA"}</small><h2>${esc(currentGrade.name)}</h2><p>${state.badges.length} selo${state.badges.length === 1 ? "" : "s"} conquistado${state.badges.length === 1 ? "" : "s"}</p></div><button type="button" data-profile-routes>Ver rotas</button></div><div class="journey-profile-meta"><span><i>${state.xp || 0}</i> XP � ${esc(level.name)}</span><span><i>${state.streak || 0}</i> ${state.streak === 1 ? "dia" : "dias"} seguidos</span></div><div class="profile-badges">${availableRoutes().map((route) => badgeView(route.badge, state.badges.includes(route.badge.id))).join("")}</div>`;
    q("[data-profile-routes]", root).onclick = () => q('[data-screen="routes"]')?.click();
  }
  function render() { authenticated ? renderHub() : renderLocked(); renderProfile(); }
  function applyNextEvent(event) {
    if (!event) return;
    NEXT_EVENT = {
      subject: event.subject || NEXT_EVENT.subject,
      description: event.description || NEXT_EVENT.description,
      date: event.date || "",
      minutes: Number(event.minutes) || NEXT_EVENT.minutes,
      link: event.link || "",
      facebook: event.facebook || NEXT_EVENT.facebook
    };
    if (q("#screen-routes")?.classList.contains("active")) render();
    else renderProfile();
  }
  async function loadNextEvent() {
    const event = await window.PuxaRotaAuth?.listNextEvent?.();
    if (event) applyNextEvent(event);
  }
  window.PuxaRotaRoutes = { render, catalog: ROUTES, getState: () => state, nextLesson, openNextLesson, applyNextEvent };
  document.addEventListener("DOMContentLoaded", renderProfile);
  loadNextEvent();
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
