export type CsvRow = Record<string, string>;

export function parseCsv(csv: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    headers.reduce<CsvRow>((record, header, index) => {
      record[header.replace(/^\uFEFF/, "")] = dataRow[index] ?? "";
      return record;
    }, {}),
  );
}

export function parsePrice(value = ""): number | null {
  const clean = value.replace(/,/g, "").trim();
  if (!clean) return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

export function parseStock(value = ""): number | null {
  const clean = value.replace(/,/g, "").trim();
  if (!clean) return null;
  const number = Number.parseInt(clean, 10);
  return Number.isFinite(number) ? number : null;
}

export function firstImage(value = ""): string {
  return (
    value
      .split(",")
      .map((image) => image.trim())
      .find((image) => image.startsWith("http")) ?? ""
  );
}

export function allImages(value = ""): string[] {
  return value
    .split(",")
    .map((image) => image.trim())
    .filter((image) => image.startsWith("http"));
}

export function cleanHtml(value = ""): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

type VariationPrice = {
  regularPrice: number | null;
  salePrice: number | null;
};

export function getVariationPrices(rows: CsvRow[]): Map<string, VariationPrice> {
  const prices = new Map<
    string,
    { regularPrices: number[]; salePrices: number[]; currentPrices: number[] }
  >();

  for (const row of rows) {
    if (row.Type !== "variation" || !row.Parent?.startsWith("id:")) {
      continue;
    }

    const parentId = row.Parent.replace("id:", "").trim();
    const regularPrice = parsePrice(row["Regular price"]);
    const salePrice = parsePrice(row["Sale price"]);
    const currentPrice = salePrice ?? regularPrice;

    if (!currentPrice || currentPrice <= 0) continue;

    const bucket = prices.get(parentId) ?? {
      regularPrices: [],
      salePrices: [],
      currentPrices: [],
    };
    bucket.currentPrices.push(currentPrice);

    if (regularPrice && regularPrice > 0) {
      bucket.regularPrices.push(regularPrice);
    }
    if (salePrice && salePrice > 0) {
      bucket.salePrices.push(salePrice);
    }

    prices.set(parentId, bucket);
  }

  return new Map(
    Array.from(prices, ([parentId, price]) => {
      const salePrice = price.salePrices.length
        ? Math.min(...price.salePrices)
        : null;
      const regularPrice = price.regularPrices.length
        ? Math.min(...price.regularPrices)
        : Math.min(...price.currentPrices);

      return [parentId, { regularPrice, salePrice }] as const;
    }),
  );
}
