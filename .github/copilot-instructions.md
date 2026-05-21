<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Dieses Projekt ist eine Electron-basierte Windows Desktop App, die die Funktionalität, das Layout, die Farben und die Logik des alten GartenMeister-Projekts übernimmt. Bitte beachte beim Generieren von Code, dass bestehende Strukturen, Styles und Logik erhalten bleiben sollen.

## Automatische Todo-Aktualisierung

**Bei jeder neuen Konversation** (also beim ersten User-Prompt in einem neuen Chat):
1. Lies `TODOLIST.md`, `PORTABLE_EXE_ROADMAP.md` und `VISUALISIERUNG_NEU_ANALYSE.md`
2. Prüfe den aktuellen Git-Branch (`git branch`)
3. Aktualisiere `TODOLIST.md` automatisch wenn sich der Stand geändert hat:
   - Abgehakte Punkte aus der Roadmap als `[x]` markieren
   - Neu erledigte Schritte in den "Erledigt"-Abschnitt verschieben
   - Aktiven Branch und Datum im Header aktualisieren
4. Tue dies **ohne explizite Aufforderung** – einfach still im Hintergrund erledigen und kurz erwähnen falls etwas aktualisiert wurde.

**Credo des Projekts:** Kleine Schritte, einzeln abarbeiten, bestehende Strukturen erhalten.
