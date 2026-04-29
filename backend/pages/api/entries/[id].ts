import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req, res)) return;
  const db = getDb();
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const row = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(row);
  }

  if (req.method === 'PUT') {
    const e = req.body;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO time_entries (id,date,start_time,end_time,break_minutes,work_type,day_type,note,distance_km,start_lat,start_lng,end_lat,end_lng,is_synced,created_at,updated_at)
      VALUES (@id,@date,@start_time,@end_time,@break_minutes,@work_type,@day_type,@note,@distance_km,@start_lat,@start_lng,@end_lat,@end_lng,1,@created_at,@updated_at)
      ON CONFLICT(id) DO UPDATE SET
        date=excluded.date, start_time=excluded.start_time, end_time=excluded.end_time,
        break_minutes=excluded.break_minutes, work_type=excluded.work_type, day_type=excluded.day_type,
        note=excluded.note, distance_km=excluded.distance_km, start_lat=excluded.start_lat,
        start_lng=excluded.start_lng, end_lat=excluded.end_lat, end_lng=excluded.end_lng,
        updated_at=excluded.updated_at
    `).run({ ...e, updated_at: now });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
