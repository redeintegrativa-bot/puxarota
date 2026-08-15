# Persistência das Rotas

O app já carrega e salva o percurso por user_id na tabela puxarota_route_progress.

Aplicar no projeto Supabase, depois das migrações existentes:

1. supabase/migrations/20260814_route_progress_and_public_badges.sql
2. supabase/migrations/20260814_user_history_hires_reviews.sql

Essas migrações criam progresso, etapas, eventos e selos por usuário; consulta pública segura dos selos autorizados; histórico de atividades; contratações vinculadas a empresa, profissional e vaga; e avaliações somente após contratação real.

Com o CLI:

supabase login
supabase link --project-ref zuxdmavskeylivdznenv
supabase db push

O projeto local confirmou que a tabela ainda não existe no Supabase remoto. A aplicação da migração exige uma sessão autenticada do CLI; nenhuma chave privada deve ser colocada no repositório ou no navegador.
