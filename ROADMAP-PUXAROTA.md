# Roadmap PuxaRota

## Fase 0 — protótipo local (agora)

- Tela Cargas preservada e sincronização de oportunidades oficiais.
- Aba Perfil para motorista, ajudante e transportadora.
- Aba Motoristas preparada, sem inventar perfis.
- Área interna local para testar cadastros.
- Interesse gera mensagem de WhatsApp para nós.
- CEP e múltiplas regiões no perfil.

## Fase 1 — base segura

- Conectar a área interna a uma Edge Function do Supabase.
- Criar autenticação administrativa; não confiar em PIN no front-end.
- Migrar cadastros do navegador para `driver_profiles`, `helper_profiles` e `company_profiles`.
- Registrar consentimento, origem, data e autorização de publicação.
- Manter todos os perfis privados até aprovação.

## Fase 2 — catálogo público

- Exibir somente perfis aprovados e `public_visible = true`.
- Filtrar por região, CEP, veículo, carga e disponibilidade.
- Empresas oficiais continuam apontando para seu site original.
- Empresas cadastradas por nós usam mediação de contato.

## Fase 3 — interesses e notificações

- Salvar cada interesse com oportunidade, perfil e dados do interessado.
- Notificar o Genésio no Telegram.
- Gerar link de WhatsApp para fallback manual.
- Avaliar API oficial do WhatsApp para notificações automáticas, com opt-in.

## Fase 4 — reputação

- Avaliação após interação registrada.
- Nota, critérios e comentário moderado.
- Denúncia, resposta e ocultação.
- Uma avaliação por interação; nada de avaliações anônimas públicas.

## Fase 5 — licenciamento e operação

- Área administrativa protegida.
- Perfis de acesso e trilha de auditoria.
- Licenciamento somente quando houver valor real para oferecer.
- Políticas de privacidade, retenção e exclusão de dados.

## Regras de segurança

- Não expor telefone publicamente.
- Não publicar perfil sem consentimento.
- Não enviar WhatsApp automático sem opt-in e API oficial.
- Não tratar pontuação como prova de confiabilidade.
- Moderar avaliações antes de torná-las públicas.
