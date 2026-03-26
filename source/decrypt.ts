import * as fs from "node:fs";
import * as crypto from "node:crypto";
import { pipeline } from "node:stream/promises";

/**
 * Entschlüsselt die Datei "secret.enc" per Stream und schreibt das Ergebnis in eine Datei.
 *
 * @param outPath Der Pfad zur Ausgabedatei (die Datei ist nach wie vor gzip-komprimiert).
 * @returns Ein Promise, das nach Abschluss aufgelöst wird.
 */
export async function decrypt(outPath: string): Promise<void> {
  // Aufgabe 1: Dateien einlesen
  const keyBuffer = fs.readFileSync("secret.key", "utf8").trim();
  const key = keyBuffer.substring(0, 32);

  const iv = fs.readFileSync("iv.txt");
  const authTag = fs.readFileSync("auth.txt");

  // AES-256-GCM Decipher konfigurieren
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const input = fs.createReadStream("secret.enc");
  const output = fs.createWriteStream(outPath);

  let decryptedBytes = 0;
  decipher.on("data", (chunk: Buffer) => {
    decryptedBytes += chunk.length;
    process.stdout.write(`\r  Entschlüsselt: ${decryptedBytes} Bytes`);
  });

  try {
    // Pipeline: Input -> Decipher -> Output

    await pipeline(input, decipher, output);

    console.log(" Entschlüsselung erfolgreich");
  } catch (err) {
    console.error(" Entschlüsselung fehlgeschlagen:", err);
    throw err;
  }
}
