/**
 * Safe LocalStorage wrapper for client-side storage
 * Handles SSR, Incognito quota blocks, and JSON serialization.
 */
export const safeLocalStorage = {
    getItem(key, defaultValue = null) {
        if (typeof window === "undefined") return defaultValue;
        try {
            const item = window.localStorage.getItem(key);
            if (!item) return defaultValue;
            return JSON.parse(item);
        } catch (e) {
            console.warn(`[storage] Error reading key "${key}":`, e);
            return defaultValue;
        }
    },

    setItem(key, value) {
        if (typeof window === "undefined") return false;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`[storage] Error writing key "${key}":`, e);
            return false;
        }
    },

    removeItem(key) {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            console.warn(`[storage] Error removing key "${key}":`, e);
        }
    }
};
