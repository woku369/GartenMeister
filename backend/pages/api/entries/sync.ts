import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

interface Entry {
  id: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  break_minutes: number;
  work_type: string;
  day_type: string;
  note: string;
  distance_km?: number | null;
  start_lat?: number | null;
  start_lng?: number | null;
  end_lat?: number | null;
  end_lng?: number | null;
  created_at: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { entries } = req.body as { entries: Entry[] };
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries array required' });
  }

  const db = getDb();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO time_entries
      (id,date,start_time,end_time,break_minutes,work_type,day_type,note,distance_km,start_lat,start_lng,end_lat,end_lng,is_synced,created_at,updated_at)
    VALUES
      (@id,@date,@start_time,@end_time,@break_minutes,@work_type,@day_type,@note,@distance_km,@start_lat,@start_lng,@end_lat,@end_lng,1,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      date=excluded.date, start_time=excluded.start_time, end_time=excluded.end_time,
      break_minutes=excluded.break_minutes, work_type=excluded.work_type, day_type=excluded.day_type,
      note=excluded.note, distance_km=excluded.distance_km, start_lat=excluded.start_lat,
      start_lng=excluded.start_lng, end_lat=excluded.end_lat, end_lng=excluded.end_lng,
      updated_at=excluded.updated_at
  `);

  const insertMany = db.transaction((items: Entry[]) => {
    for (const e of items) {
      upsert.run({
        id: e.id,
        date: e.date,
        start_time: e.start_time,
        end_time: e.end_time ?? null,
        break_minutes: e.break_minutes ?? 0,
        work_type: e.work_type ?? 'homeoffice',
        day_type: e.day_type ?? 'workday',
        note: e.note ?? '',
        distance_km: e.distance_km ?? null,
        start_lat: e.start_lat ?? null,
        start_lng: e.start_lng ?? null,
        end_lat: e.end_lat ?? null,
        end_lng: e.end_lng ?? null,
        created_at: e.created_at,
        updated_at: now,
      });
    }
  });

  insertMany(entries);
  res.status(200).json({ ok: true, count: entries.length });
}
