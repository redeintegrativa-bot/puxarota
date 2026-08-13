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


## Fase 6 — limites, monetização e pagamentos (futuro)

- Manter consulta de oportunidades e primeiro contato gratuitos.
- Aplicar limites simples contra spam: frequência por dispositivo, validação de telefone e revisão de mensagens repetidas.
- Não bloquear links de empresas oficiais: eles continuam apontando para a fonte original.
- Para oportunidades cadastradas por nós, registrar o interesse em uma fila interna antes de encaminhar.
- Oferecer depois planos opcionais para transportadoras: publicação, destaque, validade e organização dos contatos.
- Usar Stripe Checkout ou Payment Links no início; confirmar pagamentos por webhook no servidor, nunca apenas pelo navegador.
- Só liberar publicação/destaque após status de pagamento confirmado.
- Guardar recibo, plano, valor, moeda, data e identificador da Stripe; não armazenar cartão.
- Antes de cobrar, validar taxas, impostos, reembolsos e regras aplicáveis ao Brasil.

### Modelo inicial sugerido

- Motorista/ajudante: catálogo e primeiro interesse gratuitos.
- Transportadora: cadastro e avaliação inicial gratuitos; cobrança somente para publicar ou destacar uma oportunidade.
- Rede Integrativa: moderação e mediação continuam sob controle administrativo.

A cobrança não deve ser ativada enquanto o fluxo de contatos e a aprovação dos perfis não estiverem funcionando de forma confiável.
