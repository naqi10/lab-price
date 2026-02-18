import ExcelJS from "exceljs";

/**
 * Represents a single test entry parsed from a price list file.
 */
export interface ParsedTest {
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  description: string | null;
  turnaroundTime: string | null;
  tubeType: string | null;
}

/**
 * Parse an Excel file (.xlsx / .xls) and extract test entries.
 *
 * Expected column layout (flexible – the parser attempts to detect columns
 * by header keywords):
 *   - Name / Désignation / Analyse
 *   - Code / Réf
 *   - Category / Catégorie / Rubrique
 *   - Price / Prix / Tarif
 *   - Unit / Unité
 *   - Description
 *
 * @param buffer - The file content as a Buffer
 * @returns Array of parsed test entries
 */
export async function parseExcelFile(buffer: Buffer): Promise<ParsedTest[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const tests: ParsedTest[] = [];
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Le fichier Excel ne contient aucune feuille de calcul");
  }

  // Detect column indices from header row
  const headerRow = worksheet.getRow(1);
  const columnMap = detectColumns(headerRow);

  if (!columnMap.name || !columnMap.price) {
    throw new Error(
      "Impossible de détecter les colonnes requises (nom et prix). " +
        "Vérifiez que la première ligne contient les en-têtes."
    );
  }

  // Iterate data rows (skip header)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const name = getCellString(row, columnMap.name!);
    const priceValue = getCellNumber(row, columnMap.price!);

    // Skip rows without a name or price
    if (!name || priceValue === null || priceValue <= 0) return;

    tests.push({
      name: name.trim(),
      code: columnMap.code ? getCellString(row, columnMap.code) : null,
      category: columnMap.category
        ? getCellString(row, columnMap.category)
        : null,
      price: priceValue,
      unit: columnMap.unit ? getCellString(row, columnMap.unit) : null,
      description: columnMap.description
        ? getCellString(row, columnMap.description)
        : null,
      turnaroundTime: columnMap.turnaroundTime
        ? getCellString(row, columnMap.turnaroundTime)
        : null,
      tubeType: columnMap.tubeType
        ? getCellString(row, columnMap.tubeType)
        : null,
    });
  });

  if (tests.length === 0) {
    throw new Error("Aucun test valide trouvé dans le fichier Excel");
  }

  return tests;
}

/**
 * Parse a PDF file and extract test entries.
 *
 * Uses pdf-parse to extract raw text, then applies regex patterns
 * to identify test names and prices. This is inherently fragile for
 * PDFs with unusual layouts – manual review is recommended.
 *
 * @param buffer - The file content as a Buffer
 * @returns Array of parsed test entries
 */
export async function parsePdfFile(buffer: Buffer): Promise<ParsedTest[]> {
  // Dynamic import to avoid issues with pdf-parse in certain bundling contexts
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = (await import("pdf-parse" as string)) as any;
  const pdfData = await pdfParse(buffer);

  const text = pdfData.text;
  const tests = extractTestsFromData(text);

  if (tests.length === 0) {
    throw new Error(
      "Aucun test valide trouvé dans le fichier PDF. " +
        "Le format du PDF n'est peut-être pas compatible avec l'extraction automatique."
    );
  }

  return tests;
}

/**
 * Extract test entries from raw text data (typically from a PDF).
 *
 * The function tries multiple regex patterns to accommodate different
 * PDF formats commonly used by Moroccan laboratories.
 *
 * @param text - Raw text content extracted from a PDF
 * @returns Array of parsed test entries
 */
export function extractTestsFromData(text: string): ParsedTest[] {
  const tests: ParsedTest[] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  // Pattern 1: "Test Name ... 123,45" or "Test Name ... 123.45"
  // Common in tabular PDF layouts where columns are separated by whitespace
  const pricePattern = /^(.+?)\s+([\d\s]+[.,]\d{2})\s*(?:MAD|DH)?\s*$/i;

  // Pattern 2: "Code | Test Name | Price"
  const tabulatedPattern =
    /^([A-Z0-9-]+)\s*[|\t]\s*(.+?)\s*[|\t]\s*([\d\s]+[.,]\d{2})/i;

  let currentCategory: string | null = null;

  for (const line of lines) {
    // Detect category headers (lines in ALL CAPS without a price)
    if (
      line === line.toUpperCase() &&
      line.length > 3 &&
      line.length < 80 &&
      !/\d+[.,]\d{2}/.test(line)
    ) {
      currentCategory = line;
      continue;
    }

    // Try tabulated pattern first (more specific)
    let match = tabulatedPattern.exec(line);
    if (match) {
      tests.push({
        name: match[2].trim(),
        code: match[1].trim(),
        category: currentCategory,
        price: parsePrice(match[3]),
        unit: null,
        description: null,
        turnaroundTime: null,
        tubeType: null,
      });
      continue;
    }

    // Fall back to simple price pattern
    match = pricePattern.exec(line);
    if (match) {
      tests.push({
        name: match[1].trim(),
        code: null,
        category: currentCategory,
        price: parsePrice(match[2]),
        unit: null,
        description: null,
        turnaroundTime: null,
        tubeType: null,
      });
    }
  }

  return tests;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ColumnMap {
  name: number | null;
  code: number | null;
  category: number | null;
  price: number | null;
  unit: number | null;
  description: number | null;
  turnaroundTime: number | null;
  tubeType: number | null;
}

/** Header keyword sets for column detection (case-insensitive) */
const COLUMN_KEYWORDS: Record<keyof ColumnMap, string[]> = {
  name: ["nom", "name", "désignation", "designation", "analyse", "test", "libellé", "libelle"],
  code: ["code", "réf", "ref", "référence", "reference", "id"],
  category: ["catégorie", "categorie", "category", "rubrique", "famille", "section"],
  price: ["prix", "price", "tarif", "montant", "coût", "cout"],
  unit: ["unité", "unite", "unit"],
  description: ["description", "détail", "detail", "commentaire", "note"],
  turnaroundTime: ["délai", "delai", "turnaround", "tat", "durée", "duree", "temps", "délais", "delais"],
  tubeType: ["tube", "échantillon", "echantillon", "sample", "prélèvement", "prelevement", "type d'échantillon", "type d'echantillon", "type échantillon", "type echantillon"],
};

function detectColumns(headerRow: ExcelJS.Row): ColumnMap {
  const map: ColumnMap = {
    name: null,
    code: null,
    category: null,
    price: null,
    unit: null,
    description: null,
    turnaroundTime: null,
    tubeType: null,
  };

  headerRow.eachCell((cell, colNumber) => {
    const value = String(cell.value ?? "").toLowerCase().trim();
    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      if (keywords.some((kw) => value.includes(kw))) {
        (map as unknown as Record<string, number | null>)[field] = colNumber;
      }
    }
  });

  return map;
}

function getCellString(
  row: ExcelJS.Row,
  colNumber: number
): string | null {
  const cell = row.getCell(colNumber);
  const value = cell.value;
  if (value === null || value === undefined) return null;
  return String(value).trim() || null;
}

function getCellNumber(
  row: ExcelJS.Row,
  colNumber: number
): number | null {
  const cell = row.getCell(colNumber);
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a price string that may use comma as decimal separator
 * and spaces as thousands separators.
 */
function parsePrice(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  return parseFloat(cleaned);
}
