#!/bin/sh
# GartenMeister NAS-Server Neustart
# Deployment: /volume1/Gurktaler/gartenmeister/nas/restart-server.sh
# Im DSM Aufgabenplaner als root-Benutzer einrichten

SERVER_JS="/volume1/Gurktaler/gartenmeister/nas/server-gartenmeister.js"
LOG_FILE="/volume1/Gurktaler/gartenmeister/server.log"
PORT=3003
NODE="/volume1/@appstore/Node.js_v20/usr/local/bin/node"

echo "$(date): Starte Neustart..." >> "$LOG_FILE"

# Schritt 1: Port freigeben (zuverlässiger als grep/kill)
fuser -k ${PORT}/tcp 2>/dev/null && echo "$(date): Port $PORT freigegeben." >> "$LOG_FILE"
sleep 2

# Schritt 2: Prüfen ob Port wirklich frei
if fuser ${PORT}/tcp 2>/dev/null; then
  echo "$(date): WARNUNG: Port $PORT noch belegt, erzwinge Kill..." >> "$LOG_FILE"
  fuser -k -9 ${PORT}/tcp 2>/dev/null
  sleep 2
fi

# Schritt 3: Server starten
cd /volume1/Gurktaler/gartenmeister/nas
nohup "$NODE" "$SERVER_JS" >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$(date): Server gestartet (PID $SERVER_PID)" >> "$LOG_FILE"

# Schritt 4: Kurz warten und Status prüfen
sleep 3
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "$(date): ✅ Server läuft (PID $SERVER_PID)" >> "$LOG_FILE"
else
  echo "$(date): ❌ Server-Start fehlgeschlagen!" >> "$LOG_FILE"
fi
