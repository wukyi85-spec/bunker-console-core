// Loadout store — localStorage backed. Future: swap for Supabase orders/cart table.
import { findProduct, type Product } from "./products";

const KEY = "bunker.loadout";
const ORDERS_KEY = "bunker.orders";

export interface LoadoutItem {
  productId: string;
  sizeLabel: string;
  grams: number;
  pricePerGram: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: LoadoutItem[];
  customer: { name: string; phone: string; address: string; notes?: string };
  payment: "PromptPay" | "KPay" | "WavePay";
  productTotal: number;
  totalGrams: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): LoadoutItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: LoadoutItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function getLoadout(): LoadoutItem[] {
  return read();
}

export function subscribeLoadout(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addToLoadout(entry: LoadoutItem) {
  const items = read();
  const idx = items.findIndex(
    (i) => i.productId === entry.productId && i.sizeLabel === entry.sizeLabel,
  );
  if (idx >= 0) {
    items[idx].quantity += entry.quantity;
  } else {
    items.push(entry);
  }
  write(items);
}

export function updateQuantity(productId: string, sizeLabel: string, delta: number) {
  const items = read();
  const idx = items.findIndex((i) => i.productId === productId && i.sizeLabel === sizeLabel);
  if (idx < 0) return;
  items[idx].quantity = Math.max(1, items[idx].quantity + delta);
  write(items);
}

export function removeFromLoadout(productId: string, sizeLabel: string) {
  write(read().filter((i) => !(i.productId === productId && i.sizeLabel === sizeLabel)));
}

export function clearLoadout() {
  write([]);
}

export interface EnrichedItem extends LoadoutItem {
  product: Product | undefined;
  subtotal: number;
  gramsTotal: number;
}

export function enrichLoadout(items: LoadoutItem[]): EnrichedItem[] {
  return items.map((i) => {
    const product = findProduct(i.productId);
    const gramsTotal = i.grams * i.quantity;
    const subtotal = gramsTotal * i.pricePerGram;
    return { ...i, product, subtotal, gramsTotal };
  });
}

export function loadoutTotals(items: LoadoutItem[]) {
  const enriched = enrichLoadout(items);
  const productTotal = enriched.reduce((s, i) => s + i.subtotal, 0);
  const totalGrams = enriched.reduce((s, i) => s + i.gramsTotal, 0);
  const minMet = totalGrams >= 50 || productTotal >= 1000;
  return { enriched, productTotal, totalGrams, minMet };
}

// Orders
export function saveOrder(order: Order) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(ORDERS_KEY);
  const orders: Order[] = raw ? JSON.parse(raw) : [];
  orders.unshift(order);
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
