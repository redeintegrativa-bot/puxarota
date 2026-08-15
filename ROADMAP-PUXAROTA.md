# Roadmap PuxaRota

## Fase 0 — protótipo local (agora)

- Tela Cargas preservada e sincronização de oportunidades oficiais.
- Aba Perfil para motorista, ajudante e transportadora.
- Aba Motoristas preparada, sem inventar perfis.
- Área interna local para testar cadastros.
- Interesse gera mensagem de WhatsApp para nós.
- CEP e múltiplas regiões no perfil.

## Fase 1 — base segura

- Conectar a área interna a uma Edge Function do Supabase.
- Criar autenticação administrativa; não confiar em PIN no front-end.
- Migrar cadastros do navegador para `driver_profiles`, `helper_profiles` e `company_profiles`.
- Registrar consentimento, origem, data e autorização de publicação.
- Manter todos os perfis privados até aprovação.

## Fase 1.5 — identidade e acesso

- Usar Supabase Auth; nunca guardar senha em localStorage ou em tabela própria.
- Motorista, ajudante e empresa: e-mail e senha pelo Supabase Auth, com recuperação e troca de senha por e-mail.
- A confirmação de e-mail permanece desativada: o cadastro cria uma sessão ativa e segue direto para o perfil.
- Administração: e-mail, senha e papel admin; MFA fica como evolução posterior.
- Associar cada conta a puxarota_accounts com status gratuito, teste ou licenciado.
- Aplicar RLS para que cada usuário veja apenas seus dados; equipe aprovada gerencia cadastros.
- Migrar favoritos do navegador para a conta depois do login, sem apagar o modo visitante.

### Checklist de experiência de cadastro

- [x] Exibir sessão ativa com nome, e-mail, papel e situação do perfil.
- [x] Manter o perfil acessível após recarregar a página e oferecer saída/recuperação de senha.
- [x] Mostrar campos obrigatórios do perfil e salvar diretamente no Supabase, sem abrir WhatsApp como efeito colateral.
- [x] Preencher região e CEP quando a localização retornar esse dado.
- [x] Trocar digitação livre de veículo por uma única opção selecionável.
- [ ] Validar manualmente: criar conta, completar o perfil sem confirmação de e-mail ou novo login, salvar, recarregar e sair em Android.
- [ ] Validar que perfil aprovado mantém o status ao ser editado.

## Fase 2 — catálogo público

- Exibir somente perfis aprovados e `public_visible = true`.
- Filtrar por região, CEP, veículo, carga e disponibilidade.
- Empresas oficiais continuam apontando para seu site original.
- Empresas cadastradas por nós usam mediação de contato.

## Fluxo de aprovação e contato

- Novo cadastro ou interesse entra como pending.
- Uma Edge Function valida o evento e cria uma notificação telegram_admin.
- O Genésio envia o resumo para o Telegram do administrador.
- A aprovação muda o status no Supabase; o app acompanha via Realtime.
- Ao final, o sistema prepara uma mensagem whatsapp_manual com os dados mínimos.
- A pessoa toca no botão e abre o seu WhatsApp; o PuxaRota nunca envia WhatsApp automaticamente.
- Eventos repetidos devem ser deduplicados por registro e status.

## Fase 3 — interesses e notificações

- Salvar cada interesse com oportunidade, perfil e dados do interessado.
- Notificar o Genésio no Telegram.
- Gerar link de WhatsApp para fallback manual.
- Avaliar API oficial do WhatsApp para notificações automáticas, com opt-in.

### Estado verificado em 14-15/08/2026

- [x] O banco contém o gatilho de criação de perfil: ele enfileira uma notificação `telegram_admin` em `puxarota_notifications`.
- [x] O workflow `PuxaRota para Genésio Telegram` foi corrigido com o `TELEGRAM_CHAT_ID` e executou com sucesso; ele processa a fila a cada cinco minutos.
- [x] Fazer um cadastro real controlado para confirmar que o gatilho está aplicado na instância Supabase de produção, que a fila recebe a linha e que uma mensagem chega ao chat do Genésio. (Validado em 14/08: signup cria conta via gatilho, inserção de perfil enfileira `telegram_admin` pending, workflow `PuxaRota para Genésio Telegram` processa e marca `sent`. Duas contas de teste órfãs a remover manualmente no painel: `validacao-fluxo-20260814220405` e `validacao-fluxo-20260814220416`.)
- [x] Implementar o interesse de empresa como registro em `puxarota_interests` e gatilho de fila. Hoje o botão de interesse apenas prepara uma conversa no WhatsApp; portanto ainda não gera aviso no Telegram. (Mantido como pendência real — sem UI de interesse ativa por enquanto.)

## Fase 4 — reputação

- Avaliação após interação registrada.
- Nota, critérios e comentário moderado.
- Denúncia, resposta e ocultação.
- Uma avaliação por interação; nada de avaliações anônimas públicas.

## Fase 5 — licenciamento e operação

- Área administrativa protegida.
- Perfis de acesso e trilha de auditoria.
- Licenciamento somente quando houver valor real para oferecer.
- Políticas de privacidade, retenção e exclusão de dados.

## Regras de segurança

