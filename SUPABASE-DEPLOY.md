# Supabase antes do deploy

1. Abra o SQL Editor do projeto Supabase
2. Cole e execute `supabase/puxarota_schema.sql`
3. Em Authentication > Providers, mantenha Email habilitado
4. Cadastre a conta administrativa e ajuste `puxarota_accounts.account_type` para `admin` e `is_approved` para `true`
5. Copie a URL do projeto e a chave pública `anon` para `supabase-config.js`
6. Teste: criar conta, confirmar e-mail, entrar, salvar perfil e sair

Nunca use `service_role` no navegador. A política de RLS mantém perfis pendentes privados e só publica perfis aprovados pelo administrador.
