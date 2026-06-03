import { useSyncExternalStore } from "react";

/**
 * Custom hook to sync window size using useSyncExternalStore.
 * Avoids tearing and unnecessary re-renders by subscribing to the browser API directly.
 */
export function useWindowSize() {
  const windowSize = useSyncExternalStore(
    // 1. Subscribe function
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    // 2. Get value function
    () => JSON.stringify({ width: window.innerWidth, height: window.innerHeight }),
    // 3. Server snapshot (for hydration)
    () => JSON.stringify({ width: 0, height: 0 })
  );

  return JSON.parse(windowSize) as { width: number; height: number };
}

/**
 * Custom hook to sync online status.
 */
export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine,
    () => true // Default to true on server
  );

  return isOnline;
}
