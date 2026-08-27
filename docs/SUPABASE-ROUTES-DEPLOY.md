# Persistência das Rotas

O app carrega e salva o percurso por user_id na tabela `puxarota_route_progress` (estado local + sincronização via Supabase).

## Migrações

Aplicar no projeto Supabase, depois das migrações existentes:

1. `supabase/migrations/202608140004_route_progress_and_public_badges.sql`
2. `supabase/migrations/202608140005_user_history_hires_reviews.sql`
3. `supabase/migrations/202608140006_engagement_reviews.sql`

Essas migrações criam progresso, etapas, eventos e selos por usuário; consulta pública segura dos selos autorizados; histórico de atividades; contratações vinculadas a empresa, profissional e vaga; e avaliações somente após contratação real.

## CLI

```bash
supabase login
supabase link --project-ref zuxdmavskeylivdznenv
supabase db push
```

> Estado em 15/08/2026: aplicado em produção (dry-run confirma). A função `listMyActivity` no frontend foi removida na limpeza (o histórico não aparece mais no perfil); `recordActivity` continua em uso pelas Rotas e pelo salvamento de perfil.
