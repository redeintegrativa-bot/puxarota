# Handoff — próxima sessão do PuxaRota

Data: 2026-08-15

## Estado estável preservado

- Produção: https://puxarota.vercel.app
- GitHub: https://github.com/redeintegrativa-bot/puxarota (branch main)
- Supabase: `zuxdmavskeylivdznenv` (CLI linked; migrações aplicadas)
- Catálogo ativo (jobs.json, 4 oportunidades): Transportes Bertolini, Expresso GM, Único Group, Atua Transportes.
- Aba Rotas em produção: 7 rotas (5 motorista + 2 empresa), 6 graus, selos, sons cozy, mascotes, progresso local + Supabase.
- Suíte de testes: 69 testes (test_collector, test_frontend, test_routes).

## Pedido aberto do usuário

Explorar o que mais colocar na aba de Rotas (missões gamificadas). Já mapeado: hub + lições + celebração + perfil. Ideias propostas: novas rotas reais, mapa visual da estrada, sequência/streak, XP contínuo, missão do dia, rotas ligadas ao catálogo, recompensa por grau, revisão/quiz, meta semanal, mais rotas para empresas.

## Novas rotas entregues em 15/08

- `seguranca-digital` (5 lições, selo "Guarda da Estrada" 🛡): golpes comuns, documentos, WhatsApp seguro, pagamentos/adiantamentos.
- `financas-estrada` (4 lições, selo "Caixa da Estrada" ◈): custo além do combustível, reserva para imprevistos, organização por rota, meta de reserva.
- `FUTURE_ROUTES` agora mostra: Contratos e documentos; Reputação do motorista.
- Cenas customizadas no CSS (`scene-seguranca-digital`, `scene-financas-estrada`).
- Testes: 69 (novo `test_new_routes_security_and_finance_are_playable`).

## Limpeza realizada em 2026-08-15

- `app.js`: fallback offline atualizado — removidas JSL, SPX, Comercial Esperança e HF LOG (por reputação/DNS); agora espelha as 4 oportunidades ativas.
- `sw.js`: precache inclui `supabase-config.js`, `supabase-auth.js` e `jobs.json`; cache `v9-cleanup`.
- `supabase-auth.js`: removida função órfã `listMyActivity` e sua referência no export (histórico de atividade foi tirado do perfil).
- Removidos do git 7 arquivos `*-source.png` (~10MB); `.gitignore` ganhou `*-source.png`.
- `index.html`: OG/Twitter tags de compartilhamento adicionadas.
- Docs atualizados: `README.md`, `HANDOFF-PROXIMA-SESSAO.md` (este), `GENESIO-TELEGRAM.md`, `ROADMAP-PUXAROTA.md`, `CHECKLIST.md`, `SUPABASE-DEPLOY.md`, `SUPABASE-ROUTES-DEPLOY.md`.

## Mudanças locais pendentes de commit (PuxaRota)

Já editadas nesta sessão, sem commit ainda:
- `app.js`, `sw.js`, `supabase-auth.js`, `index.html`, `styles.css` (remoção do histórico do perfil), `.gitignore`, `README.md`, docs acima.

## Repositório privado monitor-noticias (mudanças sem commit)

- `api/app-data.js`: busca `jobs.json` ao vivo (raw.githubusercontent) com fallback para briefing.
- `sync_puxarota.py`: detecta empresas novas e notifica via Telegram (testado).
- `.github/workflows/monitor.yml`: roda `sync_puxarota.py` a cada hora.
- `daily-briefing.json` e `puxarota-jobs.json`: regenerados com as 4 oportunidades.
- `tests/test_sync_puxarota.py` (novo) + `tests/test_app_content.mjs` (mock de URL puxarota).
- Atenção: `test_app_content.mjs` tem falha pré-existente no assert de alquimistas (depende da data/virada UTC); não é regressão nossa.

## Pendências

1. ✅ Contas órfãs: não existem mais (auth com 6 usuários reais; sem órfãos em `puxarota_accounts`/`puxarota_profiles`).
2. ✅ Secret `SUPABASE_SERVICE_ROLE_KEY` configurado no monitor-noticias (15/08, `gh secret set`); mapa de credenciais atualizado.
3. ✅ Worker duplicado removido: `puxarota_notify.py` deletado (monitor-noticias `6dae124`); `puxarota-telegram.yml` (cron */5, com recovery) é o único que processa a fila.
4. ⏳ Falha flaky `test_app_content.mjs` (assert alquimistas, virada de dia UTC) — pré-existente.
5. ⏳ Deploy da limpeza + novas rotas já publicado (b2bf85e) com smoke test OK.
6. ⏳ Raça Transportes: incluir depois que o certificado TLS for reconhecido.

## Sequência recomendada

1. Rodar `python -m unittest discover -s tests -v` e `python scripts/validate-encoding.py .` no PuxaRota.
2. Na próxima sessão: retomar a exploração de melhorias na aba Rotas (mapa visual, streak, XP, missão do dia).
