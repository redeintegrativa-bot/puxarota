# Handoff — próxima sessão do PuxaRota

Data: 2026-08-15

## Estado estável preservado

- Produção: https://puxarota.vercel.app
- GitHub: https://github.com/redeintegrativa-bot/puxarota (branch main)
- Supabase: `zuxdmavskeylivdznenv` (CLI linked; migrações aplicadas)
- Catálogo ativo (jobs.json, 4 oportunidades): Transportes Bertolini, Expresso GM, Único Group, Atua Transportes.
- Aba Rotas em produção: 5 rotas (3 motorista + 2 empresa), 6 graus, selos, sons cozy, mascotes, progresso local + Supabase.
- Suíte de testes: 68 testes (test_collector, test_frontend, test_routes).

## Pedido aberto do usuário

Explorar o que mais colocar na aba de Rotas (missões gamificadas). Já mapeado: hub + lições + celebração + perfil. Ideias propostas: novas rotas reais (Segurança Digital, Finanças da Estrada — já listadas em "no horizonte"), mapa visual da estrada, sequência/streak, XP contínuo, missão do dia, rotas ligadas ao catálogo, recompensa por grau, revisão/quiz, meta semanal, mais rotas para empresas.

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

1. Remover manualmente no painel Supabase as 2 contas de teste órfãs: `validacao-fluxo-20260814220405` e `validacao-fluxo-20260814220416`.
2. Monitor-noticias: secret `SUPABASE_SERVICE_ROLE_KEY` não configurado (necessário para `puxarota_notify.py`); `SUPABASE_URL` e `TELEGRAM_CHAT_ID` já corrigidos.
3. Falha flaky `test_app_content.mjs` (assert alquimistas, virada de dia UTC).
4. Deploy em produção ainda NÃO reflete a limpeza desta sessão (aguardando commit + `vercel --prod` sob governança de deploys).
5. Raça Transportes: incluir depois que o certificado TLS for reconhecido.

## Sequência recomendada

1. Rodar `python -m unittest discover -s tests -v` e `python scripts/validate-encoding.py .` no PuxaRota.
2. Commit da limpeza no PuxaRota (branch main) + push.
3. Commit no monitor-noticias (branch master).
4. Commit do contexto no repo privado `opencode-core` (MEMORY.md + `projects/puxarota/CONTEXTO.md`).
5. Deploy `vercel --prod` sob aprovação de governança quando o usuário autorizar.
6. Na próxima sessão: retomar a exploração de melhorias na aba Rotas.
