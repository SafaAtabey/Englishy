import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function requirePro(req: Request, res: Response, next: NextFunction) {
  const userId = req.body?.user_id || req.query?.user_id || req.headers['x-user-id']
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })

  const { data } = await supabase
    .from('users')
    .select('subscription_plan')
    .eq('id', userId)
    .single()

  if (!data || data.subscription_plan === 'free') {
    return res.status(403).json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' })
  }

  next()
}
