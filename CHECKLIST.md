# Checklist operacional — PuxaRota

## Concluído

- [x] Definir schema público de oportunidades.
- [x] Separar páginas oficiais de anúncios temporários.
- [x] Coletar com Python sem dependências externas.
- [x] Normalizar veículo, região, origem e confiança.
- [x] Remover duplicidades e parâmetros de rastreamento.
- [x] Expirar anúncios temporários.
- [x] Preservar feed durante falhas parciais.
- [x] Registrar erros por fonte.
- [x] Cobrir regras centrais com testes.
- [x] Gerar jobs.json.
- [x] Consumir feed no painel com fallback.
- [x] Consultar GPS somente por ação do usuário.
- [x] Corrigir sobreposição em telas pequenas.
- [x] Agendar coleta pelo GitHub Actions.
- [x] Adicionar fontes oficiais (SPX Express, Bertolini, Expresso GM, Único, FateLog).
- [x] Enriquecer Comercial Esperança (bases e requisitos).
- [x] Adicionar retry por fonte no coletor.
- [x] Separar painel em index.html, styles.css e app.js.
- [x] Implementar tela Salvas com localStorage.
- [x] Remover recursos simulados (Minha rota, Alertas, Meu veículo, conversa, envio de perfil).
- [x] Testar cada botão visível.
- [x] Validar layout em 320, 360, 390 e 412 px.

## Próxima fase

- [x] Adicionar fontes públicas à fila de revisão, sem expor dados pessoais.
- [x] Criar fila de moderação de oportunidades e vitrine de perfis consentidos.
- [x] Implementar banco privado para perfis e interesses autenticados.
- [ ] Aplicar as migrações no Supabase de produção e validar o aviso real no Telegram.
- [ ] Validar empresa/CNPJ e sinalizar anúncios suspeitos.
- [ ] Notificar encerramento e permitir denúncia.
- [ ] Medir conversão: visualização → interesse → contato.
- [ ] Definir política comercial de créditos e estornos.
- [ ] Incluir Raça Transportes após o certificado TLS passar a ser reconhecido.

## Regra de privacidade

GitHub e jobs.json armazenam somente dados públicos das oportunidades. GPS, telefone, perfil, candidatura e histórico pessoal não entram no repositório.
