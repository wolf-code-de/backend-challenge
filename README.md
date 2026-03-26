# Node.js Streaming Challenge

Dieses Projekt implementiert eine Pipeline zur Verarbeitung einer verschlüsselten und komprimierten 6-Gigabyte-Datei unter Verwendung von Node.js-Streams.

## Funktionsumfang

- **Streaming**: Die Verarbeitung erfolgt vollständig über Streams (Entschlüsselung, Entpacken und Analyse), wodurch der Arbeitsspeicherbedarf unabhängig von der Dateigröße konstant bleibt.
- **Analyse**: Berechnung von Ziffernsummen und Vokal-Wertigkeiten in einem Durchgang. Ermittlung der 10 Sätze mit den höchsten Ziffernsummen über ein Ranking-System.
- **Server**: HTTPS-Server zur Auslieferung des Ergebnisses als JSON.

## Voraussetzungen

- Node.js Version 24.
- npm.

## Installation und Ausführung

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Projekt starten:
   ```bash
   npm start
   ```
   Dieser Befehl führt die Entschlüsselung von `secret.enc`, das Entpacken der Daten, die Textanalyse und den Start des Servers aus.

## Projektübersicht

- `source/index.ts`: Koordination der einzelnen Schritte.
- `source/decrypt.ts`: Entschlüsselung (AES-256-CBC).
- `source/decompress.ts`: Dekomprimierung (Gzip).
- `source/analyze.ts`: Textanalyse und Ranking-Logik.
- `source/server.ts`: HTTPS-Server-Implementierung.

## API

Der Server ist unter `https://localhost:3000` erreichbar. Die Zertifikate liegen im Hauptverzeichnis bei.

**Schnittstellen-Response:**
```json
{
  "solutionWord": "..."
}
```
