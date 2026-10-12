"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE } from "@/lib/compare";

// Companies picked for comparison, kept in localStorage so the selection
// survives navigation. The compare page itself reads codes from the URL,
// so a comparison can be shared as a link.

export type CompareItem = { code: string; name: string };

const STORAGE_KEY = "jei.compare";
const CHANGE_EVENT = "jei-compare-change";
const EMPTY: CompareItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CompareItem[] = EMPTY;

function read(): CompareItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? (parsed as CompareItem[]).slice(0, MAX_COMPARE) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function write(items: CompareItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode); selection just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useCompareList(): CompareItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addToCompare(item: CompareItem) {
  const items = read();
  if (items.length >= MAX_COMPARE || items.some((i) => i.code === item.code)) return;
  write([...items, item]);
}

export function removeFromCompare(code: string) {
  write(read().filter((i) => i.code !== code));
}

export function clearCompare() {
  write([]);
}

// Replaces the selection, e.g. to match the companies on a shared compare link.
export function setCompare(items: CompareItem[]) {
  write(items.slice(0, MAX_COMPARE));
}
