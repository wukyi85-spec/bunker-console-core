// Placeholder product catalog — swap for Supabase reads later.
// Keep shape stable so the UI does not need redesign when wired up.

export type ProductCategory = "products" | "special" | "accessories";

export interface PackageSize {
  grams: number;
  label: string;
  pricePerGram: number; // THB
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  strain: string;
  strainType: "Indica" | "Sativa" | "Hybrid";
  indicaPct: number;
  sativaPct: number;
  thcPct: number;
  description: string;
  availability: "IN STOCK" | "LOW STOCK" | "OUT OF STOCK";
  image?: string; // future: Supabase storage URL
  sizes: PackageSize[];
}

const S = (g: number, pricePerGram: number): PackageSize => ({
  grams: g,
  label: `${g}G`,
  pricePerGram,
});

export const CATEGORIES: { id: ProductCategory; label: string; hint: string }[] = [
  { id: "products", label: "Products", hint: "Standard supply" },
  { id: "special", label: "Special Products", hint: "Restricted issue" },
  { id: "accessories", label: "Accessories", hint: "Field kit" },
];

export const PRODUCTS: Product[] = [
  {
    id: "p-01",
    name: "GHOST HAZE",
    category: "products",
    strain: "Ghost OG",
    strainType: "Hybrid",
    indicaPct: 40,
    sativaPct: 60,
    thcPct: 24,
    description: "Balanced tactical strain. Sharp cerebral focus with a grounded finish.",
    availability: "IN STOCK",
    sizes: [S(25, 30), S(50, 28), S(100, 26)],
  },
  {
    id: "p-02",
    name: "NIGHT REAPER",
    category: "products",
    strain: "Reaper Kush",
    strainType: "Indica",
    indicaPct: 80,
    sativaPct: 20,
    thcPct: 27,
    description: "Deep decompression payload. Heavy body, slow burn, silent nights.",
    availability: "IN STOCK",
    sizes: [S(25, 32), S(50, 30), S(100, 28)],
  },
  {
    id: "p-03",
    name: "WRAITH RUNNER",
    category: "products",
    strain: "Wraith Diesel",
    strainType: "Sativa",
    indicaPct: 20,
    sativaPct: 80,
    thcPct: 22,
    description: "High-alert energy profile for extended operations.",
    availability: "LOW STOCK",
    sizes: [S(25, 30), S(50, 28), S(100, 26)],
  },
  {
    id: "p-04",
    name: "BLACK OPS",
    category: "products",
    strain: "Blackout OG",
    strainType: "Indica",
    indicaPct: 75,
    sativaPct: 25,
    thcPct: 26,
    description: "Standard-issue nightfall blend. Reliable, dense, uncompromising.",
    availability: "IN STOCK",
    sizes: [S(25, 30), S(50, 28), S(100, 26)],
  },
  {
    id: "sp-01",
    name: "PHANTOM ISSUE",
    category: "special",
    strain: "Phantom Cookies",
    strainType: "Hybrid",
    indicaPct: 55,
    sativaPct: 45,
    thcPct: 30,
    description: "Limited-run classified supply. Reserved for verified operators.",
    availability: "LOW STOCK",
    sizes: [S(25, 40), S(50, 38), S(100, 36)],
  },
  {
    id: "sp-02",
    name: "ZERO DARK",
    category: "special",
    strain: "Zero Kush",
    strainType: "Indica",
    indicaPct: 90,
    sativaPct: 10,
    thcPct: 32,
    description: "Extraction-grade payload. Maximum sedation profile.",
    availability: "IN STOCK",
    sizes: [S(25, 45), S(50, 42), S(100, 40)],
  },
  {
    id: "ac-01",
    name: "TACTICAL GRINDER",
    category: "accessories",
    strain: "Field Kit",
    strainType: "Hybrid",
    indicaPct: 0,
    sativaPct: 0,
    thcPct: 0,
    description: "Machined-aluminum grinder. Standard issue for every operator.",
    availability: "IN STOCK",
    sizes: [{ grams: 1, label: "UNIT", pricePerGram: 450 }],
  },
  {
    id: "ac-02",
    name: "STEALTH POUCH",
    category: "accessories",
    strain: "Field Kit",
    strainType: "Hybrid",
    indicaPct: 0,
    sativaPct: 0,
    thcPct: 0,
    description: "Smell-proof carbon-lined pouch for silent transport.",
    availability: "IN STOCK",
    sizes: [{ grams: 1, label: "UNIT", pricePerGram: 550 }],
  },
];

export function productsByCategory(cat: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === cat);
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
