# Jahresstatistiken für Ernteerträge - 17.06.2025

## Neue Funktionalität

### 1. **Jahresstatistiken in der UI**

Eine neue Komponente `YearlyHarvestStatistics` wurde hinzugefügt, die:

#### **Jahresübersicht pro Bewirtschaftungsjahr**:
- **Gesamtertrag in kg** für das Jahr
- **Anzahl ertragsfähiger Pflanzen** für das Jahr
- **Anzahl Ernten gesamt** für das Jahr

#### **Detailstatistiken pro Sorte**:
- **Anzahl Ernten** pro Sorte
- **Gesamtertrag in kg** pro Sorte
- **Ertragsfähige Pflanzen** pro Sorte
- **Durchschnitt kg/Ernte** 
- **Durchschnitt g/Pflanze** (sehr wichtige Kennzahl!)

#### **Features**:
- ✅ **Tabs für verschiedene Jahre** - einfacher Wechsel zwischen Bewirtschaftungsjahren
- ✅ **Sortierung nach Ertrag** - Die ertragreichsten Sorten stehen oben
- ✅ **Farbcodierung** - Jede Sorte behält ihre visuelle Identität
- ✅ **Responsives Design** - Funktioniert auf verschiedenen Bildschirmgrößen
- ✅ **Professionale Darstellung** - Klare Tabellen und Karten-Layout

### 2. **Erweiterte PDF-Berichte**

Der PDF-Export für Ernteberichte wurde um Jahresstatistiken erweitert:

#### **Neue PDF-Sektion: "Jahresstatistiken nach Sorten"**
- **Bewirtschaftungsjahr-Übersicht** mit Gesamtzahlen
- **Detailtabelle pro Sorte** mit allen Kennzahlen
- **Professionelle Formatierung** für Außenstehende

#### **Sortierung und Gruppierung**:
- Jahre absteigend sortiert (neueste zuerst)
- Sorten nach Gesamtertrag sortiert (ertragreichste zuerst)
- Farbindikatoren für bessere Übersicht

## Technische Implementierung

### Neue Dateien:
- `src/components/reports/YearlyHarvestStatistics.tsx` - UI-Komponente für Jahresstatistiken

### Erweiterte Dateien:

#### **src/app/reports/page.tsx**:
```tsx
// Neue Komponente importiert und verwendet
import YearlyHarvestStatistics from '@/components/reports/YearlyHarvestStatistics';

// herbColor zu enrichedEvent hinzugefügt für PDF-Export
herbColor: herbMap.get(event.herbVarietyId)?.color,
```

#### **src/simple-pdf-generator-improved.js**:
```javascript
// Neue Funktion für Jahresstatistiken
static generateYearlyStatsHTML(harvestEvents) {
    // Gruppiert Events nach Jahr
    // Berechnet Sortenstatistiken pro Jahr
    // Erstellt HTML-Tabellen mit Statistiken
}

// Erweiterte generateReportsHTML Funktion
// Integriert Jahresstatistiken in PDF-Export
```

### UI-Komponenten verwendet:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Badge` - für Ernte-Anzahl-Anzeige
- Lucide Icons: `Calendar`, `Package`, `TreePine`, `TrendingUp`

## Nutzenanalyse

### **Für die Jahresplanung**:
1. **Ertragreichste Sorten identifizieren** - Welche Kräuter bringen den besten Ertrag?
2. **Pflanzenzahl optimieren** - Wie viele ertragsfähige Pflanzen brauche ich für mein Ertragsziel?
3. **Effizienz berechnen** - g/Pflanze zeigt die Effizienz einer Sorte
4. **Erntezyklen planen** - Wie oft kann/sollte eine Sorte geerntet werden?

### **Für die Dokumentation**:
1. **Jahresberichte** - Professionelle PDFs für Behörden/Partner
2. **Betriebsanalyse** - Historische Entwicklung der Erträge
3. **Sortenvergleich** - Welche Untersorten sind am erfolgreichsten?
4. **Produktivitätsnachweise** - Konkrete Zahlen pro Pflanze und Fläche

### **Wichtige Kennzahlen**:
- **kg/Ernte** → Hilft bei der Planung der Ernteintervalle
- **g/Pflanze** → Zeigt die Effizienz einer Sorte (wichtigste Kennzahl!)
- **Ertragsfähige Pflanzen** → Kapazitätsplanung
- **Ernte-Anzahl** → Arbeitsaufwand und Timing

## Benutzerflow

### **In der UI**:
1. Navigiere zu "Ernteberichte"
2. Jahresstatistiken werden automatisch oben angezeigt
3. Wechsle zwischen Jahren über Tabs
4. Betrachte Sortenstatistiken in der Tabelle

### **PDF-Export**:
1. Klicke auf "Als PDF exportieren" bei den Ernteberichten
2. PDF enthält jetzt zusätzlich die Jahresstatistiken
3. Professional formatiert für Außenstehende

## Beispiel-Kennzahlen

Für eine erfolgreiche Saison könnten die Statistiken so aussehen:

**Bewirtschaftungsjahr 2025:**
- **Gesamtertrag**: 45.3 kg
- **Ertragsfähige Pflanzen**: 1,247
- **Ernten gesamt**: 23

**Top-Sorten (nach Ertrag):**
1. **Petersilie** - 12.4 kg aus 340 Pflanzen (36g/Pflanze, 6 Ernten)
2. **Schnittlauch** - 8.7 kg aus 280 Pflanzen (31g/Pflanze, 8 Ernten)
3. **Basilikum** - 6.2 kg aus 180 Pflanzen (34g/Pflanze, 4 Ernten)

Diese Zahlen helfen bei:
- **Anbauplanung 2026** - Mehr Petersilie, weniger von schwächeren Sorten
- **Kostenkalkulation** - Arbeitsaufwand pro kg berechnen
- **Verkaufspreise** - Auf Basis der realen Produktionskosten

## Integration

Die neue Funktionalität ist vollständig in die bestehende App integriert:
- ✅ Nutzt vorhandene Datenstrukturen
- ✅ Konsistente UI mit existierenden Komponenten
- ✅ Erweitert PDF-Export ohne Breaking Changes
- ✅ Performant durch memoization und optimierte Gruppierung
- ✅ Responsive Design für verschiedene Bildschirmgrößen

Die Implementierung ist wartbar und erweiterbar für zukünftige Anforderungen.
