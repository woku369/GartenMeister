# Wetterstatistiken "Gartenwerkzeuge" - 17.06.2025

## 🌦️ Neue Funktionalität: Wetterstatistiken

### **Überblick**
Eine umfassende Wetterstatistik-Funktionalität wurde implementiert, die es ermöglicht, Wetterdaten automatisch zu sammeln und statistisch auszuwerten. Dies hilft bei der Korrelation von Ernteerträgen mit Wetterbedingungen.

## **Funktionen**

### **1. Automatische Datensammlung**
- **WeatherWidget erweitert**: Sammelt automatisch alle 30 Minuten Wetterdaten
- **Persistente Speicherung**: Wetterdaten werden lokal in `weather-data.json` gespeichert
- **Intelligente Duplikaterkennung**: Verhindert redundante Datenpunkte

#### **Gesammelte Daten**:
- ✅ **Lufttemperatur** (°C)
- ✅ **Bodentemperatur** (°C) - Besonders wichtig für Gartenanalyse
- ✅ **Luftfeuchtigkeit** (%)
- ✅ **Windgeschwindigkeit** (km/h)
- ✅ **Niederschlag** (mm)
- ✅ **Wetterbedingungen** (sonnig, bewölkt, regnerisch)

### **2. Neue Seite: "Gartenwerkzeuge"**
Erreichbar über die Sidebar mit dem CloudRain-Icon

#### **Tab 1: Jahresgraphen** 📊
- **Temperaturverläufe**: Luft- und Bodentemperatur pro Monat
- **Niederschlag**: Monatsweise Balkendiagramm
- **Luftfeuchtigkeit**: Verlaufskurve über das Jahr
- **Jahresvergleich**: Multi-Jahr-Analyse (wenn verfügbar)

#### **Tab 2: Datentabelle** 📋
- **Detailansicht**: Letzten 100 Messungen
- **Farbcodierung**: Temperaturen und Wetterbedingungen
- **Zeitstempel**: Datum und Uhrzeit jeder Messung
- **Sortierung**: Neueste Daten zuerst

#### **Tab 3: Analyse** 🔍
- **Vorbereitet für**: Korrelation Wetter ↔ Ernteerträge
- **Geplant**: Automatische Frost-/Trockenheitsschadenserkennung

### **3. Statistik-Übersicht** 📈

#### **Jahres-Kennzahlen**:
- **Durchschnittstemperaturen** (Luft + Boden)
- **Gesamtniederschlag** pro Jahr
- **Durchschnittliche Luftfeuchtigkeit**
- **Frosttage** (Bodentemperatur ≤ 0°C)
- **Trockene Tage** (Niederschlag < 1mm)
- **Regentage** (Niederschlag ≥ 1mm)
- **Anzahl Messungen** (Datenqualität-Indikator)

#### **Jahresvergleich**:
- **Prozentuale Änderungen** zum Vorjahr
- **Farbkodierung**: Rot = wärmer/mehr, Blau = kälter/weniger

## **Technische Implementierung**

### **Neue Dateien**:
```
src/app/weather/page.tsx                    # Hauptseite "Gartenwerkzeuge"
src/components/weather/
  ├── WeatherStatisticsCharts.tsx          # Diagramme (Recharts)
  ├── WeatherDataTable.tsx                 # Tabellendarstellung
  └── WeatherOverview.tsx                  # Übersichtskarten
```

### **Erweiterte Dateien**:
```
src/lib/definitions.ts                     # WeatherDataPoint, WeatherStatistics
src/lib/storage-manager.ts                 # Wetterdaten-Speicherung
src/lib/data.ts                           # getWeatherData(), getWeatherStatistics()
src/components/dashboard/WeatherWidget.tsx # Datensammlung
src/components/layout/AppSidebar.tsx       # Navigation erweitert
```

### **Datenbank-Struktur**:
```typescript
WeatherDataPoint {
  id: string;
  timestamp: string;           // ISO date
  airTemperature: number;      // °C
  soilTemperature: number;     // °C  
  humidity: number;            // %
  windSpeed: number;           // km/h
  precipitation: number;       // mm
  condition: string;           // Beschreibung
}

WeatherStatistics {
  year: number;
  avgAirTemperature: number;
  avgSoilTemperature: number;
  totalPrecipitation: number;
  frostDays: number;           // Bodentemperatur ≤ 0°C
  dryDays: number;             // Niederschlag < 1mm
  rainyDays: number;           // Niederschlag ≥ 1mm
  // ... weitere Kennzahlen
}
```

