// Compatibilidade: a integracao segura agora vive nas funcoes serverless em /api.
// Nunca coloque STRIPE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY no navegador.
module.exports = {
  createCheckoutEndpoint: "/api/create-checkout",
  customerPortalEndpoint: "/api/customer-portal",
  webhookEndpoint: "/api/stripe-webhook"
};
