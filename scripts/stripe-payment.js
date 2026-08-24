const stripe = require('stripe'*)(process.env.STRIPE_SECRET_KEY);

// Create a checkout session for premium subscription
exports.createCheckoutSession = async (userId) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'PuxaRota Premium',
          description: 'Acesso a filtros avanados de notificao e badge de motorista ativo',
        },
        unit_amount: 400, // R$ 4,00 in cents
        recurring: {
          interval: 'month',
        },
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: ``${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}``,
    cancel_url: ``${window.location.origin}/?canceled=1``,
    metadata: {
      userId: userId,
    },
  });
  return session.url;
};

// Create a checkout session for a onetime donation (flexible amount)
exports.createDonationCheckoutSession = async (userId, amountCents) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'Doação ao PuxaRota',
          description: 'Contribuio voluntria para apoiar o projeto',
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: ``${window.location.origin}/?donation_session_id={CHECKOUT_SESSION_ID}``,
    cancel_url: ``${window.location.origin}/?donation_canceled=1``,
    metadata: {
      userId: userId,
    },
  });
  return session.url;
};

// Webhook handler (to be called from a serverless function)
exports.handleWebhook = async (payload, sig) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(``Webhook signature verification failed: ${err.message}``);
  }
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Determine if it's a subscription or a onetime donation
      if (session.mode === 'subscription') {
        // Update subscription status in Supabase
        const { data: user } = await supabase
          .from('puxarota_accounts')
          .select('id')
          .eq('stripe_customer_id', session.customer)
          .single();
        if (user) {
          await supabase
            .from('puxarota_accounts')
            .update({ subscription_status: 'active' })
            .eq('id', user.id);
        }
      } else if (session.mode === 'payment') {
        // Onetime donation: add to total_donated_cents
        const amount = session.amount_total; // already in cents
        const { data: user } = await supabase
          .from('puxarota_accounts')
          .select('id')
          .eq('stripe_customer_id', session.customer)
          .single();
        if (user) {
          await supabase
            .from('puxarota_accounts')
            .update({ total_donated_cents: supabase.raw('total_donated_cents + ${amount}') })
            .eq('id', user.id);
        }
      }
      break;
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      const sub = event.data.object;
      const { data: user2 } = await supabase
        .from('puxarota_accounts')
        .select('id')
        .eq('stripe_customer_id', sub.customer)
        .single();
      if (user2) {
        await supabase
          .from('puxarota_accounts')
          .update({ subscription_status: 'free' })
          .eq('id', user2.id);
      }
      break;
    default:
      console.log(``Unhandled event type ${event.type}``);
  }
};