## **Praktische Anwendungen**

### **Für Ertragsanalyse**:
1. **Frostschäden identifizieren**: Welche Ernteausfälle korrelieren mit Frosttagen?
2. **Trockenheitsschäden**: Ertragseinbußen nach Trockenperioden
3. **Optimale Erntezeitpunkte**: Wetter-basierte Ernteplanung
4. **Sortenwahl**: Welche Kräuter vertragen bestimmte Bedingungen besser?

### **Für Anbauplanung**:
1. **Pflanztermine**: Basierend auf historischen Frostdaten
2. **Bewässerungsplanung**: Anhand von Niederschlags-Statistiken
3. **Schutzmaßnahmen**: Frost-/Trockenschutz rechtzeitig vorbereiten

### **Beispiel-Erkenntnisse**:
```
Bewirtschaftungsjahr 2025:
├── Ø Lufttemperatur: 14.2°C (+1.8°C vs. 2024)
├── Ø Bodentemperatur: 12.8°C (+1.1°C vs. 2024)  
├── Niederschlag: 678mm (-89mm vs. 2024)
├── Frosttage: 23 (-8 vs. 2024)
└── Trockene Tage: 89 (+12 vs. 2024)

→ Interpretation: Wärmeres, trockeneres Jahr
→ Mögliche Auswirkung: Höherer Bewässerungsbedarf
→ Erwartung: Frühere Ernte, evtl. geringere Erträge bei wasserhungrigen Sorten
```

## **UI/UX Design**

### **Benutzerfreundlichkeit**:
- ✅ **Intuitive Tabs**: Übersicht → Details → Analyse
- ✅ **Responsive Charts**: Recharts mit Touch/Zoom-Support
- ✅ **Farbkodierung**: Temperaturen, Wetter, Trends
- ✅ **Tooltips**: Detailinfos on hover
- ✅ **Keine Daten**: Elegante Leer-Zustände

### **Visuelle Elemente**:
- **Icons**: 🌡️ Thermometer, 💧 Tropfen, 🌬️ Wind, ☁️ Wolken
- **Farben**: Rot=warm, Blau=kalt, Grün=normal, Gelb=trocken
- **Charts**: Linien für Verläufe, Balken für Mengen

## **Integration**

### **Sidebar-Navigation**:
```
🏠 Übersicht
📊 Dashboard  
🌿 Kräutersorten
📈 Ernteberichte
🌦️ Gartenwerkzeuge  ← NEU
🔄 Routinen
⚙️ Einstellungen
```

### **Datenfluss**:
```
Dashboard WeatherWidget → Sammelt Daten alle 30min
                       ↓
Storage Manager → Speichert in weather-data.json
                       ↓  
Data.ts → Lädt und berechnet Statistiken
                       ↓
Gartenwerkzeuge → Zeigt Graphiken und Tabellen
```

## **Zukünftige Erweiterungen**

### **Geplante Features**:
1. **Echte Wetter-API**: Integration mit OpenWeatherMap/anderen Anbietern
2. **Ertrags-Korrelation**: Automatische Analyse Wetter ↔ Ernten
3. **Vorhersagen**: ML-basierte Ertragsprognosen
4. **Warnungen**: Frost-/Trockenheits-Alerts
5. **Export**: Wetter-PDF-Berichte
6. **Bodenfeuchte**: Zusätzliche Sensoren

### **API-Integration** (Vorbereitet):
```javascript
// Beispiel für echte API-Nutzung:
const response = await axios.get(
  `https://api.openweathermap.org/data/2.5/weather?q=Gurk,AT&appid=YOUR_KEY&units=metric`
);
```

## **Nutzen für Gartenmanagement**

### **Sofortige Vorteile**:
- 📊 **Datenbasierte Entscheidungen** statt Bauchgefühl
- 🌡️ **Frostschutz-Planung** durch historische Daten
- 💧 **Bewässerungsoptimierung** basierend auf Niederschlag
- 📈 **Ertragssteigerung** durch optimale Bedingungen

### **Langzeit-Strategie**:
- 🏆 **Sortenzüchtung**: Beste Sorten für lokales Klima identifizieren
- 📅 **Jahresplanung**: Optimale Anbauzeiten bestimmen
- 🛡️ **Risikomanagement**: Wetterrisiken minimieren
- 💰 **Kostenoptimierung**: Weniger Ausfälle, höhere Effizienz

Die Wetterstatistik-Funktionalität ist vollständig implementiert und sofort einsatzbereit! 🌿📊
