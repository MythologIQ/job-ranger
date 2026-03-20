export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string;
  period: "year" | "month" | "hour";
  raw: string;
}

const CURRENCY_PATTERNS: Record<string, RegExp> = {
  USD: /\$|USD|U\.S\.|US\s*dollars?/i,
  EUR: /\u20AC|EUR|euros?/i,
  GBP: /\u00A3|GBP|pounds?/i,
  CAD: /CA\$|CAD|canadian\s*dollars?/i,
  AUD: /AU\$|AUD|australian\s*dollars?/i,
};

const PERIOD_PATTERNS: Record<string, RegExp> = {
  year: /\b(year|yr|annual|p\.?a\.?|per\s*annum)\b/i,
  month: /\b(month|mo|monthly)\b/i,
  hour: /\b(hour|hr|hourly)\b/i,
};

function detectCurrency(text: string): string {
  for (const [code, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(text)) return code;
  }
  return "USD";
}

function detectPeriod(text: string): "year" | "month" | "hour" {
  for (const [period, pattern] of Object.entries(PERIOD_PATTERNS)) {
    if (pattern.test(text)) return period as "year" | "month" | "hour";
  }
  return "year";
}

function parseNumericValue(text: string): number | null {
  const cleaned = text.replace(/[$\u20AC\u00A3,\s]/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]?/);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (/[kK]/.test(cleaned)) value *= 1000;
  return isFinite(value) ? value : null;
}

export function parseSalary(text: string | null | undefined): ParsedSalary | null {
  if (!text) return null;

  const rangeMatch = text.match(
    /[$\u20AC\u00A3]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)\s*[-\u2013\u2014to]+\s*[$\u20AC\u00A3]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)/
  );

  if (rangeMatch) {
    return {
      min: parseNumericValue(rangeMatch[1]),
      max: parseNumericValue(rangeMatch[2]),
      currency: detectCurrency(text),
      period: detectPeriod(text),
      raw: rangeMatch[0],
    };
  }

  const singleMatch = text.match(
    /[$\u20AC\u00A3]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)/
  );

  if (singleMatch) {
    const value = parseNumericValue(singleMatch[1]);
    return {
      min: value,
      max: value,
      currency: detectCurrency(text),
      period: detectPeriod(text),
      raw: singleMatch[0],
    };
  }

  return null;
}
