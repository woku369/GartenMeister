# 🌿 Konzeptanalyse: Visualisierung Neu – Quadrantenbasiertes Beetlayout

**Datum:** März 2026  
**Status:** Konzept präzisiert – Offene Fragen beantwortet ✅  
**Ausgangslage:** Aktueller Code vollständig analysiert  
**Ziel-Version:** GartenMeister v2.0  
**Git-Branch:** `feature/quadrant-layout` (abgezweigt von `portable-exe-build`)

---

## 🔀 Git-Strategie

**Branch:** `feature/quadrant-layout`  
**Abgezweigt von:** `portable-exe-build` (letzter stabiler Stand, EXE funktional)

```bash
git checkout -b feature/quadrant-layout
```

### Warum eigener Branch?
- Strukturelle Änderung am Datenmodell (`definitions.ts`, `data.ts`, `data-store.ts`)
- Neue Visualisierungskomponente ersetzt bestehende Streifenansicht
- `portable-exe-build` bleibt jederzeit als Fallback nutzbar
- Am Ende: Merge in `portable-exe-build` → neuer EXE-Build v2.0

### Auswirkungen auf Build / OneDrive / Datensync: **Keine**
App-Daten (`app-data.json`) liegen außerhalb des Git-Repos unter
`%APPDATA%\GartenMeister\` bzw. `OneDrive\GartenMeister\` –
unabhängig vom aktiven Branch immer dieselben Daten.

---

## ✅ Beantwortete Designfragen (März 2026)

| Frage | Antwort |
|---|---|
| Quadrantengrenzen starr oder frei? | **Frei verschiebbar** – Wege sind physisch vorhanden, genaue Maße noch offen |
| Rondeau im Kreuzungspunkt | **Ja** – Kreis/Pavillon/Zelt/Mandala, exakte Größe noch offen, Planungshorizont 2 Saisonen |
| Bestehende 19 Beete | **Bleiben in ihrer Orientierung**, werden in Quadrantensystem übernommen (geteilt durch Querweg) |
| Beetlänge im Formular | **Manuell überschreibbar** (Standard = aus Quadrant berechnet, aber editierbar) |
| Wo wird die Draufsicht angezeigt? | **Gartenübersichtsseite – wie bisher**, ersetzt/erweitert die bestehende Streifenansicht |
| Beete über Quadrantengrenze | **Option B: Zwei separate Objekte** (z.B. B1-Q1 + B1-Q2), unabhängig bewirtschaftbar |

---

## 1. Ist-Zustand im Code

### Gartenabmessungen (hardcoded in `src/lib/definitions.ts`)
```
GARDEN_TOTAL_WIDTH    = 87 m  (Breite von links nach rechts)
GARDEN_FIXED_BED_LENGTH = 43 m  (Beetlänge = Höhe des Gartens, fix)
BED_SPACING           = 0.5 m
```

### Datenmodell `BaseBed`
```typescript
interface BaseBed {
  id: string
  bedNumber: number
  type: BedType
  width: number      // variabel, quer zur 43m-Achse gemessen
  length: number     // immer = GARDEN_FIXED_BED_LENGTH (43m)
  color: string
  ...
}
```

### Visualisierung (aktuell)
Die Beete werden als **horizontale Streifen nebeneinander** dargestellt – ein eindimensionaler  
Streifenplan von links nach rechts:

```
┌────┬────┬────┬──────┬────┬────┐  ← Ansicht von oben (nur Breite = Gesamtfläche)
│ B1 │ B2 │ B3 │  B4  │ B5 │ B6 │  jedes Beet: Breite variabel, Länge = immer 43m
└────┴────┴────┴──────┴────┴────┘
```

Die **Tiefe (43m)** wird nicht visuell dargestellt, sie ist implizit.

### `GartenConfiguration` (aktuell)
Enthält nur: Beetanzahl, aktive/inaktive IDs, Name. **Kein räumliches Modell.**

---

## 2. Deine Anforderung

```
Gartenfläche: 85 m × 43 m

Aufteilung in 4 Quadranten:

     0          42.5m        85m
  0  ┌─────────────┬─────────────┐
     │             │             │
     │  Q1 (NW)    │  Q2 (NO)    │
     │             │             │
 21.5m─────────────┼─────────────┤
     │             │             │
     │  Q3 (SW)    │  Q4 (SO)    │
     │             │             │
 43m └─────────────┴─────────────┘

Pro Quadrant konfigurierbar:
  - Orientierung: längs (N–S) oder quer (W–O)
  - Beetlänge
  - Beetbreite (Standard)
  - Beetanzahl
