import type { NextApiRequest, NextApiResponse } from 'next';

export function checkAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true; // auth disabled if no key configured
  const provided = req.headers['x-api-key'];
  if (provided !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
