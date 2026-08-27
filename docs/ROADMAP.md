# Roadmap — PuxaRota

Atualizado em: 2026-08-15
Fonte de verdade de estado do projeto, além de `CONTEXTO.md` (repo privado opencode-core).

## Regras

1. Uma prioridade por commit; não misturar funcionalidade com limpeza.
2. Rodar testes e validação antes de commitar:
   `python -m unittest discover -s tests -v` + `validate-encoding.py`.
3. Deploy só com aprovação explícita do proprietário (governança).
4. Manter este arquivo atualizado ao final de cada sessão/tarefa.

## Em andamento (sessão 15/08)

### 1. Personagens — Fiel no lugar do Faro [REVERTIDO]
- [x] Gerar 10 poses do Fiel (vira-lata caramelo) via Pollinations.ai (gratuito).
- [x] Recorte RGBA (flood-fill + blur) — `fiel-*.png` no repo.
- [x] `SCENE_MASCOTS` com Fiel (10 poses) + `mascotPose()` por tipo de lição.
- [ ] Landing atualizada (Fiel nas transportadoras, animação `fiel-guard`).
- [ ] `sw.js` v10-fiel (cache das 10 poses); `faro.png` removido.
- [x] Testes atualizados (76 OK).
- [ ] Revisar visual das poses no preview (`fiel-preview.jpg`) e ajustar se preciso
      (preview aberto em 15/08).
- [x] **REVERTIDO 15/08:** personagens voltaram ao padrão antigo (Rupi + Carcará +
      Faro); `fiel-*.png` removidos do repo, `faro.png` restaurado; cards das lições
      ganharam rótulos variados (AULINHA/DICA/SABIA?/NA PRÁTICA/PARA LEMBRAR),
      ícones alternados nos bullets e passo numerado no teach.

### 2. Cenas dinâmicas das lições [quase pronto]
- [x] `SCENES`/`SCENE_LOOKS` (sol, lua, estrelas, nuvens, pássaros, chuva, névoa,
      relâmpago) + `SCENE_DECOS` (ícone temático da lição).
- [x] `sceneMarkup()` unificado nos renders (lesson + teach) com temas/moods.
- [x] CSS dos elementos de cena + animações + reduced-motion.
- [ ] Rodar verificação visual no celular/navegador.

### 3. Validador de WhatsApp no cadastro [pronto]
- [x] Máscara de digitação (DDD 2 dígitos + `99999-9999`) em `app.js`.
- [x] Validação no submit (DDD válido, 8/9 dígitos, celular 9 começa com 9).
- [x] Normalização na origem (`saveProfile` em `supabase-auth.js`) — telefone salvo
      sempre como `+55 (DD) 99999-9999`.

### 4. Admin — corrigir dados das pessoas [pronto]
- [x] Edição completa pelo admin: nome, WhatsApp (validado e normalizado), região,
      CEP, veículo, habilitação, carga preferida, disponibilidade.
- [ ] Revisar cadastros existentes com telefone errado e corrigir pela tela.

### 5. Aba Profissionais — tags e filtros [pronto]
- [x] Cards com tags coloridas: veículo, habilitação, carga, região, disponibilidade.
- [x] Filtros: região, veículo, habilitação, tipo de carga.
- [x] Corrigir card "encavalado" (CSS: hierarquia grid + wrap correto).
- [x] Redesenhar card profissional: avatar com inicial, nome em destaque, tags
      rotuladas em grid (Veículo/Habilitação/Carga/Região/Disponibilidade).
- [x] Bug fix (real): rotas não abriam — `sceneLookFor()` usava `lessonIndex`
      sem declarar o parâmetro → `ReferenceError` em toda `renderLesson`.
      Assinatura corrigida para `(route, lesson, lessonIndex)`; validado por
      sandbox vm: as 7 rotas abrem e renderizam aulinha com o mascote certo.
- [x] Bug fix: `normalize()` quebrava com `state: null` vindo do
      Supabase/localStorage; agora trata `null`/formato inválido.
- [ ] Ver o novo card no navegador/servidor local e ajustar se preciso.

### 6. LGPD — mascarar nome completo [pronto]
- [x] Migração `202608150001`: RPC pública retorna só o primeiro nome + habilitação.
- [x] Fallback no frontend (`renderDrivers` também corta no primeiro nome).
- [x] Migração aplicada no Supabase remoto (15/08) — "Remote database is up to date".

## Backlog

- Mapa visual da estrada nas Rotas.
- Streak e missão do dia.
- Rotas ligadas ao catálogo de oportunidades.
- Mais poses para Rupi e Carcará (padrão atual: 5 e 2).
