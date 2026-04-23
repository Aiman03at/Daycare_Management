import { useEffect, useState } from "react";
import type { AgeGroupKey } from "./ageGroups";

export interface BaseCareEntry {
  id: string;
  childId: number;
  childName: string;
  group: AgeGroupKey;
  note: string;
  createdAt: string;
}

export interface MealEntry extends BaseCareEntry {
  mealType: "breakfast" | "lunch" | "snack";
  status: "all" | "most" | "some" | "refused";
}

export interface ToiletEntry extends BaseCareEntry {
  type: "diaper" | "toilet";
  status: "changed" | "wet" | "dry" | "success" | "attempt";
}

export interface SleepEntry extends BaseCareEntry {
  duration: string;
  quality: "asleep" | "resting" | "woke-early";
}

export interface IncidentEntry extends BaseCareEntry {
  category: "incident" | "accident";
  severity: "low" | "medium" | "high";
}

export interface HealthEntry extends BaseCareEntry {
  category: "medication" | "symptom" | "check";
  status: "normal" | "watch" | "action-needed";
}

export interface SupplyEntry extends BaseCareEntry {
  item: "diapers" | "wipes" | "clothes" | "cream" | "bedding" | "other";
  status: "ok" | "low" | "restocked";
}

export interface CareStore {
  meals: MealEntry[];
  toilets: ToiletEntry[];
  sleep: SleepEntry[];
  incidents: IncidentEntry[];
  health: HealthEntry[];
  supplies: SupplyEntry[];
}

const STORAGE_KEY = "daycare-care-records";

const defaultCareStore: CareStore = {
  meals: [],
  toilets: [],
  sleep: [],
  incidents: [],
  health: [],
  supplies: [],
};

function loadCareStore(): CareStore {
  if (typeof window === "undefined") {
    return defaultCareStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultCareStore;
    }

    const parsed = JSON.parse(raw) as Partial<CareStore>;

    return {
      meals: parsed.meals ?? [],
      toilets: parsed.toilets ?? [],
      sleep: parsed.sleep ?? [],
      incidents: parsed.incidents ?? [],
      health: parsed.health ?? [],
      supplies: parsed.supplies ?? [],
    };
  } catch {
    return defaultCareStore;
  }
}

export function useCareStore() {
  const [store, setStore] = useState<CareStore>(defaultCareStore);

  useEffect(() => {
    setStore(loadCareStore());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  return { store, setStore };
}

export function createCareEntryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatEntryTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
