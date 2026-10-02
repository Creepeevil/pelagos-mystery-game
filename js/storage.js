export const STORAGE_KEY = "pelagos-deduction-grid-v1";
export function loadNotebook() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}
export function saveNotebook(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function clearNotebook() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
