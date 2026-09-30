/**
 * Cache Keys Constants for Ramadan Tracker Offline Storage
 */
export const CACHE_KEYS = {
    LOCATION: "ramadan-location",
    PRAYER_PREFIX: "ramadan-prayer",
    CITIES: "ramadan-cities-cache",
};

/**
 * Generate unique cache key for a specific city, year, and month
 * @param {string} cityId 
 * @param {number} year 
 * @param {number} month (1 - 12)
 * @returns {string} e.g. "ramadan-prayer-67fe1456a32be2ab743ff58f-2026-9"
 */
export function getPrayerCacheKey(cityId, year, month) {
    const safeCity = cityId || "default";
    return `${CACHE_KEYS.PRAYER_PREFIX}-${safeCity}-${year}-${month}`;
}
