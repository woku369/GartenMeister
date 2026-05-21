'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Crown, 
  Settings, 
  LogOut, 
  ChevronDown,
  Users
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: string;
  preferences: {
    defaultCategory: string;
    autoTagging: boolean;
    notifications: boolean;
  };
}

interface UserSwitcherProps {
  showUserManagement?: boolean;
  onUserManagementClick?: () => void;
}

export default function UserSwitcher({ showUserManagement = true, onUserManagementClick }: UserSwitcherProps) {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Avatar-Initialen generieren
  const generateAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Avatar-Farbe generieren
  const generateAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[name.length % colors.length];
  };

  // Benutzer laden
  const loadUser = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        const [current, all] = await Promise.all([
          window.electronAPI.users.getCurrent(),
          window.electronAPI.users.getAll()
        ]);
        
        setCurrentUser(current);
        setAllUsers(all || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Benutzer wechseln
  const handleSwitchUser = async (userId: string) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        await window.electronAPI.users.setCurrent(userId);
        loadUser(); // Neulade der Daten
        
        // Optional: App-weiten Refresh triggern
        window.location.reload();
      }
    } catch (error) {
      console.error('Fehler beim Wechseln des Benutzers:', error);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <User className="h-5 w-5" />
        <span className="text-sm">Kein Benutzer</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback 
              style={{ backgroundColor: generateAvatarColor(currentUser.name) }}
              className="text-white font-semibold text-sm"
            >
              {generateAvatarInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-1">
            <div className="text-left">
              <p className="text-sm font-medium leading-none">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentUser.role === 'admin' ? 'Administrator' : 'Benutzer'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* Aktueller Benutzer Header */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback 
                style={{ backgroundColor: generateAvatarColor(currentUser.name) }}
                className="text-white font-semibold text-xs"
              >
                {generateAvatarInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{currentUser.name}</p>
              {currentUser.email && (
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              )}
            </div>
            <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {currentUser.role === 'admin' ? (
                <><Crown className="h-2 w-2 mr-1" /> Admin</>
              ) : (
                <><User className="h-2 w-2 mr-1" /> User</>
              )}
            </Badge>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Andere Benutzer */}
        {allUsers.filter(user => user.id !== currentUser.id).length > 0 && (
          <>
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-muted-foreground">Wechseln zu:</p>
            </div>
            
            {allUsers
              .filter(user => user.id !== currentUser.id)
              .map((user) => (
                <DropdownMenuItem 
                  key={user.id}
                  onClick={() => handleSwitchUser(user.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback 
                        style={{ backgroundColor: generateAvatarColor(user.name) }}
                        className="text-white font-semibold text-xs"
                      >
                        {generateAvatarInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    {user.role === 'admin' && (
                      <Crown className="h-3 w-3 text-yellow-600" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Management-Optionen */}
        {showUserManagement && (
          <DropdownMenuItem onClick={onUserManagementClick} className="cursor-pointer">
            <Users className="h-4 w-4 mr-2" />
            <span>Benutzer verwalten</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          <span>Einstellungen</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
