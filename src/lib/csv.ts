export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

/**
 * Minimal CSV parser:
 * - Supports commas, quoted fields, escaped quotes ("")
 * - Supports CRLF/LF newlines
 * - Returns string values (no type conversion)
 */
export function parseCsvToObjects(csv: string): ParsedCsv {
  const text = (csv ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) return { headers: [], rows: [] };

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      cur.push(field);
      field = "";
      continue;
    }

    if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      continue;
    }

    field += ch;
  }

  cur.push(field);
  rows.push(cur);

  if (rows.length < 2) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim().replace(/^\uFEFF/, "")); // strip BOM
  const objs: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (cols.every((c) => String(c ?? "").trim() === "")) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cols[c] ?? "").trim();
    }
    objs.push(obj);
  }

  return { headers, rows: objs };
}


