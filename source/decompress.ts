import * as fs from "node:fs";
import * as zlib from "node:zlib";
import { pipeline } from "node:stream/promises";

/**
 * Entpackt eine gzip-komprimierte Datei per Stream und schreibt das Ergebnis in eine neue Datei.
 *
 * @param inPath Pfad zur komprimierten Datei.
 * @param outPath Pfad zur unkomprimierten Ausgabedatei (~6 GB).
 * @returns Ein Promise, das nach Abschluss aufgelöst wird.
 */
export async function decompress(inPath: string, outPath: string): Promise<void> {
  const input = fs.createReadStream(inPath);
  const gunzip = zlib.createGunzip();
  const output = fs.createWriteStream(outPath);

  let written = 0;
  gunzip.on("data", (chunk: Buffer) => {
    written += chunk.length;
    process.stdout.write(`\r  Entpackt: ${written} Bytes`);
  });

  try {
    // Pipeline: Datei -> Gunzip -> Datei
    await pipeline(input, gunzip, output);
    process.stdout.write("\n");
    console.log("  Entpacken erfolgreich beendet.");
  } catch (err) {
    process.stdout.write("\n");
    console.error("  Entpacken fehlgeschlagen:", err);
    throw err;
  }
}


