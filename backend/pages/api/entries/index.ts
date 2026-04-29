import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req, res)) return;
  const db = getDb();

  if (req.method === 'GET') {
    const { since, year, month } = req.query;
    let rows;
    if (year && month) {
      const y = String(year).padStart(4, '0');
      const m = String(month).padStart(2, '0');
      const nextMonth = Number(month) === 12
        ? `${Number(year) + 1}-01`
        : `${y}-${String(Number(month) + 1).padStart(2, '0')}`;
      rows = db.prepare(
        'SELECT * FROM time_entries WHERE date >= ? AND date < ? ORDER BY start_time ASC'
      ).all(`${y}-${m}-01`, `${nextMonth}-01`);
    } else if (since) {
      rows = db.prepare(
        'SELECT * FROM time_entries WHERE updated_at >= ? ORDER BY start_time ASC'
      ).all(String(since));
    } else {
      rows = db.prepare('SELECT * FROM time_entries ORDER BY start_time ASC').all();
    }
    return res.status(200).json({ entries: rows });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