```

### Orientierung erklärt

**Längs** (wie bisher, Beete laufen von oben nach unten):
```
Q1 – längs:
┌──┬──┬──┬──┬──┐
│  │  │  │  │  │   Beete: je 42.5m lang, variable Breite
│  │  │  │  │  │   Anzahl: z.B. 8 Beete nebeneinander
│  │  │  │  │  │
└──┴──┴──┴──┴──┘
```

**Quer** (90° gedreht, Beete laufen von links nach rechts):
```
Q2 – quer:
┌──────────────┐
├──────────────┤   Beete: je 42.5m breit (Quadrantenbreite), variable Höhe
├──────────────┤   Anzahl: z.B. 6 Beete übereinander
├──────────────┤
└──────────────┘
```

---

## 3. Was sich im Code ändern muss

### 3.1 Neue Datenstrukturen

#### Quadrant-Konfiguration (neu in `definitions.ts`)
```typescript
export type BeetOrientierung = 'laengs' | 'quer';
export type QuadrantPosition = 'NW' | 'NO' | 'SW' | 'SO';

export interface QuadrantConfig {
  id: string;                      // z.B. 'Q-NW'
  position: QuadrantPosition;
  orientierung: BeetOrientierung;
  
  // Abmessungen des Quadranten (bei 4 gleichen = je 42.5m × 21.5m)
  breiteM: number;                 // horizontale Ausdehnung
  hoeheM: number;                  // vertikale Ausdehnung
  
  // Beete in diesem Quadranten
  beetAnzahl: number;
  defaultBeetBreite: number;       // Standardbreite für neue Beete
  
  // Berechnete Beetlänge (automatisch aus Orientierung + Quadrantgröße)
  // laengs → beetLaenge = hoeheM des Quadranten
  // quer   → beetLaenge = breiteM des Quadranten
}
```

#### Erweiterung `GartenConfiguration` (in `definitions.ts`)
```typescript
export interface GartenConfiguration {
  // ... bestehende Felder bleiben unverändert ...
  currentBeetCount: number;
  maxBeetCount: number;
  activeBeetIds: string[];
  inactiveBeetIds: string[];
  gartenName?: string;
  lastModified: string;
  
  // NEU:
  gartenBreite: number;            // Gesamtbreite (aktuell 87m → auf 85m anpassen oder lassen)
  gartenHoehe: number;             // Gesamthöhe (43m)
  quadranten: QuadrantConfig[];    // 4 Quadranten
}
```

#### Erweiterung `BaseBed` (in `definitions.ts`)
```typescript
export interface BaseBed {
  // ... bestehende Felder bleiben ...
  id: string;
  bedNumber: number;
  type: BedType;
  width: number;        // unverändert
  length: number;       // bleibt, aber nicht mehr immer 43m – manuell überschreibbar
  color: string;
  
  // NEU:
  quadrantId?: string;   // Zuordnung zum Quadranten (optional für Rückwärtskompatibilität)
  beetGruppe?: string;   // NEU (Option B): logische Gruppe, z.B. 'B1' für B1-Q1 + B1-Q2
                         // Dient nur der Darstellung, hat keine Auswirkung auf Ernte-System
  // orientierung ergibt sich automatisch aus dem Quadranten – nicht am Beet gespeichert
}
```

> **Wichtig (Option B):** Beet 1 wird zu **zwei unabhängigen Beet-Objekten**:  
> - `B1-Q1` → `quadrantId: 'Q-NW'`, `length: 21`, `beetGruppe: 'B1'`  
> - `B1-Q2` → `quadrantId: 'Q-SW'`, `length: 21`, `beetGruppe: 'B1'`  
>
> Beide werden **separat im Ernte-System** geführt. Der Weg zwischen ihnen trennt sie physisch.  
> Das `beetGruppe`-Feld ist rein optional für die Visualisierung (gestrichelte Verbindungslinie o.ä.).
>
> Das `length`-Feld existiert schon in `BaseBed`. Standard = aus Quadrant berechnet, manuell überschreibbar.

---

### 3.2 Betroffene Dateien

| Datei | Änderung | Aufwand |
|---|---|---|
| `src/lib/definitions.ts` | `QuadrantConfig` hinzufügen, `GartenConfiguration` erweitern, `BaseBed` + `quadrantId` + `beetGruppe` | Klein |
| `src/lib/data.ts` | `GARDEN_FIXED_BED_LENGTH` → aus Quadrant berechnen, `addBed()` anpassen | Mittel |
| `src/lib/data-store.ts` | `GartenConfiguration` laden/speichern mit Quadranten | Klein |
| `src/components/beds/BedForm.tsx` | Quadrant-Picker hinzufügen | Mittel |
| `src/components/settings/...` | Quadrant-Konfiguration UI (neu) | Mittel |
| **`src/app/page.tsx` (Dashboard)** | **Neue 2D-Visualisierung** | **Groß** |
| `src/lib/pdf-generator.ts` | Quadrant-Logik für PDF berücksichtigen | Mittel |
| IPC-Handler in `src/index-portable.js` | Quadrant-Config lesen/schreiben | Klein |

### 3.3 Was sich **nicht** ändert

- ✅ Das gesamte Ernte-System (Harvest Events, Contributions)
- ✅ Alle IPC-Handler für Beete, Benutzer, Backup
- ✅ Kräuter-Management
- ✅ PDF-Inhalte (Tabellen, Statistiken)
- ✅ Backup/Restore
- ✅ OneDrive-Sync
- ✅ Segment-System für Kombinationsbeete  
  (Segmentlänge bleibt relativ zur Beetlänge – funktioniert weiterhin)

### 3.4 Migration der bestehenden 19 Beete (Option B)

Die 19 bestehenden Beete laufen längs durch den Garten (N–S) und werden durch den Querweg geteilt.
Jedes bisherige Beet wird in **zwei neue Objekte** aufgespalten:

```
Bisher:   Beet 1  →  id: 'bed-1',  length: 43,  quadrantId: –

