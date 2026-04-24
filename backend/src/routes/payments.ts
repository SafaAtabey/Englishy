import { Router, Request, Response } from 'express'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY!
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!
const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

const VARIANT_IDS: Record<string, string> = {
  pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID!,
  annual: process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID!,
}

// POST /api/payments/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  const { plan, user_id } = req.body
  if (!plan || !user_id) return res.status(400).json({ error: 'plan and user_id required' })

  const variantId = VARIANT_IDS[plan]
  if (!variantId) return res.status(400).json({ error: 'Invalid plan' })

  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    // Get product_id from variant, then fetch the product's buy_now_url
    const variantRes = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
      headers: { Authorization: `Bearer ${LS_API_KEY}`, Accept: 'application/vnd.api+json' },
    })
    const variantJson = await variantRes.json() as { data?: { attributes?: { product_id?: number } } }
    const productId = variantJson?.data?.attributes?.product_id

    if (!productId) {
      console.error('[LS variant fetch]', JSON.stringify(variantJson))
      return res.status(500).json({ error: 'Could not fetch variant checkout URL' })
    }

    const productRes = await fetch(`https://api.lemonsqueezy.com/v1/products/${productId}`, {
      headers: { Authorization: `Bearer ${LS_API_KEY}`, Accept: 'application/vnd.api+json' },
    })
    const productJson = await productRes.json() as { data?: { attributes?: { buy_now_url?: string } } }
    const buyUrl = productJson?.data?.attributes?.buy_now_url

    if (!buyUrl) {
      console.error('[LS product fetch]', JSON.stringify(productJson))
      return res.status(500).json({ error: 'Could not fetch variant checkout URL' })
    }

    // Append pre-fill params so the customer's email and user_id are passed through
    const params = new URLSearchParams({
      'checkout[email]': user?.email ?? '',
      'checkout[custom][user_id]': user_id,
      'checkout[custom][plan]': plan,
    })

    res.json({ url: `${buyUrl}?${params.toString()}` })
  } catch (err) {
    console.error('[LS checkout error]', err)
    res.status(500).json({ error: 'Checkout failed' })
  }
})

// POST /api/payments/portal  — redirect to Lemon Squeezy customer portal
router.post('/portal', async (req: Request, res: Response) => {
  const { customer_id } = req.body
  if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

  // Lemon Squeezy doesn't have a server-side portal session API like Stripe.
  // Instead return the generic customer portal URL from their dashboard.
  // The customer_id here stores the LS customer portal URL directly.
  res.json({ url: customer_id })
})

// POST /api/payments/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  const secret = LS_WEBHOOK_SECRET
  const signature = req.headers['x-signature'] as string

  if (!signature || !secret) return res.status(400).send('Missing signature')

  try {
    const hmac = createHmac('sha256', secret)
    hmac.update(req.body)
    const digest = Buffer.from(hmac.digest('hex'))
    const sig = Buffer.from(signature)

    if (digest.length !== sig.length || !timingSafeEqual(digest, sig)) {
      return res.status(401).send('Invalid signature')
    }
  } catch {
    return res.status(400).send('Signature verification failed')
  }

  const payload = JSON.parse(req.body.toString())
  const eventName: string = payload?.meta?.event_name ?? ''
  const userId: string = payload?.meta?.custom_data?.user_id ?? ''
  const orderStatus: string = payload?.data?.attributes?.status ?? ''

  if (!userId) return res.json({ received: true })

  if (eventName === 'order_created' && orderStatus === 'paid') {
    const plan = payload?.meta?.custom_data?.plan ?? 'pro'
    await supabase.from('users').update({ subscription_plan: plan }).eq('id', userId)
  }

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const status: string = payload?.data?.attributes?.status ?? ''
    const variantId = String(payload?.data?.attributes?.variant_id ?? '')
    const plan = status === 'active'
      ? (variantId === VARIANT_IDS.annual ? 'annual' : 'pro')
      : 'free'
    await supabase.from('users').update({ subscription_plan: plan }).eq('id', userId)
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await supabase.from('users').update({ subscription_plan: 'free' }).eq('id', userId)
  }

  res.json({ received: true })
})

export default router
