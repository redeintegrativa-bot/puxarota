# PuxaRota

Painel e coletor de oportunidades públicas para motoristas, agregados e transportadoras, com Rotas gamificadas de aprendizado.

Produção: https://puxarota.vercel.app

## Executar

```bash
python collector.py
python -m unittest discover -s tests -v
python -m http.server 4173
```

Abra http://localhost:4173.

> Windows: use `python`, nunca `python3`.

## Arquivos

- `index.html`, `styles.css`, `app.js`: painel principal (5 telas: Cargas, Rotas, Salvas, Profissionais, Perfil).
- `routes.js`, `routes.css`, `vendor/retroix.js`: Rotas gamificadas (missões, selos, sons) e motor de áudio.
- `supabase-config.js`, `supabase-auth.js`: autenticação e dados no Supabase (perfis, oportunidades, progresso das Rotas).
- `landing.html`: página de divulgação com links para o catálogo e as Rotas.
- `collector.py`: coleta (com retry por fonte), normaliza, deduplica e expira anúncios.
- `job-sources.json`: fontes oficiais e feeds de descoberta.
- `jobs.json`: feed público consumido pelo painel (apenas oportunidades, nunca dados pessoais).
- `sw.js`: service worker (PWA, cache offline).
- `.github/workflows/collect-jobs.yml`: coleta a cada quatro horas.
- `.github/workflows/puxarota-telegram.yml`: processa a fila de notificações para o Telegram a cada cinco minutos.

## Regras de privacidade

GPS, telefone, perfil, candidatura e histórico pessoal não entram no repositório nem em `jobs.json`. O GitHub contém somente oportunidades públicas.

## Migrações e deploy

- Migrações SQL em `supabase/migrations/` (aplicadas em produção).
- RLS mantém perfis pendentes privados; só perfis aprovados pelo administrador ficam públicos.
- Deploy pelo Vercel CLI: `vercel --prod`.
- Confira `ROADMAP-PUXAROTA.md` e `CHECKLIST.md` para o estado do projeto.
