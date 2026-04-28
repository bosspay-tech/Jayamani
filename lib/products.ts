import fs from "node:fs";
import path from "node:path";

export type Product = {
  id: string;
  name: string;
  image: string;
  categories: string;
  regularPrice: number | null;
  salePrice: number | null;
  priceLabel: string;
  discount: number | null;
};

type Row = Record<string, string>;

let cache: Product[] | null = null;

export function getProducts(): Product[] {
  if (cache) {
    return cache;
  }

  const file = path.join(process.cwd(), "products.csv");
  const csv = fs.readFileSync(file, "utf8");
  const rows = parseCsv(csv);

  cache = rows
    .map((row, index) => toProduct(row, index))
    .filter((product): product is Product => Boolean(product?.name && product.image));

  return cache;
}

export function getShopProducts(): Product[] {
  const preferredNames = [
    "Abstract Blue Print Oversized T-Shirt",
    "ADRO Men's 100% Cotton Regular Fit T-Shirt",
    "ADRO Men's Cotton Regular Fit T-Shirt",
    "Aervolt ShadowFit Varsity Jacket",
    "Amber Modal Co-ord Set",
    "AMETHYST GALAXY COCKTAIL SAREE",
    "Antara-Pink Banarasi Silk Saree",
    "Aqua Dive Gown",
    "Aspen Over-Sized Sweater",
    "Aurelian Edge Structured Luxe Jacket",
    "Avocet Modal Shirt",
  ];

  const products = getProducts();
  const chosen = preferredNames
    .map((name) => products.find((product) => product.name.toLowerCase().includes(name.toLowerCase())))
    .filter((product): product is Product => Boolean(product));
  const chosenIds = new Set(chosen.map((product) => product.id));
  const rest = products.filter((product) => !chosenIds.has(product.id));

  return [...chosen, ...rest];
}

export function getCategoryCounts() {
  const counts = new Map<string, number>();

  for (const product of getProducts()) {
    const parts = product.categories
      .split(",")
      .map((part) => part.trim().split(">").pop()?.trim())
      .filter((part): part is string => Boolean(part));

    for (const part of new Set(parts)) {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .filter((category) => category.name !== "")
    .sort((a, b) => b.count - a.count);
}

function toProduct(row: Row, index: number): Product | null {
  const image = firstImage(row.Images);
  const regularPrice = parsePrice(row["Regular price"]);
  const salePrice = parsePrice(row["Sale price"]);
  const discount =
    regularPrice && salePrice && salePrice < regularPrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : null;

  return {
    id: row.ID || `${index}`,
    name: row.Name?.trim() ?? "",
    image,
    categories: row.Categories ?? "",
    regularPrice,
    salePrice,
    priceLabel: formatPrice(regularPrice, salePrice),
    discount,
  };
}

function firstImage(value = "") {
  return value
    .split(",")
    .map((image) => image.trim())
    .find((image) => image.startsWith("http")) ?? "";
}

function parsePrice(value = "") {
  const clean = value.replace(/,/g, "").trim();
  if (!clean) {
    return null;
  }

  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function formatPrice(regular: number | null, sale: number | null) {
  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  if (regular && sale && sale < regular) {
    return `${money(sale)} - ${money(regular)}`;
  }

  if (sale) {
    return money(sale);
  }

  if (regular) {
    return money(regular);
  }

  return "₹0.00";
}

function parseCsv(csv: string): Row[] {
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
    headers.reduce<Row>((record, header, index) => {
      record[header] = dataRow[index] ?? "";
      return record;
    }, {}),
  );
}