Nachher:  Beet 1-Q1  →  id: 'bed-1-q1',  length: ~21,  quadrantId: 'Q-NW',  beetGruppe: 'B1'
          Beet 1-Q2  →  id: 'bed-1-q2',  length: ~21,  quadrantId: 'Q-SW',  beetGruppe: 'B1'
```

**Migrationsstrategie:**  
- Einmaliger Migrations-Schritt beim ersten Start mit neuem Datenmodell  
- Alle 19 Beete → 38 Objekte (je Q1/Q3 bzw. Q2/Q4 je nach Lage)
- Erntedaten bleiben am jeweiligen Teil-Beet hängen  
- Die genaue Länge (z.B. 21m) ergibt sich aus der konfigurierten Wegposition (freie Quadrantengrenze)

---

## 4. Die neue Visualisierung (Herzstück)

### Konzept: SVG-basierte Gartendraufsicht (Gartenübersichtsseite)

Die bestehende Streifenansicht wird durch eine echte 2D-Draufsicht ersetzt.  
Die 19 bisherigen Beete erscheinen als **je zwei Hälften** in Q1 (NW) und Q3 (SW), durch den Querweg getrennt.  
Das Rondeau im Kreuzungspunkt wird als Kreis dargestellt (Größe konfigurierbar, vorerst als Platzhalter).

```
  0                  Querweg (vertikal)              85m
  ┌────┬────┬────┬───┬─┬────┬────┬────┬────┐
  │B1  │B2  │B3  │...│║│    │    │    │    │  ← zukünftige Q2-Beete (quer oder leer)
  │-Q1 │-Q1 │-Q1 │   │║│    │Q2  │    │    │
  │    │    │    │   │║│    │(NO)│    │    │
──┼────┼────┼────┼───┼╬┼────┼────┼────┼────┼──  ← Querweg (horizontal)
  │    │    │    │   │║│    │    │    │    │     + Rondeau im Kreuzungspunkt (●)
──┼────┼────┼────┼───┼╬┼────┼────┼────┼────┼──
  │B1  │B2  │B3  │...│║│    │    │    │    │
  │-Q3 │-Q3 │-Q3 │   │║│    │Q4  │    │    │
  │    │    │    │   │║│    │(SO)│    │    │
  └────┴────┴────┴───┴─┴────┴────┴────┴────┘
  Q1 (NW)            Q3 (SW)  │  Q2 (NO)  Q4 (SO)
                              │
                         Längsweg
```

**Legende:**
- Beete in Sortenfarbe eingefärbt (wie bisher)
- Wege = hellgrau, breite Streifen
- Rondeau = Kreis im Zentrum, Farbe/Beschriftung konfigurierbar
- `beetGruppe` kann gestrichelt anzeigen, dass B1-Q1 und B1-Q3 zusammengehören
- Klick auf Beet → navigiert zur Beetdetailseite (wie bisher)

Jedes Beet:
- **Farbe** = aktuelle Sortenfarbe (wie bisher)
- **Hover/Klick** → Tooltip mit Beetname, Sorte, Pflanzdatum
- **Klick** → navigiert zur Beetdetailseite

### Umsetzungsoption: React + SVG
```tsx
// Konzept (vereinfacht)
<svg viewBox="0 0 870 430" className="w-full border rounded">
  {quadranten.map(q => (
    <QuadrantView key={q.id} quadrant={q} beete={bedsForQuadrant(q.id)} />
  ))}
