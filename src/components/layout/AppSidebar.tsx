'use client';

import { usePathname } from 'next/navigation';
import { Home, Leaf, ListChecks, BarChart3, PlusCircle, Settings, LayoutDashboard, Repeat, CloudRain, Camera, Users, HardDrive, BookOpen } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { eskapadeFrakturFont } from '@/app/fonts';
import UserSwitcher from '@/components/users/UserSwitcher';

export default function AppSidebar() {
  const pathname = usePathname();

  // PORTABLE EXE: Navigation mit IPC statt window.location
  const handleNavigation = async (href: string) => {
    console.log(`[AppSidebar] Navigation zu: ${href}`);
    
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log(`[AppSidebar] Verwende IPC Navigation`);
        const result = await (window as any).electronAPI.navigateTo(href);
        console.log(`[AppSidebar] IPC Navigation Ergebnis:`, result);
      } else {
        console.log(`[AppSidebar] ElectronAPI nicht verfügbar, verwende window.location`);
        window.location.href = href;
      }
    } catch (error) {
      console.error(`[AppSidebar] Navigation Fehler:`, error);
      // Fallback zu window.location
      window.location.href = href;
    }
  };

  const menuItems = [
    { href: '/', label: 'Übersicht', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/herbs', label: 'Kräutersorten', icon: Leaf },
    { href: '/gallery', label: 'Bildersammlung', icon: Camera },
    { href: '/reports', label: 'Ernteberichte', icon: BarChart3 },
    { href: '/weather', label: 'Gartenwerkzeuge', icon: CloudRain },
    { href: '/routines', label: 'Routinen', icon: Repeat },
    { href: '/users', label: 'Benutzer', icon: Users },
    { href: '/backup', label: 'Datensicherung', icon: HardDrive },
    { href: '/handbuch', label: 'Handbuch', icon: BookOpen },
    { href: '/settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {/* Logo/Header auch mit Browser-Navigation */}
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center p-0 bg-transparent border-none cursor-pointer w-full text-left"
        >
          <Leaf className="w-8 h-8 text-primary group-data-[collapsible=icon]:mx-auto" />
          <h1 className="text-2xl tracking-tight group-data-[collapsible=icon]:hidden leading-tight">
            <span className={eskapadeFrakturFont.className}>Garten<span className="text-primary">Meister</span></span>
          </h1>
        </button>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              {/* PORTABLE EXE: Direkte Button-Implementation ohne asChild */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.href);
                }}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 w-full text-left transition-all hover:bg-accent
                  ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </button>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-2 space-y-2">
        {/* User Switcher */}
        <div className="group-data-[collapsible=icon]:hidden">
          <UserSwitcher 
            onUserManagementClick={() => handleNavigation('/users')} 
          />
        </div>
        
        {/* Neues Beet Button auch mit Browser-Navigation */}
        <Button 
          onClick={() => handleNavigation('/beds/new')}
          className="w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square"
        >
          <PlusCircle className="group-data-[collapsible=icon]:m-0" />
          <span className="group-data-[collapsible=icon]:hidden">Neues Beet</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
