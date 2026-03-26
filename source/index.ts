import { decrypt } from "./decrypt";
import { decompress } from "./decompress";
import { analyze } from "./analyze";
import { startServer } from "./server";

async function main() {
  // Aufgabe 1: Entschlüsseln per Stream
  console.log("Entschlüssle");
  const intermediatePath = "secret.dec.gz";
  await decrypt(intermediatePath);

  // Aufgabe 1: Entpacken per Stream
  console.log("Entpacke");
  await decompress(intermediatePath, "decrypted.txt");
  console.log("Entpackt nach decrypted.txt");

  // Aufgabe 2-4: Analyse
  console.log("Analysiere");
  const result = await analyze("decrypted.txt");

  console.log("Aufgabe 2 Ziffernsumme:", result.digitSum);
  console.log("Aufgabe 3 Vokalesumme:", result.vokalSum);
  console.log("Aufgabe 3 Gesamt:", result.totalSum);
  console.log(
    "Aufgabe 4 Top 10 Satzsummen (in Reihenfolge):",
    result.top10InOrder,
  );
  console.log("Aufgabe 4 Nach Indexsubtraktion:", result.top10AfterSubtraction);
  console.log("Aufgabe 4 Lösungswort:", result.solutionWord);



  // Aufgabe 4c: Server starten
  console.log("Starte Server");
  startServer(result);
}

main();