</svg>
```

> Kein externes Library nötig – SVG ist in React vollständig nativ.  
> Alternativ: `<canvas>` für komplexere Interaktionen.

---

## 5. Neue UI: Quadrant-Konfiguration

Ein neuer Bereich in **Einstellungen → Gartenlayout**:

```
┌─────────────────────────────────────────────────────────┐
│ Gartenlayout – Quadrantenkonfiguration                  │
│                                                         │
│  Gartengröße: [85] m × [43] m                          │
│                                                         │
│  Quadrant NW          Quadrant NO                       │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Orientierung │    │ Orientierung │                  │
│  │ ○ längs      │    │ ● quer       │                  │
│  │ ● quer       │    │ ○ längs      │                  │
│  │ Beetanzahl: 8│    │ Beetanzahl: 6│                  │
│  │ Std-Breite:  │    │ Std-Breite:  │                  │
│  │ [1.2] m      │    │ [1.5] m      │                  │
│  └──────────────┘    └──────────────┘                  │
│                                                         │
│  Quadrant SW          Quadrant SO                       │
│  ...                  ...                               │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Bewertung: Ist es realisierbar?

### ✅ Ja, vollständig realisierbar.

| Dimension | Bewertung |
|---|---|
| **Technische Machbarkeit** | ✅ Kein grundlegendes Architekturproblem |
| **Rückwärtskompatibilität** | ✅ `quadrantId` optional → bestehende Beete bleiben gültig |
| **Aufwand gesamt** | ca. 3–5 Entwicklungstage |
| **Risiko** | Gering – alle kritischen Systeme bleiben unberührt |
| **Bestehende Daten** | ✅ Existierende Beete können einem Quadranten nachträglich zugeordnet werden |

### Kritischer Punkt: `GARDEN_FIXED_BED_LENGTH`

Diese Konstante (`43`) ist an **5 Stellen** hardcoded in `data.ts`. Sie muss durch eine  
Funktion ersetzt werden:

```typescript
// Statt:
length: GARDEN_FIXED_BED_LENGTH

// Neu:
length: getBeetLaengeForQuadrant(quadrantId)
// → gibt quadrant.hoeheM (längs) oder quadrant.breiteM (quer) zurück
// → Fallback: GARDEN_FIXED_BED_LENGTH für nicht zugeordnete Beete
```

Das ist ein chirurgischer Eingriff an genau 5 Stellen – überschaubar.

---

## 7. Empfohlene Umsetzungsreihenfolge

```
Schritt 1 (klein)    Neue Typen in definitions.ts
                     QuadrantConfig, BeetOrientierung, GartenConfiguration erweitern
                     BaseBed + quadrantId + beetGruppe (beide optional)

Schritt 2 (mittel)   data.ts / data-store.ts anpassen
                     GARDEN_FIXED_BED_LENGTH → dynamisch aus Quadrant (manuell überschreibbar)
                     Migrations-Funktion: 19 Beete → je 2 Hälften aufteilen

Schritt 3 (mittel)   Quadrant-Konfiguration UI in Einstellungen
                     Wegbreite (horizontal + vertikal) und Wegposition frei verschiebbar
                     Rondeau-Konfiguration: Radius, Beschriftung, Typ (Platzhalter)

Schritt 4 (mittel)   BedForm.tsx: Quadrant-Picker + Beetlänge manuell editierbar
                     Beim Erstellen/Bearbeiten eines Beets den Quadranten wählen

Schritt 5 (groß)     Neue 2D-Draufsicht (SVG) auf Gartenübersichtsseite
                     Wege als Streifen, Rondeau als Kreis im Kreuzungspunkt
                     Beete in Sortenfarbe, Klick → Beetdetail
                     Optional: gestrichelte Linie zwischen beetGruppe-Paaren

Schritt 6 (klein)    Build + Test
                     npm run build:portable, EXE testen
```

---

## 8. Offene Fragen – ✅ ALLE BEANTWORTET

| # | Frage | Antwort | Status |
|---|---|---|---|
| 1 | Quadrantengrenzen | Frei verschiebbar (physische Wege) | ✅ |
| 2 | Bestehende Beete | Option B: je 2 Objekte (B1-Q1 + B1-Q3), unabhängig bewirtschaftbar | ✅ |
| 3 | Beetlänge im Formular | Manuell überschreibbar | ✅ |
| 4 | Wo Draufsicht | Gartenübersichtsseite – wie bisher | ✅ |

### Noch offen (für Schritt 3)
- Genaue Wegbreite (Längsweg + Querweg in Metern) – nach Bau festlegbar
- Genaue Position des Querwegs (aktuell ca. 21m, exakt noch offen)
- Rondeau: Radius und Typ (Planungshorizont 2 Saisonen)

---

*Diese Analyse basiert auf dem aktuellen Quellcode (Stand August 2025 / Branch `portable-exe-build`).*  
*Alle Designentscheidungen basieren auf dem Gespräch vom März 2026.*  
*Alle genannten Dateipfade und Konstanten wurden direkt aus dem Code abgelesen.*