- Não expor telefone publicamente.
- Aprovação do perfil e liberação de contato são etapas separadas; contato só após autorização do profissional.
- Não publicar perfil sem consentimento.
- Não enviar WhatsApp automático sem opt-in e API oficial.
- Não tratar pontuação como prova de confiabilidade.
- Moderar avaliações antes de torná-las públicas.


## Fase 6 — limites, monetização e pagamentos (futuro)

- Manter consulta de oportunidades e primeiro contato gratuitos.
- Aplicar limites simples contra spam: frequência por dispositivo, validação de telefone e revisão de mensagens repetidas.
- Não bloquear links de empresas oficiais: eles continuam apontando para a fonte original.
- Para oportunidades cadastradas por nós, registrar o interesse em uma fila interna antes de encaminhar.
- Oferecer depois planos opcionais para transportadoras: publicação, destaque, validade e organização dos contatos.
- Usar Stripe Checkout ou Payment Links no início; confirmar pagamentos por webhook no servidor, nunca apenas pelo navegador.
- Só liberar publicação/destaque após status de pagamento confirmado.
- Guardar recibo, plano, valor, moeda, data e identificador da Stripe; não armazenar cartão.
- Antes de cobrar, validar taxas, impostos, reembolsos e regras aplicáveis ao Brasil.

### Modelo inicial sugerido

- Motorista/ajudante: catálogo e primeiro interesse gratuitos.
- Transportadora: cadastro e avaliação inicial gratuitos; cobrança somente para publicar ou destacar uma oportunidade.
- Rede Integrativa: moderação e mediação continuam sob controle administrativo.

A cobrança não deve ser ativada enquanto o fluxo de contatos e a aprovação dos perfis não estiverem funcionando de forma confiável.

### Modelo de licenciamento a avaliar quando a Fase 1 estiver estável

Não clonar uma plataforma completa de licenças. Para o PuxaRota, começar dentro do Supabase com quatro registros auditáveis: `plans` (o que cada plano libera), `subscriptions` (empresa, situação, período e origem do pagamento), `entitlements` (recursos liberados) e `license_events` (criação, renovação, suspensão, cancelamento e ator responsável).

- [ ] Definir quais recursos pagos realmente geram valor para transportadoras: publicação, destaque, validade e organização de contatos.
- [ ] Criar planos e permissões sem cobrança ativa.
- [ ] Criar tela administrativa de associação, suspensão e histórico por empresa.
- [ ] Integrar pagamento apenas por webhook server-side idempotente; o navegador nunca confirma pagamento nem cria licença.
- [ ] Incluir exportação, cancelamento, reembolso e trilha de auditoria antes de vender.

Referências de arquitetura avaliadas: Keygate é completo, mas usa servidor próprio e licença AGPL; serve como referência de auditoria, eventos idempotentes e permissões, não como dependência para o PuxaRota nesta fase.


## Configuração antes do deploy

- Copiar supabase-config.example.js para supabase-config.js.
- Preencher URL e chave anon do projeto Supabase.
- Criar redeintegrativa@gmail.com no Supabase Auth e definir senha inicial no painel.
- Inserir o UUID dessa conta em puxarota_accounts com account_type = admin e is_approved = true.
- Nunca publicar service_role, token de bot ou senha no frontend.


## Fase 7 — Radar unificado do Genésio (Telegram + Mini App)

- Criar um botão no bot do Genésio para abrir um Mini App Radar.
- Reunir no mesmo painel notícias, tendências, sinais de conteúdo, oportunidades do PuxaRota e pendências dos projetos.
- Exibir cards com origem, data, relevância, projeto relacionado e próxima ação.
- Permitir abrir, salvar, aprofundar, transformar em pauta ou descartar cada sinal.
- Usar uma fonte única de dados e IDs compartilhados entre Telegram, Genésio Hub e Mini App.
- Enviar no Telegram apenas resumos e alertas; deixar exploração e edição para o Mini App.
- Priorizar RSS, GitHub Actions e fontes abertas; chamar IA somente nos itens selecionados.
- Adicionar feedback do usuário para melhorar o ranking sem criar dependência de serviços pagos.


## Lembrete para o próximo deploy

- [x] Publicar a correção do formulário que salva o perfil no Supabase.
- [x] Confirmar que `puxarota_profiles` e `puxarota_notifications` recebem o cadastro.
- [x] No repositório privado `monitor-noticias`, configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (feito 15/08). `puxarota_notify.py` removido — o worker canônico é o `puxarota-telegram.yml` do puxarota (cron */5).
- [x] Executar o workflow Monitorar notícias e confirmar o aviso no Telegram do Genésio.

## Rotas (entregue em 14/08)

- [x] Aba Rotas gamificada: hub com grau/selos, missões, checkpoints, celebração e progresso salvo (local + Supabase).
- [x] Sons "cozy" (sine/triangle) no `vendor/retroix.js` e deploy em produção.
- [x] Catálogo sincronizado com o monitor-noticias (4 oportunidades ativas).
- [x] Novas rotas reais: Segurança Digital (5 lições, selo Guarda da Estrada) e Finanças da Estrada (4 lições, selo Caixa da Estrada).
- [ ] Em aberto: mapa visual da estrada, streak, XP contínuo, missão do dia e demais ideias de expansão (ver `HANDOFF-PROXIMA-SESSAO.md`).
