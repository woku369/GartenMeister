# PDF-Export Strategie für Gartenübersicht

## Ziel
Pixel-perfekte Wiedergabe der Gartenübersichtsseite als DIN A4 Querformat PDF

## Strategie: Hybrid-Ansatz
1. **Server-Side Rendering** der aktuellen UI-Komponenten
2. **Puppeteer** für hochqualitative PDF-Generierung
3. **Echte React-Komponenten** als HTML-Basis

## Implementierungsschritte

### Phase 1: UI-Komponenten für PDF vorbereiten
- Exportierbare React-Komponenten für Beetvisualisierung
- Exportierbare React-Komponenten für Tabellen
- CSS-in-JS oder inline Styles für PDF-Kompatibilität

### Phase 2: Server-Side HTML-Generierung
- React Server Components oder ReactDOMServer.renderToString()
- Vollständige Stilübertragung
- Statische HTML-Generierung mit allen Daten

### Phase 3: Puppeteer-Integration
- HTML in Puppeteer laden
- A4 Querformat konfiguration
- Hochqualitative PDF-Generierung

### Phase 4: IPC-Bridge
- Electron Main Process Integration
- Datentransfer optimiert
- Fehlerbehandlung

## Vorteile
- 100% UI-Übereinstimmung
- Wartbare Codebasis
- Skalierbar für weitere Exporte
- Professionelle Qualität
