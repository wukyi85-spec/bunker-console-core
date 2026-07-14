// Fetches products live from Google Sheets via the Lovable connector gateway.
// Sheet: "B Bunker", Sheet1. Columns (row 1):
//   category | product_name | thc | indica | sativa | description | image_url
//   | 25g | 50g | 100g | stock | popular | new_drop | display_order
// Size cells hold the TOTAL PACK PRICE in THB.
import { createServerFn } from "@tanstack/react-start";

export interface SheetPackageSize {
  grams: number;
  label: string;
  totalPrice: number;
  pricePerGram: number;
}

export interface SheetProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  thc: number;
  indica: number;
  sativa: number;
  stockLabel: string;
  availability: "IN STOCK" | "LOW STOCK" | "OUT OF STOCK";
  popular: boolean;
  newDrop: boolean;
  displayOrder: number;
  sizes: SheetPackageSize[];
}

const SPREADSHEET_ID = "1kTOlpWLZ6HlAzV3kOOobaN-4aNuqsyFRCb4jWeTzs5M";
const RANGE = "SupplyRoom!A1:Z500";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets";

const SIZE_REGEX = /^(\d+(?:\.\d+)?)\s*g$/i;

function slugify(name: string, idx: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base ? `${base}-${idx}` : `p-${idx}`;
}

function toNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toBool(raw: string | undefined): boolean {
  if (!raw) return false;
  return ["true", "1", "yes", "y"].includes(raw.trim().toLowerCase());
}

function normalizeAvailability(
  stockLabel: string,
): "IN STOCK" | "LOW STOCK" | "OUT OF STOCK" {
  const s = stockLabel.trim().toLowerCase();
  if (!s) return "OUT OF STOCK";
  if (s.includes("out")) return "OUT OF STOCK";
  if (s.includes("low")) return "LOW STOCK";
  return "IN STOCK";
}

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetProduct[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!lovableKey || !sheetsKey) {
      throw new Error("Google Sheets connector not configured");
    }

    const url = `${GATEWAY}/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Sheets fetch failed [${res.status}]: ${body}`);
      throw new Error(`Sheets fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as { values?: string[][] };
    const rows = data.values ?? [];
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    const idx = {
      category: col("category"),
      name: col("product_name"),
      thc: col("thc"),
      indica: col("indica"),
      sativa: col("sativa"),
      description: col("description"),
      image: col("image_url"),
      stock: col("stock"),
      popular: col("popular"),
      newDrop: col("new_drop"),
      order: col("display_order"),
    };

    // Any header cell matching NNg is treated as a size column.
    const sizeCols: { colIndex: number; grams: number; label: string }[] = [];
    header.forEach((h, i) => {
      const m = h.match(SIZE_REGEX);
      if (m) {
        const grams = Number(m[1]);
        sizeCols.push({ colIndex: i, grams, label: `${grams}G` });
      }
    });
    sizeCols.sort((a, b) => a.grams - b.grams);

    const products: SheetProduct[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = (row[idx.name] ?? "").trim();
      if (!name) continue;

      const sizes: SheetPackageSize[] = [];
      for (const s of sizeCols) {
        const total = toNumber(row[s.colIndex]);
        if (total > 0) {
          sizes.push({
            grams: s.grams,
            label: s.label,
            totalPrice: total,
            pricePerGram: total / s.grams,
          });
        }
      }
      if (sizes.length === 0) continue;

      const stockLabel = (row[idx.stock] ?? "").trim();
      const category = (row[idx.category] ?? "products").trim() || "products";

      products.push({
        id: slugify(name, r),
        name: name.toUpperCase(),
        category: category.toLowerCase(),
        description: (row[idx.description] ?? "").trim(),
        image: (row[idx.image] ?? "").trim(),
        thc: toNumber(row[idx.thc]),
        indica: toNumber(row[idx.indica]),
        sativa: toNumber(row[idx.sativa]),
        stockLabel,
        availability: normalizeAvailability(stockLabel),
        popular: toBool(row[idx.popular]),
        newDrop: toBool(row[idx.newDrop]),
        displayOrder: toNumber(row[idx.order]),
        sizes,
      });
    }

    products.sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
    return products;
  },
);
