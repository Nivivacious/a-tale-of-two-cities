// "Want the real deck?" sign-ups. One email per person, stored in Redis.
// GET                                    {ok:true} when the list can take sign-ups
// GET  (header x-admin-key = ADMIN_KEY)   every email, oldest first
// POST {email}
const { redis, overLimit, clean } = require('./_redis');
const LIST = 'tale:waitlist';
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (req.headers['x-admin-key']) {
        if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
        const [flat] = await redis(['HGETALL', LIST]);
        const rows = [];
        for (let i = 0; i < (flat || []).length; i += 2) rows.push({ email: flat[i], at: flat[i + 1] });
        return res.status(200).json({ count: rows.length, emails: rows.sort((a, b) => String(a.at).localeCompare(String(b.at))) });
      }
      await redis(['PING']);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const email = clean((req.body || {}).email, 254).toLowerCase();
    if (!validEmail(email)) return res.status(400).json({ error: 'email' });
    if (await overLimit(req, 'waitlist', 5, 3600)) return res.status(429).json({ error: 'slow down' });
    await redis(['HSETNX', LIST, email, new Date().toISOString()]);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(503).json({ error: 'unavailable' });
  }
};
