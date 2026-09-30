"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getTodayPrayerWithFallback, smartPrefetchNextMonth } from "@/lib/services/prayer-service";
import { useNetworkStatus } from "./useNetworkStatus";

/**
 * Calculates the next prayer and remaining time countdown
 */
function calculateNextPrayer(prayerToday) {
    if (!prayerToday) {
        return { name: "Imsak", time: "--:--", timeLeft: "--" };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const getMins = (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(":");
        if (parts.length !== 2) return 0;
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    const prayersList = [
        { name: "Imsak", time: prayerToday.imsak, mins: getMins(prayerToday.imsak) },
        { name: "Subuh", time: prayerToday.subuh, mins: getMins(prayerToday.subuh) },
        { name: "Dzuhur", time: prayerToday.dzuhur, mins: getMins(prayerToday.dzuhur) },
        { name: "Ashar", time: prayerToday.ashar, mins: getMins(prayerToday.ashar) },
        { name: "Maghrib", time: prayerToday.maghrib, mins: getMins(prayerToday.maghrib) },
        { name: "Isya", time: prayerToday.isya, mins: getMins(prayerToday.isya) }
    ];

    let targetName = "";
    let targetTimeStr = "";
    let targetMins = 0;

    const nextP = prayersList.find((p) => p.mins > currentTotalMins);

    if (nextP) {
        targetName = nextP.name;
        targetTimeStr = nextP.time;
        targetMins = nextP.mins;
    } else {
        // Lewat Isya, target berikutnya adalah Imsak besok
        targetName = "Imsak";
        targetTimeStr = prayerToday.imsak;
        targetMins = getMins(prayerToday.imsak) + 24 * 60;
    }

    const diff = targetMins - currentTotalMins;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    const timeLeftStr = `${h > 0 ? h + "j " : ""}${m}m`;

    return {
        name: targetName,
        time: targetTimeStr,
        timeLeft: timeLeftStr
    };
}

/**
 * Hook to manage offline-first prayer times with auto-reconnect sync
 */
export function usePrayerTimes(city) {
    const [prayerToday, setPrayerToday] = useState(null);
    const [isEstimated, setIsEstimated] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [nextPrayer, setNextPrayer] = useState({ name: "Imsak", time: "--:--", timeLeft: "--" });

    const cityRef = useRef(city);
    useEffect(() => {
        cityRef.current = city;
    }, [city]);

    // Fungsi memuat data jadwal sholat (Cache-First)
    const loadPrayerData = useCallback(async () => {
        const targetCity = cityRef.current;
        if (!targetCity) return;

        setIsSyncing(true);
        try {
            const result = await getTodayPrayerWithFallback(targetCity);
            if (result && result.prayerTime) {
                setPrayerToday(result.prayerTime);
                setIsEstimated(result.isEstimated || false);
            }
            // Jalankan Smart Pre-fetch jika sudah tanggal 25+
            smartPrefetchNextMonth(targetCity);
        } catch (err) {
            console.error("[usePrayerTimes] Gagal memuat jadwal sholat:", err);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Callback otomatis ketika internet tersambung kembali (Online Reconnect Event)
    const handleReconnect = useCallback(() => {
        console.log("[usePrayerTimes] Internet terhubung kembali. Memperbarui jadwal sholat...");
        loadPrayerData();
    }, [loadPrayerData]);

    const { isOnline } = useNetworkStatus(handleReconnect);

    // Muat data setiap kali kota berubah
    useEffect(() => {
        loadPrayerData();
    }, [city, loadPrayerData]);

    // Interval hitung mundur per menit
    useEffect(() => {
        if (!prayerToday) return;

        const updateTimer = () => {
            setNextPrayer(calculateNextPrayer(prayerToday));
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 30000); // per 30 detik untuk akurasi tinggi
        return () => clearInterval(intervalId);
    }, [prayerToday]);

    return {
        prayerToday,
        nextPrayer,
        isEstimated,
        isOffline: !isOnline,
        isSyncing,
        refresh: loadPrayerData
    };
}
