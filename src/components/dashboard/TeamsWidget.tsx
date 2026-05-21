'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarClock, 
  Video, 
  Clock, 
  Users, 
  ExternalLink,
  RefreshCw 
} from 'lucide-react';
import * as microsoftTeams from '@microsoft/teams-js';
import { Person, Providers, Login } from '@microsoft/mgt-react';

interface MeetingData {
  id: string;
  subject: string;
  organizer: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  joinUrl?: string;
  status?: 'upcoming' | 'active' | 'completed';
}

export default function TeamsWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Versuche, Microsoft Teams SDK zu initialisieren (nur wenn in Teams geöffnet)
    try {
      // Prüfen, ob wir in einer Teams-Umgebung sind, bevor wir initialisieren
      if ((window as any).parent === window) {
        // Wir sind nicht in einem iframe - vermutlich nicht in Teams
        console.log('Nicht in Teams-Umgebung, SDK-Initialisierung übersprungen.');
      } else {
        // Möglicherweise in Teams - sicherheitshalber versuchen
        microsoftTeams.initialize();
      }
    } catch (error) {
      console.log('Microsoft Teams SDK kann nicht initialisiert werden. App wird nicht in Teams ausgeführt.');
    }

    // Vorhandene Microsoft Graph Authentifizierung prüfen
    checkAuthentication();
    
    // Meetings laden
    fetchMeetings();
  }, [date]);

  const checkAuthentication = () => {
    // In einer echten App würde hier die Prüfung mit Microsoft Graph erfolgen
    // Für Demo-Zwecke setzen wir es auf false
    setIsAuthenticated(false);
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      // Ohne API-Konfiguration zeigen wir keine Daten
      setMeetings([]);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Meetings:', error);
      setMeetings([]);
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    // In einer echten App würden wir die Microsoft Graph API für die Authentifizierung nutzen
    setTimeout(() => {
      setIsAuthenticated(true);
      fetchMeetings();
      setLoading(false);
    }, 1500);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setMeetings([]);
  };

  const joinMeeting = (meetingUrl: string) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  };

  const getMockMeetings = (): MeetingData[] => {
    const today = new Date();
    
    // Startdatum auf das ausgewählte Datum setzen, aber die aktuelle Uhrzeit beibehalten
    const baseDate = date ? new Date(date) : today;
    baseDate.setHours(today.getHours(), today.getMinutes());
    
    // Zeit für verschiedene Meetings berechnen
    const time1 = new Date(baseDate);
    time1.setHours(10, 0); // 10:00 Uhr
    
    const time2 = new Date(baseDate);
    time2.setHours(14, 30); // 14:30 Uhr
    
    const time3 = new Date(baseDate);
    time3.setHours(16, 0); // 16:00 Uhr
    
    // Für Demo: Wenn das Meeting in der Vergangenheit liegt, setzen wir es auf "completed"
    const now = new Date();
    
    return [
      {
        id: '1',
        subject: 'Gartenplanung Frühbeet',
        organizer: 'Max Mustermann',
        attendees: ['Anna Schmidt', 'Peter Meyer'],
        startTime: time1.toISOString(),
        endTime: new Date(time1.getTime() + 60 * 60 * 1000).toISOString(), // +1 Stunde
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-meeting-url-1',
        status: time1 < now ? 'completed' : time1.getTime() - now.getTime() < 15 * 60 * 1000 ? 'active' : 'upcoming'
      },
      {
        id: '2',
        subject: 'Bewässerungssystem Überprüfung',
        organizer: 'Peter Meyer',
        attendees: ['Max Mustermann', 'Lisa Müller', 'Thomas Klein'],
        startTime: time2.toISOString(),
        endTime: new Date(time2.getTime() + 45 * 60 * 1000).toISOString(), // +45 Minuten
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-meeting-url-2',
        status: time2 < now ? 'completed' : time2.getTime() - now.getTime() < 15 * 60 * 1000 ? 'active' : 'upcoming'
      },
      {
        id: '3',
        subject: 'Neue Pflanzen Lieferung',
        organizer: 'Anna Schmidt',
        attendees: ['Max Mustermann'],
        startTime: time3.toISOString(),
        endTime: new Date(time3.getTime() + 30 * 60 * 1000).toISOString(), // +30 Minuten
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-meeting-url-3',
        status: time3 < now ? 'completed' : time3.getTime() - now.getTime() < 15 * 60 * 1000 ? 'active' : 'upcoming'
      }
    ];
  };
  
  // Formatierung der Uhrzeit für die Anzeige
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="meetings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
        </TabsList>
        
        <TabsContent value="meetings" className="space-y-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Video className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Mit Microsoft Teams verbinden, um auf Ihre Meetings zuzugreifen</p>
              <Button 
                onClick={handleSignIn} 
                className="bg-[#4b53bc] hover:bg-[#3b3f8c]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Verbinde...
                  </>
                ) : (
                  <>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-2" 
                      viewBox="0 0 2228.833 2073.333"
                      fill="currentColor"
                    >
                      <path d="M1554.637,777.5h575.713c54.391,0,98.483,44.092,98.483,98.483c0,0,0,0,0,0v524.398c0,199.901-162.051,361.952-361.952,361.952h0h-1.711c-199.901,0.028-361.975-162.004-362.003-361.905c0-0.016,0-0.031,0-0.047V828.971c-0.001-28.428,23.038-51.471,51.466-51.474c0.001,0,0.002,0,0.003,0L1554.637,777.5z"/>
                      <circle cx="1943.75" cy="440.583" r="233.25"/>
                      <circle cx="1218.083" cy="440.583" r="233.25"/>
                      <path d="M1270.333,1001.5h575.713c54.391,0,98.483,44.092,98.483,98.483c0,0,0,0,0,0v524.398c0,199.901-162.051,361.952-361.952,361.952h0h-1.711c-199.901,0.028-361.975-162.004-362.003-361.905c0-0.016,0-0.031,0-0.047v-524.398c-0.001-28.428,23.038-51.471,51.466-51.474c0.001,0,0.002,0,0.003,0l0,0C1270.333,1001.5,1270.333,1001.5,1270.333,1001.5z"/>
                      <path d="M0,481.75v1059.833l723.333,376.459V359.43L0,481.75z"/>
                    </svg>
                    Mit Microsoft Teams anmelden
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-600 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Mit Microsoft Teams verbunden
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                >
                  Abmelden
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={fetchMeetings}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Meetings aktualisieren
              </Button>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.length > 0 ? (
                    meetings.map((meeting) => (
                      <Card key={meeting.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                {meeting.status === 'active' && (
                                  <Badge className="bg-green-500 mr-2">Jetzt</Badge>
                                )}
                                <h3 className="font-medium">{meeting.subject}</h3>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <p>
                                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                </p>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                <p>
                                  {meeting.attendees.length} Teilnehmer
                                </p>
                              </div>
                            </div>
                            {meeting.status !== 'completed' && (
                              <Button 
                                size="sm"
                                className="bg-[#4b53bc] hover:bg-[#3b3f8c]"
                                onClick={() => joinMeeting(meeting.joinUrl || '')}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Teilnehmen
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Keine anstehenden Meetings für heute
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <a 
                href="https://teams.microsoft.com/l/team/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center justify-end mt-4"
              >
                In Microsoft Teams öffnen
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="calendar">
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={fetchMeetings}
              disabled={loading || !isAuthenticated}
            >
              Meetings für diesen Tag laden
            </Button>

            {!isAuthenticated && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Bitte melden Sie sich an, um Ihre Meetings anzuzeigen
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
