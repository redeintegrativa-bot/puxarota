# Handoff — próxima sessão do PuxaRota

Data: 2026-08-18

## Estado estável preservado

- Produção: https://puxarota.vercel.app
- GitHub: https://github.com/redeintegrativa-bot/puxarota (branch main)
- Supabase: `zuxdmavskeylivdznenv` (CLI linked)
- Catálogo ativo (jobs.json, 4 oportunidades): Transportes Bertolini, Expresso GM, Único Group, Atua Transportes.
- Aba Rotas em produção: 7 rotas (5 motorista + 2 empresa), selos, sons cozy, mascotes, progresso local + Supabase.
- Suíte de testes: 81 testes (test_collector, test_frontend, test_routes).

## Trabalho entregue e commitado em 18/08 (4 commits, NÃO push)

1. `933a9a5` feat: rotas imersivas com cenas dinâmicas, shots, moods e próxima missão
   - `SCENES`/`SCENE_LOOKS`/`SCENE_DECOS`/`SCENE_MASCOTS`: cena por lição (11 ambientes: dia-azul, manhã, amanhecer, meio-dia, poente, entardecer, noite, tempestade, chuva, neblina, tarde-dourada).
   - `SCENE_SHOTS` (wide/close/side/high/travel) variam o enquadramento por lição.
   - `moodFor()`/`mascotPose()`: mood (alert/happy/eager/think/far) e pose por tipo de lição.
   - Cartão "Próxima Missão" (`nextMissionCard()`) + navegação de lições refeita (removido prev/next, agora contador + botão Concluir).
   - Seção de eventos `NEXT_EVENT` + "Próximo encontro" (assunto definido com Genésio), link Google Agenda gerado quando a data é definida, grupo do Facebook.
   - Títulos de rotas reformulados (ex.: "Não caia nos golpes da estrada").
2. `1171dbe` feat: campanhas admin, presença, push e vitrine com filtros
   - `sendAdminMessage`/`listMyNotifications`/`markNotificationRead`: mensagens in-app com botão + link (campanhas).
   - `touchPresence`/`touchLogin`/`presenceChip`: presença online/ausente no painel admin.
   - `setupPushSubscription`/`sendPushCampaign` + handler `push`/`notificationclick` no `sw.js` (cache `v10`).
   - Edição completa de cadastro pelo admin (nome, WhatsApp com validação BR, região, CEP, veículo, CNH, carga, disponibilidade).
   - Vitrine: filtros por habilitação e carga, cards compactos com tags e avatar, nome só primeiro nome, resumo de jornada do profissional.
3. `e816fcd` feat: migrations de LGPD, notificações, push, presença, regiões e edge function send-campaign
   - `202608150001_lgpd_first_name_and_tags.sql`: vitrine pública só com primeiro nome + habilitação.
   - `202608180001_admin_messages_read_at.sql`: `read_at`/`button_label`/`button_url` + policy owner update.
   - `202608180002_push_subscriptions.sql`: tabela + policies (owner all, admin select).
   - `202608180003_presence.sql`: `last_login_at`/`last_seen_at` + policy owner update.
   - `202608180004_consolidate_regions.sql`: consolida regiões em canônicos (SP/RJ/MG/...). **APLICAR SÓ APÓS O DEPLOY**; rodar a prévia antes.
   - `supabase/functions/send-campaign/index.ts`: web-push (VAPID) via Supabase Edge Function; exige `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` no projeto.
4. `8a1d308` docs: personagens, eventos e roadmap + servidor de dev no-store
   - `ROADMAP.md` (novo, untracked até agora), `PERSONAGENS-E-IMAGENS.md` (fluxo Pollinations + poses), `ROADMAP-PUXAROTA.md` (seção eventos), `serve-dev.py` (servidor no-store porta 4100).

## Pendências CRÍTICAS antes de deployar

1. ⏳ **Aplicar migrations no Supabase** (`supabase migration up`): as 5 migrations novas (`20260815/18000x`) ainda NÃO foram aplicadas. O código novo (campanhas, presença, push) **quebra** sem elas. Exceção: `202608180004_consolidate_regions.sql` aplicar **depois** do deploy (ela é um backfill de dados).
2. ⏳ **Configurar VAPID no projeto Supabase** para o push funcionar (edge function `send-campaign` lê `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
3. ⏳ **Deploy do front** em Vercel (git push → CI/deploy). Migrations primeiro, front depois.
4. ⏳ `supabase-config.js` sem newline final (cosmético).
5. ⏳ Raça Transportes: incluir depois que o certificado TLS for reconhecido.

## Pendências não relacionadas

- Teste flaky `test_app_content.mjs` no monitor-noticias (assert alquimistas, virada de dia UTC) — pré-existente.

## Sequência recomendada (próxima sessão)

1. Aplicar migrations (`supabase link` já feito; `supabase migration up`), depois push + deploy do front (com aprovação do proprietário).
2. Rodar prévia de `consolidate_regions` e aplicar o backfill.
3. Retomar a exploração de melhorias na aba Rotas (mapa visual da estrada, streak, XP contínuo, missão do dia, meta semanal) — ver `ROADMAP-PUXAROTA.md` e `ROADMAP.md`.