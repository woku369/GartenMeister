import GardenImageGallery from '@/components/gallery/GardenImageGallery';
import GalleryStatsCards from '@/components/gallery/GalleryStatsCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Calendar, Users } from 'lucide-react';

export default function GalleryPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bildersammlung</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="h-4 w-4" />
          Dokumentation & Galerie
        </div>
      </div>

      {/* Dynamische Übersicht Karten */}
      <GalleryStatsCards />

      {/* Haupt-Galerie mit Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Alle Bilder</TabsTrigger>
          <TabsTrigger value="growth">Wachstum</TabsTrigger>
          <TabsTrigger value="harvest">Ernte</TabsTrigger>
          <TabsTrigger value="pests">Schädlinge</TabsTrigger>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <GardenImageGallery showUpload={true} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wachstumsdokumentation</CardTitle>
              <CardDescription>
                Bilder zur Dokumentation des Pflanzenwachstums über die Zeit
              </CardDescription>
            </CardHeader>
          </Card>
          <GardenImageGallery category="Wachstum" showUpload={true} />
        </TabsContent>

        <TabsContent value="harvest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ernte-Galerie</CardTitle>
              <CardDescription>
                Dokumentation der Ernten und Erträge aus dem Garten
              </CardDescription>
            </CardHeader>
          </Card>
          <GardenImageGallery category="Ernte" showUpload={true} />
        </TabsContent>

        <TabsContent value="pests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schädlings- & Krankheitsdokumentation</CardTitle>
              <CardDescription>
                Bilder zur Identifikation und Behandlung von Gartenproblemen
              </CardDescription>
            </CardHeader>
          </Card>
          <GardenImageGallery category="Schädlinge" showUpload={true} />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Gartenbilder</CardTitle>
              <CardDescription>
                Sonstige Aufnahmen und Momentaufnahmen aus dem Garten
              </CardDescription>
            </CardHeader>
          </Card>
          <GardenImageGallery category="Allgemein" showUpload={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
