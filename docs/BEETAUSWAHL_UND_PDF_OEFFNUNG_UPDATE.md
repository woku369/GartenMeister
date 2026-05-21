# Beetauswahl und PDF-Öffnung Update - 17.06.2025

## Problemstellung
1. **Beetauswahl im Erntevorgang**: Beim Ernten von Kräutern (z.B. Zitronenmelisse in 3 verschiedenen Beeten) fehlte die Möglichkeit, spezifische Beete auszuwählen. Bisher wurden automatisch alle Beete mit der entsprechenden Sorte zur Ernte hinzugefügt.

2. **PDF-Öffnung bei Ernteberichten**: Nach dem Export von Ernteberichten als PDF wurde das PDF nicht automatisch geöffnet, im Gegensatz zum Gartenübersichtsbericht.

## Implementierte Lösungen

### 1. Beetauswahl im Erntevorgang (GlobalHarvestWorkflowModal)

#### Neue UI-Funktionalität:
- **Schritt 1 erweitert**: Nach Auswahl einer Kräutersorte werden alle relevanten Beete geladen und in einer Checkbox-Liste angezeigt
- **Checkbox-Interface**: Benutzer kann gezielt Beete aus-/abwählen
- **Massenauswahl**: "Alle auswählen" und "Alle abwählen" Buttons
- **Visuelle Indikatoren**: Farbcodierung der Sorte, Beet-Nummer, Typ und Segment-Anzahl

#### Technische Implementierung:
```tsx
// Neue State für ausgewählte Beete
const [selectedBeds, setSelectedBeds] = useState<Set<string>>(new Set());

// Checkbox-Komponente mit shadcn/ui
<Checkbox
  checked={selectedBeds.has(bed.id)}
  onCheckedChange={(checked) => handleBedSelection(bed.id, !!checked)}
/>
```

#### Workflow-Anpassungen:
1. **Step 1**: Sorte auswählen → Beete laden → Beete auswählen → Weiter
2. **Step 2**: Nur ausgewählte Beete werden für Produktivitäts-Updates angezeigt
3. **Step 3**: Finale Bestätigung bezieht sich nur auf ausgewählte Beete

#### Funktionen hinzugefügt:
- `handleBedSelection()`: Einzelne Beet-Auswahl
- `handleSelectAllBeds()`: Alle Beete auswählen
- `handleDeselectAllBeds()`: Alle Beete abwählen
- Erweiterte Validierung in `handleStartEvent()` und `handleSaveProductivityAndContributions()`

### 2. PDF-Öffnung bei Ernteberichten

#### Problem identifiziert:
Der `ExportPDFButton` (für Ernteberichte) verwendete einen anderen Ansatz als der `GardenExportPDFButton`.

#### Lösung implementiert:
```tsx
// Bestätigungsdialog hinzugefügt (wie bei Gartenübersicht)
if (window.confirm(`Der PDF-Export war erfolgreich! Möchten Sie das PDF jetzt öffnen?`)) {
  try {
    if (window.electronAPI && window.electronAPI.openExportFolder) {
      await window.electronAPI.openExportFolder();
    }
  } catch (openError) {
    console.warn("Konnte den Export-Ordner nicht öffnen:", openError);
  }
}
```

## Dateien geändert

### GlobalHarvestWorkflowModal.tsx
- **Import hinzugefügt**: `Checkbox` aus shadcn/ui
- **renderStep1()**: Beetauswahl-UI hinzugefügt
- **renderStep2()**: Nur ausgewählte Beete anzeigen
- **handleStartEvent()**: Zweistufiger Prozess (Beete laden → Auswahl → Fortfahren)
- **handleSaveProductivityAndContributions()**: Filterung auf ausgewählte Beete
- **Neue Hilfsfunktionen**: Beet-Auswahl-Management

### export-pdf-button.tsx
- **PDF-Öffnung**: Bestätigungsdialog und Ordner-Öffnung hinzugefügt
- **Konsistenz**: Gleicher Ansatz wie bei Gartenübersicht

## Benutzererfahrung Verbesserungen

### Vor der Änderung:
- ✗ Alle Beete einer Sorte wurden automatisch zur Ernte hinzugefügt
- ✗ Keine Möglichkeit zur selektiven Ernte
- ✗ Erntebericht-PDF wurde nicht automatisch geöffnet

### Nach der Änderung:
- ✅ Benutzer kann gezielt Beete für die Ernte auswählen
- ✅ Flexible Ernte-Planung (z.B. manche Beete später ernten)
- ✅ Visuelle Bestätigung der Auswahl mit Checkbox-Interface
- ✅ Massenauswahl-Funktionen für Komfort
- ✅ Erntebericht-PDF wird nach Export automatisch geöffnet
- ✅ Konsistente PDF-Öffnung für beide Export-Typen

## Technische Details

### State Management:
```tsx
// Beetauswahl wird als Set verwaltet für bessere Performance
const [selectedBeds, setSelectedBeds] = useState<Set<string>>(new Set());

// Productivity Updates werden dynamisch basierend auf Auswahl erstellt
const initialUpdates = {};
relevantBedsAndSegments.forEach(bed => {
  if (selectedBeds.has(bed.id)) {
    // Nur für ausgewählte Beete Updates erstellen
  }
});
```

### Validierung:
- Mindestens ein Beet muss ausgewählt sein
- Productivity Updates werden nur für ausgewählte Beete gespeichert
- Konsistenz-Prüfungen für Segment-zu-Beet-Zuordnung

### UI/UX:
- Shadcn/ui Checkbox-Komponente für konsistentes Design
- Scroll-Container für viele Beete
- Zähler für ausgewählte Beete
- Farbindikatoren für Sorten-Zuordnung

## Testing-Empfehlungen

1. **Beetauswahl testen**:
   - Sorte mit mehreren Beeten wählen (z.B. Zitronenmelisse)
   - Einzelne Beete aus-/abwählen
   - "Alle auswählen/abwählen" Funktionen
   - Versuch ohne Auswahl (sollte Fehler zeigen)

2. **PDF-Export testen**:
   - Erntebericht exportieren
   - Bestätigungsdialog bestätigen
   - Export-Ordner sollte sich öffnen

3. **Workflow-Integration**:
   - Vollständigen Erntevorgang mit selektiver Beetauswahl durchlaufen
   - PDF-Export nach abgeschlossener Ernte

## Backward Compatibility

- ✅ Bestehende Daten bleiben unverändert
- ✅ Standardverhalten: Alle Beete zunächst ausgewählt
- ✅ Keine Breaking Changes in der API
- ✅ Graceful Fallbacks bei fehlenden UI-Elementen
