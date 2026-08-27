# Checklist operacional — PuxaRota

## Concluído

- [x] Definir schema público de oportunidades.
- [x] Separar páginas oficiais de anúncios temporários.
- [x] Coletar com Python sem dependências externas.
- [x] Normalizar veículo, região, origem e confiança.
- [x] Remover duplicidades e parâmetros de rastreamento.
- [x] Expirar anúncios temporários.
- [x] Preservar feed durante falhas parciais.
- [x] Registrar erros por fonte.
- [x] Cobrir regras centrais com testes.
- [x] Gerar jobs.json.
- [x] Consumir feed no painel com fallback.
- [x] Consultar GPS somente por ação do usuário.
- [x] Corrigir sobreposição em telas pequenas.
- [x] Agendar coleta pelo GitHub Actions.
- [x] Adicionar retry por fonte no coletor.
- [x] Separar painel em index.html, styles.css e app.js.
- [x] Implementar tela Salvas com localStorage.
- [x] Remover recursos simulados (Minha rota, Alertas, Meu veículo, conversa, envio de perfil).
- [x] Testar cada botão visível.
- [x] Validar layout em 320, 360, 390 e 412 px.
- [x] Implementar banco privado para perfis e interesses autenticados.
- [x] Aplicar as migrações no Supabase de produção (dry-run confirma aplicadas) e validar o aviso real no Telegram (cadastro controlado → fila → envio, verificado em 14/08).
- [x] Remover empresas de reputação ruim do catálogo automático (JSL, SPX Express, Comercial Esperança, FateLog) e exigir aprovação manual.
- [x] Criar aba Rotas gamificada (missões, selos, sons cozy, progresso local + Supabase) e publicar em produção.
- [x] Adicionar novas rotas: Segurança Digital e Finanças da Estrada (selos próprios, cenas customizadas).
- [x] Sincronizar catálogo com o monitor-noticias (app-data.js ao vivo + sync_puxarota.py por hora).
- [x] Limpeza 15/08: fallback do app.js coerente com o catálogo, sw.js com precache completo, `listMyActivity` órfão removido, `*-source.png` fora do git, OG tags no app, docs atualizados.

## Pendências

- [x] Remover manualmente no painel Supabase as 2 contas de teste órfãs (`validacao-fluxo-20260814220405`, `validacao-fluxo-20260814220416`) — verificado em 15/08: não existem mais (auth com 6 usuários reais, sem órfãos).
- [x] Monitor-noticias: configurar secret `SUPABASE_SERVICE_ROLE_KEY` (feito 15/08). Worker `puxarota_notify.py` removido (duplicava o canônico `puxarota-telegram.yml`).
- [ ] Corrigir falha flaky pré-existente no `test_app_content.mjs` (assert alquimistas, virada de dia UTC).
- [ ] Validar empresa/CNPJ e sinalizar anúncios suspeitos.
- [ ] Notificar encerramento e permitir denúncia.
- [ ] Medir conversão: visualização → interesse → contato.
- [ ] Definir política comercial de créditos e estornos.
- [ ] Incluir Raça Transportes após o certificado TLS passar a ser reconhecido.

## Regra de privacidade

GitHub e jobs.json armazenam somente dados públicos das oportunidades. GPS, telefone, perfil, candidatura e histórico pessoal não entram no repositório.
