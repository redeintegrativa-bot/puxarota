# Assinatura do PuxaRota

Esta estrutura fica inativa no estudo local ate que as variaveis sejam configuradas na Vercel. Nenhuma chave secreta deve ser adicionada a arquivos do navegador.

## Variaveis do servidor

- `APP_URL`: endereco oficial do app, sem barra final
- `STRIPE_SECRET_KEY`: chave secreta da Stripe
- `STRIPE_PRICE_ID`: identificador do preco mensal criado na Stripe
- `STRIPE_WEBHOOK_SECRET`: segredo do webhook
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: chave publica usada apenas para validar a sessao recebida
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada usada somente pelas funcoes em `/api`

## Endpoints

- `POST /api/create-checkout`: cria checkout para o usuario autenticado
- `POST /api/customer-portal`: abre o portal de gestao da assinatura
- `POST /api/stripe-webhook`: sincroniza Stripe e Supabase

O navegador deve enviar `Authorization: Bearer <access_token>` nos dois primeiros endpoints.

## Eventos do webhook

Cadastre na Stripe:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

O campo canonico do app continua sendo `license_status`. `subscription_status` e mantido como espelho temporario para compatibilidade com as telas existentes.

## Antes de publicar

1. Definir preco e beneficios finais do plano
2. Criar o produto e o preco na Stripe
3. Configurar as variaveis somente nos ambientes desejados
4. Testar o checkout e o webhook no modo de teste da Stripe
5. Confirmar os acessos `free`, `trial`, `active`, `past_due` e `cancelled`
