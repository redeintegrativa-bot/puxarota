# Integração PuxaRota → Genésio Telegram

O PuxaRota cria uma fila em `puxarota_notifications` quando um novo perfil é salvo (gatilho `queue_puxarota_profile_notification`).

O workflow GitHub Actions `puxarota-telegram.yml` (cron `*/5 * * * *`) lê as notificações pendentes e envia pelo bot do Telegram, marcando como `sent`. Validado em 14/08: cadastro → gatilho → fila `pending` → workflow → mensagem entregue no chat do Genésio.

- Token e chat_id ficam somente em Secrets do GitHub / env do ambiente, nunca no frontend ou Git.
- O worker é `scripts/notify_telegram.mjs`.
- Se a fila estiver vazia, o worker não envia nada (comportamento esperado).
