# PDF-Export: Lösung für proportionale Beetdarstellung

## Problemstellung
Das PDF zeigte zwar alle 26 Beete, aber die Breiten waren nicht proportional zu den realen Beetmaßen wie in der UI.

## Ursache
- PDF-Generator verwendete feste Pixelbreiten mit komplexer Skalierungsberechnung
- UI verwendet Flexbox mit `flex-grow` basierend auf realen Beetbreiten
- Unterschiedliche Ansätze führten zu verschiedenen visuellen Ergebnissen

## Lösung
### 1. CSS-Anpassung
```css
.bed {
    /* VORHER: width: XXXpx; */
    flex-grow: [beetbreite in metern];
    height: 150px;
    /* Flexbox übernimmt proportionale Verteilung */
}
```

### 2. Logik-Vereinfachung
```javascript
// VORHER: Komplexe Pixelberechnung mit Skalierungsfaktor
const bedWidthPx = bedWidthM * PIXELS_PER_METER;
const scalingFactor = AVAILABLE_WIDTH / totalWidthTheoretical;
const bedWidthPxScaled = bedWidthPxTheoretical * scalingFactor;

// NACHHER: Direkte Verwendung der Beetbreite als flex-grow
const flexGrow = bed ? (bed.width || 1) : REFERENCE_WIDTH_UNOCCUPIED_M;
```

### 3. Exakte UI-Nachbildung
- Identische Logik zu `page.tsx`: `style={{ flexGrow: bed ? bed.width || 1 : REFERENCE_WIDTH_UNOCCUPIED_M }}`
- Automatische proportionale Verteilung durch Browser-Flexbox-Engine
- Keine manuellen Berechnungen mehr nötig

## Ergebnis
✅ **Perfekte proportionale Darstellung** - PDF sieht identisch zur UI aus
✅ **Alle 26 Beete sichtbar** - auch Beet 26 und leere Plätze
✅ **Wartbare Lösung** - einfacher Code, keine komplexen Berechnungen
✅ **Robust** - funktioniert mit verschiedenen Beetkonstellationen

## Technische Details
- **Flexbox**: `display: flex` mit `flex-grow` für automatische Proportionierung
- **Container**: `.bed-area` als Flex-Container mit `flex-wrap: nowrap`
- **Beete**: `.bed` als Flex-Items mit individuellen `flex-grow` Werten
- **Referenzbreite**: 1.5m für leere Beetplätze (aus UI übernommen)

## Commit-Message
"fix: Implementiere proportionale Beetdarstellung im PDF-Export

- Ersetze feste Pixelbreiten durch Flexbox mit flex-grow
- Verwende reale Beetbreiten (in Metern) als flex-grow Werte  
- Erreiche exakte Übereinstimmung zwischen UI und PDF
- Alle 26 Beete werden proportional und vollständig dargestellt"
