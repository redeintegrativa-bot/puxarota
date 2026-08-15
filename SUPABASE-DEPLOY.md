# Supabase antes do deploy

1. Para uma instalação nova, abra o SQL Editor do projeto Supabase, cole e execute `supabase/puxarota_schema.sql`.
2. Para a instalação já existente, aplique também, uma única vez e nesta ordem, as migrações em `supabase/migrations/`:
   `20260814_account_contact_snapshots.sql`, `202608140002_admin_review_history.sql`, `202608140003_opportunities_and_interests.sql`, `202608140004_route_progress_and_public_badges.sql`, `202608140005_user_history_hires_reviews.sql`, `202608140006_engagement_reviews.sql`.
   Use o CLI: `supabase link --project-ref zuxdmavskeylivdznenv` e `supabase db push` (dry-run confirma "remote database is up to date").
3. Em Authentication > Providers, mantenha Email habilitado e `Confirm email` desativado. A conta deve entrar imediatamente após o cadastro, sem etapa de confirmação.
4. Cadastre a conta administrativa e ajuste `puxarota_accounts.account_type` para `admin` e `is_approved` para `true`.
5. Copie a URL do projeto e a chave pública `anon` para `supabase-config.js`.
6. Teste: criar conta, completar e salvar o perfil, recarregar e sair. O cadastro não deve pedir confirmação de e-mail nem um novo login.
7. Depois da última migração, abra Gestão: oportunidades novas devem ficar como pendentes; aprove uma fonte para exibi-la no catálogo. Um interesse autenticado cria uma notificação `telegram_admin` para o Genésio (workflow `puxarota-telegram.yml`, cron */5).

Nunca use `service_role` no navegador. A política de RLS mantém perfis pendentes privados e só publica perfis aprovados pelo administrador.

> Estado em 15/08/2026: projeto já vinculado e migrações aplicadas em produção (dry-run OK). Fluxo de notificação Telegram validado ponta a ponta.
