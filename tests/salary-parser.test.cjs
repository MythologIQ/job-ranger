const assert = require("assert");
const { parseSalary } = require("../electron/salary-parser.cjs");

// Range formats
assert.deepStrictEqual(
  parseSalary("$100,000 - $150,000 per year"),
  { min: 100000, max: 150000, currency: "USD", period: "year", raw: "$100,000 - $150,000" }
);

assert.deepStrictEqual(
  parseSalary("100k-150k annually"),
  { min: 100000, max: 150000, currency: "USD", period: "year", raw: "100k-150k" }
);

assert.deepStrictEqual(
  parseSalary("$80K to $120K"),
  { min: 80000, max: 120000, currency: "USD", period: "year", raw: "$80K to $120K" }
);

// Single values
assert.deepStrictEqual(
  parseSalary("Salary: $120,000"),
  { min: 120000, max: 120000, currency: "USD", period: "year", raw: "$120,000" }
);

assert.deepStrictEqual(
  parseSalary("$150k per year"),
  { min: 150000, max: 150000, currency: "USD", period: "year", raw: "$150k" }
);

// Currency detection
assert.strictEqual(parseSalary("\u20AC50,000 - \u20AC70,000")?.currency, "EUR");
assert.strictEqual(parseSalary("\u00A340,000 - \u00A360,000")?.currency, "GBP");
assert.strictEqual(parseSalary("CAD 80,000 - 100,000")?.currency, "CAD");
assert.strictEqual(parseSalary("AUD 90,000 - 120,000")?.currency, "AUD");

// Period detection
assert.strictEqual(parseSalary("$5,000 monthly")?.period, "month");
assert.strictEqual(parseSalary("$45/hour")?.period, "hour");
assert.strictEqual(parseSalary("$100,000 p.a.")?.period, "year");

// Edge cases
assert.strictEqual(parseSalary(null), null);
assert.strictEqual(parseSalary(undefined), null);
assert.strictEqual(parseSalary(""), null);
assert.strictEqual(parseSalary("No salary mentioned"), null);
assert.strictEqual(parseSalary("Competitive compensation"), null);

console.log("All salary-parser tests passed!");
