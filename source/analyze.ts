import * as fs from "node:fs";

// ─── Typen ───────────────────────────────────────────────────────────

interface SentenceEntry {
  /** Summe aller Ziffernwerte innerhalb dieses Satzes. */
  digitSum: number;
  /** Position des Satzes im Text (0-basiert), um die Originalreihenfolge wiederherstellen zu können. */
  sentenceIndex: number;
}

export interface AnalyzeResult {
  /** Aufgabe 2: Summe aller einzelnen Ziffern im gesamten Text. */
  digitSum: number;
  /** Aufgabe 3: Summe aller Vokal-Wertigkeiten (a=2, e=4, i=8, o=16, u=32). */
  vokalSum: number;
  /** Aufgabe 2+3 kombiniert: digitSum + vokalSum. */
  totalSum: number;
  /** Aufgabe 4a: Die Ziffernsummen der Top-10-Sätze, sortiert nach Textreihenfolge. */
  top10InOrder: number[];
  /** Aufgabe 4b: Jeder Wert aus top10InOrder minus seinem Index (0..9). */
  top10AfterSubtraction: number[];
  /** Aufgabe 4b: Die subtrahierten Werte als ASCII-Zeichen interpretiert ergeben das Lösungswort. */
  solutionWord: string;
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────

/**
 * Vokal-Wertigkeiten laut Aufgabenstellung.
 * Jeder Vokal hat einen festen Punktwert, Groß-/Kleinschreibung spielt keine Rolle.
 */
const VOKAL_VALUES = new Map<number, number>([
  ["a".charCodeAt(0), 2],
  ["A".charCodeAt(0), 2],
  ["e".charCodeAt(0), 4],
  ["E".charCodeAt(0), 4],
  ["i".charCodeAt(0), 8],
  ["I".charCodeAt(0), 8],
  ["o".charCodeAt(0), 16],
  ["O".charCodeAt(0), 16],
  ["u".charCodeAt(0), 32],
  ["U".charCodeAt(0), 32],
]);

/** Prüft ob das Byte eine ASCII-Ziffer (0-9) ist. */
function isDigit(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

/** Wandelt ein ASCII-Ziffern-Byte in seinen numerischen Wert um (z.B. 0x31 → 1). */
function digitValue(byte: number): number {
  return byte - 0x30;
}

/** Gibt die Vokal-Wertigkeit für ein Byte zurück, oder 0 wenn es kein Vokal ist. */
function vokalValue(byte: number): number {
  return VOKAL_VALUES.get(byte) ?? 0;
}

/** Prüft ob das Byte ein Satzende-Zeichen ist (Punkt, Ausrufezeichen oder Fragezeichen). */
function isSentenceEnd(byte: number): boolean {
  return byte === 0x2e || byte === 0x21 || byte === 0x3f;
}

/**
 * Hält ein Ranking der Sätze mit den höchsten Ziffernsummen aktuell.
 *
 * Solange das Ranking noch nicht voll ist, wird der Kandidat einfach hinzugefügt.
 * Ist es voll, wird der schwächste Eintrag gesucht und nur dann ersetzt,
 * wenn der neue Kandidat eine höhere Ziffernsumme hat.
 *
 * So behalten wir immer die stärksten Sätze, ohne den gesamten Text im Speicher zu halten.
 */
function updateHighestSentenceRanking(
  ranking: SentenceEntry[],
  candidate: SentenceEntry,
  maxRankingSize: number,
): void {
  if (ranking.length < maxRankingSize) {
    ranking.push(candidate);
    return;
  }

  let weakestIndex = 0;
  for (let i = 1; i < ranking.length; i++) {
    if (ranking[i].digitSum < ranking[weakestIndex].digitSum) {
      weakestIndex = i;
    }
  }

  if (candidate.digitSum > ranking[weakestIndex].digitSum) {
    ranking[weakestIndex] = candidate;
  }
}

/**
 * Baut aus den Top-10-Sätzen (bereits in Textreihenfolge sortiert) das Lösungswort.
 *
 * Jede Ziffernsumme wird um ihren Index (0-9) reduziert.
 * Die resultierenden Zahlen werden als ASCII-Codes interpretiert
 * und ergeben aneinandergereiht das Lösungswort.
 */
function buildSolutionFromRanking(sortedRanking: SentenceEntry[]) {
  const top10InOrder: number[] = [];
  const top10AfterSubtraction: number[] = [];
  let solutionWord = "";

  for (let i = 0; i < sortedRanking.length; i++) {
    const originalDigitSum = sortedRanking[i].digitSum;
    const adjustedValue = originalDigitSum - i;

    top10InOrder.push(originalDigitSum);
    top10AfterSubtraction.push(adjustedValue);
    solutionWord += String.fromCharCode(adjustedValue);
  }

  return { top10InOrder, top10AfterSubtraction, solutionWord };
}

// ─── Hauptfunktion ───────────────────────────────────────────────────

/**
 * Liest die entschlüsselte Datei als Stream und löst Aufgabe 2, 3 und 4
 * in einem einzigen Durchlauf:
 *
 * - Aufgabe 2: Summiert alle einzelnen Ziffern im Text.
 * - Aufgabe 3: Summiert die Wertigkeiten aller Vokale.
 * - Aufgabe 4: Ermittelt die 10 Sätze mit den höchsten Ziffernsummen,
 *              sortiert sie nach Textreihenfolge und leitet daraus das Lösungswort ab.
 *
 * Durch Streaming wird auch bei sehr großen Dateien kaum Speicher verbraucht.
 */
export async function analyze(filePath: string): Promise<AnalyzeResult> {
  const totalBytes = fs.statSync(filePath).size;
  let bytesProcessed = 0;

  const stream = fs.createReadStream(filePath, {
    highWaterMark: 4 * 1024 * 1024,
  });

  // Aufgabe 2: Laufende Summe aller Ziffern im gesamten Text
  let totalDigitSum = 0;

  // Aufgabe 3: Laufende Summe aller Vokal-Wertigkeiten
  let totalVokalSum = 0;

  // Aufgabe 4: Ziffernsumme des aktuellen Satzes und Satzzähler
  let currentSentenceDigitSum = 0;
  let sentenceCount = 0;

  // Die 10 Sätze mit den höchsten Ziffernsummen (wird laufend aktualisiert)
  const highestSentenceRanking: SentenceEntry[] = [];

  for await (const chunk of stream) {
    const buffer = chunk as Buffer;
    bytesProcessed += buffer.length;

    const percent = ((bytesProcessed / totalBytes) * 100).toFixed(1);
    process.stdout.write(`\r  Fortschritt: ${percent}%`);

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];

      // Ziffer gefunden → zur Gesamtsumme und zur aktuellen Satzsumme addieren
      if (isDigit(byte)) {
        const val = digitValue(byte);
        totalDigitSum += val;
        currentSentenceDigitSum += val;
      }

      // Vokal-Wertigkeit addieren (0 wenn kein Vokal)
      totalVokalSum += vokalValue(byte);

      // Satzende erreicht → aktuellen Satz ins Ranking einspeisen und zurücksetzen
      if (isSentenceEnd(byte)) {
        updateHighestSentenceRanking(
          highestSentenceRanking,
          { digitSum: currentSentenceDigitSum, sentenceIndex: sentenceCount },
          10,
        );
        currentSentenceDigitSum = 0;
        sentenceCount++;
      }
    }
  }

  process.stdout.write("\n");

  // Ranking zurück in die ursprüngliche Textreihenfolge bringen
  highestSentenceRanking.sort((a, b) => a.sentenceIndex - b.sentenceIndex);

  const solution = buildSolutionFromRanking(highestSentenceRanking);

  return {
    digitSum: totalDigitSum,
    vokalSum: totalVokalSum,
    totalSum: totalDigitSum + totalVokalSum,
    ...solution,
  };
}
