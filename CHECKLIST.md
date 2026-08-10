# Checklist operacional — Agrega

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

## Próxima fase

- [ ] Adicionar fontes aprovadas do grupo sem expor dados pessoais.
- [ ] Criar formulário de publicação e moderação.
- [ ] Implementar banco privado para perfis, candidaturas e contatos.
- [ ] Validar empresa/CNPJ e sinalizar anúncios suspeitos.
- [ ] Notificar encerramento e permitir denúncia.
- [ ] Medir conversão: visualização → interesse → contato.
- [ ] Definir política comercial de créditos e estornos.

## Regra de privacidade

GitHub e jobs.json armazenam somente dados públicos das oportunidades. GPS, telefone, perfil, candidatura e histórico pessoal não entram no repositório.
