import { safeLocalStorage } from "@/lib/storage/local-storage";
import { getPrayerCacheKey } from "@/lib/storage/cache-keys";

/**
 * Fetch a 1-month prayer schedule from internal API proxy
 */
export async function fetchPrayerMonth(city, year, month) {
    if (!city || !city.coordinate) return null;
    const { latitude, longitude } = city.coordinate;
    const dateParam = `${year}-${month}-1`;

    try {
        const res = await fetch(`/api/prayer?latitude=${latitude}&longitude=${longitude}&date=${dateParam}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data;
    } catch (err) {
        console.warn("[prayer-service] Network fetch failed:", err);
        return null;
    }
}

/**
 * Find matching prayer for a specific year, month, and day in prayers array
 */
export function findPrayerInMonth(prayers, year, month, day) {
    if (!Array.isArray(prayers) || prayers.length === 0) return null;

    // Direct match (handling "2026-9-1" or "2026-09-01")
    let match = prayers.find((p) => {
        if (!p.date) return false;
        const parts = p.date.split("-").map(Number);
        return parts[0] === year && parts[1] === month && parts[2] === day;
    });

    // Fallback match by day number within the month
    if (!match) {
        match = prayers.find((p) => {
            if (!p.date) return false;
            const parts = p.date.split("-").map(Number);
            return parts && parts[2] === day;
        });
    }

    return match || null;
}

/**
 * Load prayer times for today with 3-tier offline protection:
 * 1. Checks cache for current month (0ms instant load).
 * 2. If missing and online, fetches from API and caches full 30 days.
 * 3. Edge-Case: If month just changed while offline (e.g. Oct 1st offline),
 *    falls back to the LAST day of the previous month (accurate to within ~1 min).
 */
export async function getTodayPrayerWithFallback(city) {
    if (!city) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const currentKey = getPrayerCacheKey(city.id, currentYear, currentMonth);

    // 1. Cek Cache Bulan Berjalan (Cache Hit)
    let monthData = safeLocalStorage.getItem(currentKey);

    if (monthData && monthData.prayers) {
        const match = findPrayerInMonth(monthData.prayers, currentYear, currentMonth, currentDay);
        if (match && match.time) {
            return {
                prayerTime: match.time,
                isEstimated: false,
                source: "cache",
                date: match.date
            };
        }
    }

    // 2. Jika Cache Miss dan Online: Fetch dari API
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (isOnline) {
        const freshData = await fetchPrayerMonth(city, currentYear, currentMonth);
        if (freshData && freshData.prayers && freshData.prayers.length > 0) {
            // Simpan jadwal 1 bulan ke LocalStorage
            safeLocalStorage.setItem(currentKey, freshData);

            const match = findPrayerInMonth(freshData.prayers, currentYear, currentMonth, currentDay);
            if (match && match.time) {
                return {
                    prayerTime: match.time,
                    isEstimated: false,
                    source: "network",
                    date: match.date
                };
            }
        }
    }

    // 3. EDGE CASE OFFLINE GANTI BULAN:
    // User offline di awal bulan baru, dan data bulan baru belum sempat ter-download.
    // Gunakan HARI TERAKHIR bulan sebelumnya (secara astronomi selisihnya hanya ~0-1 menit).
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevKey = getPrayerCacheKey(city.id, prevYear, prevMonth);

    const prevMonthData = safeLocalStorage.getItem(prevKey);
    if (prevMonthData && Array.isArray(prevMonthData.prayers) && prevMonthData.prayers.length > 0) {
        const lastDayItem = prevMonthData.prayers[prevMonthData.prayers.length - 1];
        if (lastDayItem && lastDayItem.time) {
            console.warn(
                `[prayer-service] Edge-case aktif: Menggunakan jadwal hari terakhir bulan kemarin (${lastDayItem.date}) sebagai estimasi presisi.`
            );
            return {
                prayerTime: lastDayItem.time,
                isEstimated: true,
                source: "fallback-previous-month",
                fallbackDate: lastDayItem.date
            };
        }
    }

    // Fallback darurat jika ada data tersimpan di key lama
    const legacySaved = safeLocalStorage.getItem("ramadan-prayer-today");
    if (legacySaved) {
        return {
            prayerTime: legacySaved,
            isEstimated: true,
            source: "legacy-cache"
        };
    }

    return null;
}

/**
 * Smart Pre-fetch:
 * Jika tanggal sudah memasuki akhir bulan (tanggal >= 25) dan perangkat sedang online,
 * otomatis unduh jadwal bulan berikutnya di latar belakang agar saat tanggal 1 berganti,
 * data sudah tersedia di cache tanpa perlu internet!
 */
export async function smartPrefetchNextMonth(city) {
    if (!city) return;
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;
    if (!isOnline) return;

    const now = new Date();
    const currentDay = now.getDate();

    // Hanya pre-fetch jika sudah tanggal 25 ke atas
    if (currentDay < 25) return;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    const nextKey = getPrayerCacheKey(city.id, nextYear, nextMonth);
    const existing = safeLocalStorage.getItem(nextKey);

    // Jika belum ada di cache, unduh di latar belakang
    if (!existing) {
        try {
            console.log(`[prayer-service] Menjalankan Smart Pre-fetch untuk bulan ${nextYear}-${nextMonth}...`);
            const freshNextData = await fetchPrayerMonth(city, nextYear, nextMonth);
            if (freshNextData && freshNextData.prayers) {
                safeLocalStorage.setItem(nextKey, freshNextData);
                console.log(`[prayer-service] Smart Pre-fetch berhasil disimpan.`);
            }
        } catch (e) {
            console.warn("[prayer-service] Smart Pre-fetch gagal:", e);
        }
    }
}
