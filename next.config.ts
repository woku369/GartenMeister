import type {NextConfig} from 'next';

// Im Dev-Modus kein Static Export – Middleware wäre sonst inkompatibel.
// Beim echten Build (npm run build) wird output: 'export' für Electron gesetzt.
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* config options here */
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  distDir: 'out',
  assetPrefix: isDev ? '' : '.', // FÜR ELECTRON: Relative Pfade zu Assets
  basePath: '', // Ensure no base path conflicts
  
  // PORTABLE EXE OPTIMIERUNGEN
  experimental: {
    // Nur notwendige experimental features für portable EXE
    // serverActions und appDir sind in Next.js 15+ standardmäßig aktiviert
    // esmExternals entfernt da es Module-Resolution stören kann
  },
  
  // ELECTRON STATIC EXPORT: Prefetching komplett deaktivieren
  compiler: {
    removeConsole: false, // Console-Logs beibehalten für Debugging
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  webpack: (config, { isServer }) => {
    // Exclude problematic sharp Linux binaries from build
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
      };
    }
    return config;
  },
};

export default nextConfig;
