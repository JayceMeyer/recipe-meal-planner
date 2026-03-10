import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    return jsonResponse({ error: 'Stripe not configured' }, 500)
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return jsonResponse({ error: 'Missing stripe-signature header' }, 400)
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return jsonResponse({ error: `Webhook verification failed: ${(err as Error).message}` }, 400)
  }

  if (event.type !== 'checkout.session.completed') {
    return jsonResponse({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const householdId = session.metadata?.household_id
  const credits = parseInt(session.metadata?.credits || '0', 10)

  if (!householdId || credits <= 0) {
    return jsonResponse({ error: 'Invalid session metadata' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Idempotency: check if this session was already processed
  const { data: existing } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('metadata->>stripe_session_id', session.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return jsonResponse({ received: true, already_processed: true })
  }

  const { data: newBalance, error } = await supabase.rpc('add_credits', {
    p_household_id: householdId,
    p_amount: credits,
    p_description: `Purchased ${credits} credits`,
    p_metadata: {
      stripe_session_id: session.id,
      pack_id: session.metadata?.pack_id,
    },
  })

  if (error) {
    return jsonResponse({ error: `Failed to add credits: ${error.message}` }, 500)
  }

  return jsonResponse({ received: true, new_balance: newBalance })
})
