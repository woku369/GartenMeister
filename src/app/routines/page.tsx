'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RoutineList from '@/components/routines/RoutineList';

export default function RoutinesPage() {
  const [currentTab, setCurrentTab] = useState('alle');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Wiederkehrende Routinen</h1>
      
      <Tabs defaultValue="alle" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-8 grid grid-cols-5 sm:w-[500px]">
          <TabsTrigger value="alle">Alle</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="bed">Beete</TabsTrigger>
          <TabsTrigger value="harvest">Ernte</TabsTrigger>
          <TabsTrigger value="herb">Kräuter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alle" className="mt-0">
          <RoutineList />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-0">
          <RoutineList />
        </TabsContent>
        
        <TabsContent value="bed" className="mt-0">
          <RoutineList />
        </TabsContent>
        
        <TabsContent value="harvest" className="mt-0">
          <RoutineList />
        </TabsContent>
        
        <TabsContent value="herb" className="mt-0">
          <RoutineList />
        </TabsContent>
      </Tabs>
      
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Über Routinen</CardTitle>
            <CardDescription>
              Routinen helfen Ihnen, wiederkehrende Aufgaben im Garten zu verwalten und zu automatisieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Mit Routinen können Sie wichtige wiederkehrende Aufgaben im GartenMeisterStudio speichern und deren Ausführung verfolgen. 
              Jede Routine kann eine bestimmte Häufigkeit haben (täglich, wöchentlich, monatlich oder jährlich), 
              und das System hilft Ihnen dabei, den Überblick zu behalten, wann sie zuletzt ausgeführt wurde und wann 
              die nächste Ausführung fällig ist.
            </p>
            <p className="mt-4">
              Kategorisieren Sie Ihre Routinen nach Typen - sei es für Kalender, Beete, Ernten oder Kräuter - 
              und organisieren Sie Ihre gärtnerischen Aufgaben effektiv.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
