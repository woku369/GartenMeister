Ich bevorzuge es, Antworten permanent in deutscher Sprache zu erhalten.

Geplante Änderungen sollten vorher in diese Datei eingetragen werden. Das Zurücksetzen der Netzwerkverbindung darf nicht dazu führen, dass von vorne begonnen werden muss. Dies stört den Workflow erheblich und macht eine Übersicht unmöglich.

# GartenMeister - App Funktionalität

Dieses Dokument beschreibt die Kernfunktionen und den aktuellen Entwicklungsstand der GartenMeister App. Es dient als Referenz und kann laufend ergänzt werden, um den Überblick über Änderungen und neue Features zu behalten.

## App-Name

GartenMeister

## Kernfunktionen

Basierend auf den ursprünglichen Anforderungen und den bisherigen Implementierungen:

1.  **Gartenbeete-Planung und -Verwaltung:**
    *   Verwaltung von bis zu 26 nummerierten Beeten.
    *   Beetnummern werden eindeutig vergeben.
    *   Beete können angelegt, bearbeitet und gelöscht werden.
    *   Unterstützung für verschiedene Beet-Typen:
        *   **Standard-Kräuterbeet**: Für etablierte Kräuter.
        *   **Versuchsbeet**: Für Experimente, unterstützt variable Längen und Breiten sowie eine detaillierte Segmentierung.
        *   **Blühstreifen**: Spezielle Auszeichnung für ökologische Zwecke.
        *   **Brachfläche**: Für Flächen, die pausieren.
    *   Für jedes Beet können spezifische Details erfasst werden (Typ, Maße, Bepflanzungsdatum, Bemerkungen, Farbe für Visualisierung).
    *   Die Länge für Standardbeete, Blühstreifen und Brachflächen ist auf 43 Meter fixiert, während Versuchsbeete eine variable Länge haben können.

2.  **Segmentverwaltung für Versuchsbeete:**
    *   Versuchsbeete können in mehrere Segmente unterteilt werden.
    *   Für jedes Segment können detaillierte Informationen erfasst werden:
        *   Segmentlänge
        *   Zugeordnete Kräutersorte (inkl. Untersorte)
        *   Pflanzen pro Laufmeter
        *   Prozentsatz ertragsfähiger Pflanzen
        *   Eigenes Pflanzdatum für das Segment
        *   Bemerkungen zum Segment

3.  **Kräutersorten-Datenbank:**
    *   Erfassung und Verwaltung von Kräutersorten.
    *   Feste Standardsorten (z.B. Thymian, Oregano, Salbei) sind vordefiniert.
    *   Benutzer können neue Kräutersorten hinzufügen, inklusive einer optionalen Farbe für die Visualisierung.
    *   Diese Farben werden in der Gartenübersicht für Beete und Segmente verwendet.

4.  **Globaler Ernte-Workflow:**
    *   Initiierung eines Erntevorgangs global (nicht pro einzelnem Beet).
    *   **Schritt 1: Auswahl & Zeitraum:**
        *   Auswahl der zu erntenden Kräutersorte.
        *   Festlegung eines Erntedatums oder eines Erntezeitraums (Start- und optionales Enddatum).
    *   **Schritt 2: Produktivitätsanpassung:**
        *   Anzeige aller Beete/Segmente, die die ausgewählte Kräutersorte enthalten.
        *   Für jedes dieser Beete/Segmente kann der Prozentsatz der ertragsfähigen Pflanzen *spezifisch für diesen Ernteschnitt* angepasst werden.
        *   Diese Anpassung aktualisiert auch den aktuellen Prozentsatz ertragsfähiger Pflanzen direkt auf dem Beet/Segment für zukünftige Referenz (z.B. Pflanzeninventur).
    *   **Schritt 3: Ertragsdatenerfassung:**
        *   Erfassung der **Gesamt-Erntemenge (kg)** für die ausgewählte Kräutersorte über alle beteiligten Beete/Segmente für diesen Erntevorgang.
        *   Optionale Bemerkungen zum gesamten Erntevorgang.
    *   Das Ziel ist es, Berichte über "kg pro Sorte und Schnitt" zu ermöglichen.

5.  **Grafische Beet-Repräsentation (Gartenübersicht):**
    *   Visuelle Darstellung aller 26 Beet-Positionen.
    *   Belegte Beete werden in ihrer zugewiesenen Farbe dargestellt.
    *   Unbelegte Beete haben eine Standardfarbe.
    *   Versuchsbeete zeigen ihre Segmente farblich differenziert an, basierend auf der Farbe der jeweiligen Kräutersorte im Segment und proportional zur Segmentlänge. Unbelegter Platz im Versuchsbeet wird ebenfalls dargestellt.
    *   Anzeige der Beetnummer und des Pflanzenalters (in Jahren) in der Listenansicht der Beete.

6.  **Berichte (in Überarbeitung):**
    *   Die Berichtsseite (`/reports`) wird überarbeitet, um abgeschlossene Ernte-Events (`HarvestEvent`) anzuzeigen.
    *   Für jeden Ernte-Event werden die Kräutersorte, der Erntezeitraum, der Gesamtertrag (kg) und optionale Bemerkungen dargestellt.
    *   Details zu den beitragenden Beeten/Segmenten und deren Produktivität zum Erntezeitpunkt sind als ausklappbare Informationen geplant.
    *   Das Hauptziel ist die Darstellung von "kg pro Sorte und Schnitt".

## UI Stil-Richtlinien

*   **Primärfarbe**: Sanftes Grün (`#8FBC8F`)
*   **Hintergrundfarbe**: Helles Grün (`#E0EEE0`)
*   **Akzentfarbe**: Erdiges Braun (`#A0522D`)
*   Die Farbwerte sind in `src/app/globals.css` als HSL CSS-Variablen für das ShadCN-Theme definiert.

## Zukünftige Erweiterungen / Hinweise

*   **PDF-Export**: Ein Button für den PDF-Export von Berichten ist in der UI (auf der Gartenübersichtsseite und Berichtsseite) vorhanden und mit "Als PDF exportieren" beschriftet, aber die Funktionalität ist noch nicht implementiert. Bei Klick wird ein Toast angezeigt, der darüber informiert.
*   **Bearbeitung von Ernte-Events**: Eine Funktion zum nachträglichen Bearbeiten abgeschlossener Ernte-Events (z.B. Korrektur der Gesamtmenge) ist noch nicht implementiert.
*   **Pflanzeninventur**: Eine dedizierte Funktion zur globalen Anpassung der Produktivitätsprozentsätze im Frühjahr.

---
*Dieses Dokument kann laufend aktualisiert werden, um neue Funktionen oder Änderungen festzuhalten. Es empfiehlt sich, bei größeren Änderungen das Datum der Aktualisierung zu vermerken.*
Letzte Aktualisierung: 2024-07-15 (Neuer Ernte-Workflow und Berichtsseite)

