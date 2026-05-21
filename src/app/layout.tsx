// GLOBAL STATIC EXPORT ERZWINGEN FÜR ELECTRON
export const dynamic = 'force-static';
export const dynamicParams = false;

import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { eskapadeFrakturFont } from './fonts';
import { PrefetchKiller } from '@/components/ui/PrefetchKiller';

export const metadata: Metadata = {
  title: 'GartenMeister',
  description: 'Verwaltung für Kräuterbeete und Ernten'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${eskapadeFrakturFont.variable} `}>
        {/* PORTABLE EXE: Prefetching komplett deaktivieren */}
        <PrefetchKiller />
        
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background md:hidden">
              <SidebarTrigger />
              <span className="ml-2 font-semibold">GartenMeister</span>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}