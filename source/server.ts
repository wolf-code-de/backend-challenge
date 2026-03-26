import * as https from "node:https";
import * as fs from "node:fs";
import { AnalyzeResult } from "./analyze";

/**
 * Startet einen HTTPS-Server, der das Analyse-Ergebnis als JSON zurückgibt.
 *
 * @param result Das vollständige AnalyzeResult-Objekt.
 * @param port Der Port des Servers, default 3000. Sollte bei einem echten Server in einer .env Datei stehen.
 */
export function startServer(result: AnalyzeResult, port: number = 3000): void {
  const options = {
    key: fs.readFileSync("localhost.key"),
    cert: fs.readFileSync("localhost.crt"),
  };

  const server = https.createServer(options, (req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ solutionWord: result.solutionWord }));
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }
  });


  server.listen(port, () => {
    console.log(`Server läuft auf https://localhost:${port}`);
  });
}
