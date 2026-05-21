# Mitwirkung am GartenMeisterStudio

Vielen Dank für dein Interesse am GartenMeisterStudio! Diese Anleitung hilft dir dabei, effektiv zum Projekt beizutragen.

## Einrichtung der Entwicklungsumgebung

1. **Repository klonen**
   ```powershell
   git clone https://github.com/username/GartenMeisterStudio.git
   cd GartenMeisterStudio
   ```

2. **Abhängigkeiten installieren**
   ```powershell
   npm install
   ```

3. **Entwicklungsserver starten**
   ```powershell
   npm run dev:electron
   ```

## Branching-Strategie

Wir verwenden folgende Branch-Struktur:

- `main` - Hauptbranch, enthält den stabilen Code
- `develop` - Entwicklungsbranch, hier werden neue Features zusammengeführt
- `feature/xyz` - Feature-Branches für neue Funktionen
- `bugfix/xyz` - Bugfix-Branches für Fehlerbehebungen
- `release/x.y.z` - Release-Branches für Versionsvorbereitungen

## Pull-Request-Prozess

1. **Branch erstellen**
   ```powershell
   git checkout develop
   git pull
   git checkout -b feature/deine-neue-funktion
   ```

2. **Änderungen implementieren**
   - Halte die Code-Struktur einheitlich
   - Füge Kommentare für komplexe Logik hinzu
   - Stelle sicher, dass keine Konsolenwarnungen oder -fehler auftreten

3. **Testabdeckung**
   - Manuelles Testen der geänderten Funktionalität
   - Automatisierte Tests für kritische Geschäftslogik hinzufügen (wenn möglich)

4. **Commit-Nachrichten**
   ```
   feat: Neue Routine-Feature für wöchentliche Erinnerungen
   
   - Implementiert neuen Frequency-Typ "weekly"
   - Fügt UI-Komponenten für Wochentagsauswahl hinzu
   - Aktualisiert Dokumentation
   ```

5. **Pull-Request erstellen**
   - Erstelle einen PR gegen den `develop`-Branch
   - Beschreibe die Änderungen detailliert
   - Referenziere relevante Issues mit `#123`

## Codierungs-Richtlinien

### Allgemeine Struktur

- Verwende TypeScript für alle neuen Dateien
- Halte Komponenten klein und fokussiert
- Benenne Dateien konsistent (PascalCase für Komponenten)

### React-Komponenten

- Funktionskomponenten mit Hooks bevorzugen
- Props-Interfaces klar definieren
- Verwende shadcn/ui-Komponenten, wo sinnvoll

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function CustomButton({ 
  label, 
  onClick, 
  disabled = false 
}: ButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
```

### API-Routen

- Klare Fehlerbehandlung implementieren
- Konsistente Antwortformate verwenden
- Validierung für alle eingehenden Daten

```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validierung
    if (!data.requiredField) {
      return NextResponse.json(
        { error: 'requiredField fehlt' }, 
        { status: 400 }
      );
    }
    
    // Verarbeitung
    const result = await processData(data);
    
    // Antwort
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
```

### Electron

- Verwende die Electron-Bridge für Kommunikation
- IPC-Events klar benennen und dokumentieren
- Sicherheit beachten (keine direkten Node.js-Importe im Renderer)

## Dokumentation

- Aktualisiere die README.md bei wichtigen Änderungen
- Füge JSDoc-Kommentare zu Funktionen hinzu
- Halte die Dokumentation im `docs`-Verzeichnis aktuell

## Fehlerbehebung bei häufigen Entwicklungsproblemen

### App startet nicht

```powershell
# Prozesse beenden
taskkill /F /IM node.exe /T
taskkill /F /IM electron.exe /T

# Cache leeren
npm cache clean --force
npm install

# Neu starten
npm run dev:electron
```

### Fehler beim Bauen der App

```powershell
# Next.js Cache leeren
rm -r -fo ./.next

# Neu bauen
npm run build
```

## Kontakt

Bei Fragen oder Problemen wende dich an das Entwicklungsteam.
