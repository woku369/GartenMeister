'use client';

import Link from 'next/link';
import { ComponentProps, useEffect } from 'react';

/**
 * PORTABLE EXE LÖSUNG: Link-Komponente ohne Prefetching
 * 
 * Diese Komponente verhindert RSC Payload-Errors in Electron,
 * indem sie das Prefetching komplett deaktiviert.
 */
export function NoPreloadLink({ children, href, ...props }: ComponentProps<typeof Link>) {
  
  useEffect(() => {
    // Deaktiviere Router-Prefetching zur Laufzeit
    if (typeof window !== 'undefined') {
      // Unterbinde Intersection Observer für Prefetching
      const links = document.querySelectorAll(`a[href="${href}"]`);
      links.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });
    }
  }, [href]);

  return (
    <Link 
      href={href} 
      prefetch={false}
      {...props}
    >
      {children}
    </Link>
  );
}
