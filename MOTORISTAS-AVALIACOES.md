# Motoristas, contatos e avaliações

O PuxaRota registra cada interesse em `puxarota_interests`, ligado ao perfil do motorista e à oportunidade.

A etapa da relação pode ser:

- `conversation`: a empresa pediu contato ou iniciou uma conversa
- `work_completed`: o trabalho foi concluído

As avaliações usam `puxarota_reviews` e distinguem conversa de trabalho concluído. O ranking administrativo pode usar quantidade de interesses, recência e média de avaliações, sem publicar telefone ou dados pessoais.

A avaliação deve ser liberada depois de uma interação real. Para trabalho concluído, somente após confirmação manual ou evidência mínima da conclusão.

## Consentimento de contato

O telefone nunca é exibido em consulta pública. O estado inicial é pending. Uma empresa pode demonstrar interesse, mas o contato só é compartilhado depois que o motorista autorizar explicitamente.
