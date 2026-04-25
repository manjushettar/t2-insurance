import { AppState } from "@/lib/types";
import { oaklandInitialState } from "@/lib/mockData";

const STORAGE_KEY = "insure-ready-state";

export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return oaklandInitialState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return oaklandInitialState;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return oaklandInitialState;
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAppState(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
