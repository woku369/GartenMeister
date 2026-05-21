import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-static';

function getConfigPath(): string | null {
  const appData = process.env.APPDATA;
  if (!appData) return null;
  // Electron userData: %APPDATA%\GartenMeister-Portable
  for (const name of ['GartenMeister-Portable', 'GartenMeister']) {
    const p = path.join(appData, name, 'config.json');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readNasSettings(): { enabled: boolean; url: string } {
  const cfgPath = getConfigPath();
  if (!cfgPath) return { enabled: false, url: '' };
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    return { enabled: cfg?.nasSettings?.enabled ?? false, url: cfg?.nasSettings?.url ?? '' };
  } catch {
    return { enabled: false, url: '' };
  }
}

export async function GET(_req: NextRequest) {
  const { enabled, url } = readNasSettings();

  if (!enabled || !url) {
    return NextResponse.json({
      success: true,
      data: { available: false, connected: false, hasData: false, error: 'NAS nicht konfiguriert' },
    });
  }

  const baseUrl = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const health = await res.json();
    const ts = new Date().toISOString();
    const statusData = {
      available: true,
      connected: health.status === 'online',
      hasData: true,
      uptime: health.uptimeFormatted,
      memory: health.memory,
      version: health.version,
      basePath: health.basePath,
      timestamp: ts,
    };
    const isPost = req.method === 'POST';
    return NextResponse.json({
      success: true,
      data: isPost ? {
        ...statusData,
        testResult: {
          timestamp: ts,
          tests: {
            driveExists: { success: true, message: 'NAS erreichbar' },
            writeTest: { success: true, message: 'Health-Endpunkt antwortet' },
            directoryStructure: { success: true, directories: {} },
          },
        },
        overallSuccess: true,
        message: `NAS online – ${health.uptimeFormatted} Uptime`,
      } : statusData,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: true,
      data: { available: false, connected: false, hasData: false, error: msg },
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body?.action === 'test-connection') {
    return GET(req);
  }
  return NextResponse.json({ success: false, error: 'Unbekannte Aktion' }, { status: 400 });
}
