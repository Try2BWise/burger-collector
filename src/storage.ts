import { createStore, get, set } from "idb-keyval";

export const STORAGE_KEY = "burger-collector.entries.v1";
const burgerStore = createStore("burger-collector-db", "journal");

export type StoredBurgerEntry = {
  id: string;
  name: string;
  restaurant: string;
  price: string;
  rating: number;
  sampledOn: string;
  temperature: string;
  juiciness: string;
  pattyStyle: string;
  notes: string;
  toppings: string[];
  photoDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

export async function loadStoredEntries(fallbackEntries: StoredBurgerEntry[]) {
  const indexedEntries = await get<StoredBurgerEntry[]>(STORAGE_KEY, burgerStore);
  if (indexedEntries && indexedEntries.length > 0) {
    return indexedEntries;
  }

  const legacyEntries = window.localStorage.getItem(STORAGE_KEY);
  if (legacyEntries) {
    try {
      const parsed = JSON.parse(legacyEntries) as StoredBurgerEntry[];
      if (parsed.length > 0) {
        await set(STORAGE_KEY, parsed, burgerStore);
        window.localStorage.removeItem(STORAGE_KEY);
        return parsed;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  await set(STORAGE_KEY, fallbackEntries, burgerStore);
  return fallbackEntries;
}

export async function saveStoredEntries(entries: StoredBurgerEntry[]) {
  await set(STORAGE_KEY, entries, burgerStore);
}
