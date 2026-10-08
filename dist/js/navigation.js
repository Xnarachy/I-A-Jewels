const STORAGE_KEY = "ia-jewels-navigation";

export function saveBrowseState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      scrollY: window.scrollY,
      savedAt: Date.now()
    }));
  } catch {}
}

export function readBrowseState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function restoreBrowseState() {
  const state = readBrowseState();
  if (!state) return;
  requestAnimationFrame(() => {
    window.scrollTo(0, Number(state.scrollY) || 0);
  });
}
