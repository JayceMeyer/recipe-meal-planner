import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

interface CreditPack {
  id: string
  credits: number
  label: string
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_500', credits: 500, label: '500 credits' },
  { id: 'pack_1000', credits: 1000, label: '1,000 credits' },
  { id: 'pack_2500', credits: 2500, label: '2,500 credits' },
]

interface CheckoutRequest {
  householdId: string
  packId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'Stripe not configured' }, 500)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

    let body: CheckoutRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid request body' }, 400)
    }

    const { householdId, packId } = body

    if (!householdId) {
      return jsonResponse({ error: 'Missing householdId' }, 400)
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId)
    if (!pack) {
      return jsonResponse({ error: 'Invalid pack' }, 400)
    }

    // Read markup from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('ai_markup_percent')
      .eq('id', 1)
      .single()

    const markupPercent = (settings as { ai_markup_percent: number } | null)?.ai_markup_percent ?? 18

    // Price: credits * $0.01 * (1 + markup/100), in cents for Stripe
    const priceInCents = Math.round(pack.credits * (1 + markupPercent / 100))

    // Get or create Stripe customer for this household
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('household_id', householdId)
      .single()

    let stripeCustomerId: string

    if (existingCustomer) {
      stripeCustomerId = (existingCustomer as { stripe_customer_id: string }).stripe_customer_id
    } else {
      // Get household name for Stripe customer
      const { data: household } = await supabase
        .from('households')
        .select('name')
        .eq('id', householdId)
        .single()

      const customer = await stripe.customers.create({
        name: (household as { name: string } | null)?.name || 'Household',
        metadata: { household_id: householdId },
      })

      stripeCustomerId = customer.id

      await supabase
        .from('stripe_customers')
        .insert({ household_id: householdId, stripe_customer_id: stripeCustomerId })
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://recipe-meal-planner.app'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceInCents,
            product_data: {
              name: pack.label,
              description: `${pack.credits} AI credits for Recipe Meal Planner`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        household_id: householdId,
        credits: String(pack.credits),
        pack_id: pack.id,
      },
      success_url: `${appUrl}/settings?purchase=success`,
      cancel_url: `${appUrl}/settings?purchase=cancel`,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500)
  }
})
