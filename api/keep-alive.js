import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function timingSafeEquals(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Lightweight keep-alive for UptimeRobot (or similar) so the Supabase project
 * sees periodic database activity. Uses the same anon key + `profiles` query
 * as the web app.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ ok: false });
  }

  const expected = process.env.UPTIME_KEEPALIVE_SECRET;
  if (expected) {
    const q = req.query?.secret;
    const provided = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
    if (!provided || !timingSafeEquals(provided, expected)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(503).json({ ok: false, error: 'configuration' });
  }

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return res.status(502).json({ ok: false, error: 'upstream' });
    }
  } catch {
    return res.status(502).json({ ok: false, error: 'upstream' });
  }

  if (req.method === 'HEAD') {
    return res.status(204).end();
  }

  return res.status(200).json({ ok: true });
}
