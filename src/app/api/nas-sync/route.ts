import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-static';

function getConfigPath(): string | null {
  const appData = process.env.APPDATA;
  if (!appData) return null;
  for (const name of ['GartenMeister-Portable', 'GartenMeister']) {
    const p = path.join(appData, name, 'config.json');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readConfig(): Record<string, unknown> {
  const cfgPath = getConfigPath();
  if (!cfgPath) return {};
  try { return JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { return {}; }
}

export async function GET() {
  const cfg = readConfig();
  const syncConfig = (cfg?.nasSync as Record<string, unknown>) ?? {
    autoSync: false,
    syncInterval: 60,
    conflictResolution: 'local-wins',
    retryAttempts: 3,
    retryDelay: 5,
    enableCompression: false,
    enableEncryption: false,
    maxBackups: 10,
    backupRetentionDays: 30,
    paths: { dataPath: 'database', backupPath: 'backups', logsPath: 'logs', syncPath: 'sync' },
    features: { imageSync: true, weatherSync: false, automaticMigration: false, offlineMode: true, realTimeSync: false },
    monitoring: { enableLogging: true, logLevel: 'info', enableMetrics: false, enableAlerts: false },
  };
  return NextResponse.json({
    success: true,
    data: { config: syncConfig, stats: { lastSync: null, pendingChanges: 0, totalSynced: 0 } },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body?.action === 'update-config' && body?.config) {
    const cfgPath = getConfigPath();
    if (cfgPath) {
      try {
        const current = readConfig();
        const updated = { ...current, nasSync: body.config };
        fs.writeFileSync(cfgPath, JSON.stringify(updated, null, 2));
      } catch { /* ignore */ }
    }
  }
  return NextResponse.json({ success: true });
}
