# Supabase antes do deploy

1. Para uma instalação nova, abra o SQL Editor do projeto Supabase, cole e execute `supabase/puxarota_schema.sql`.
2. Para a instalação já existente, execute também, uma única vez e nesta ordem, as migrações em `supabase/migrations/`: `20260814_account_contact_snapshots.sql`, `20260814_admin_review_history.sql` e `20260814_opportunities_and_interests.sql`.
3. Em Authentication > Providers, mantenha Email habilitado e `Confirm email` desativado. A conta deve entrar imediatamente após o cadastro, sem etapa de confirmação.
4. Cadastre a conta administrativa e ajuste `puxarota_accounts.account_type` para `admin` e `is_approved` para `true`
5. Copie a URL do projeto e a chave pública `anon` para `supabase-config.js`
6. Teste: criar conta, completar e salvar o perfil, recarregar e sair. O cadastro não deve pedir confirmação de e-mail nem um novo login.
7. Depois da última migração, abra Gestão: oportunidades novas devem ficar como pendentes; aprove uma fonte para exibi-la no catálogo. Um interesse autenticado cria uma notificação `telegram_admin` para o Genésio.

Nunca use `service_role` no navegador. A política de RLS mantém perfis pendentes privados e só publica perfis aprovados pelo administrador.
