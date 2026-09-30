"use client";

import { useState, useEffect } from "react";
import { Moon, MapPin, Search, Check, X, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import AdzanNotification from "./AdzanNotification";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { safeLocalStorage } from "@/lib/storage/local-storage";
import { CACHE_KEYS } from "@/lib/storage/cache-keys";

const DEFAULT_CITY = {
    id: "67fe1456a32be2ab743ff58f",
    name: "Kota Denpasar",
    provinceName: "Bali",
    coordinate: { latitude: -8.658361, longitude: 115.213505 }
};

export default function PrayerTimes() {
    const [city, setCity] = useState(null);

    // Modal & Data state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cities, setCities] = useState([]);
    const [searchCity, setSearchCity] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Gunakan Offline-First Hook untuk Jadwal Sholat
    const { prayerToday, nextPrayer, isEstimated, isOffline, refresh } = usePrayerTimes(city);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isModalOpen]);

    // Initial Load for localStorage and Event Listener
    useEffect(() => {
        const loadSaved = () => {
            const saved = safeLocalStorage.getItem(CACHE_KEYS.LOCATION);
            if (saved && saved.coordinate) {
                setCity(saved);
            } else {
                setCity(DEFAULT_CITY);
            }
        };

        loadSaved();

        const handleOpenModal = () => handleOpenModalData();
        window.addEventListener("open-location-modal", handleOpenModal);
        window.addEventListener("location-changed", loadSaved);
        return () => {
            window.removeEventListener("open-location-modal", handleOpenModal);
            window.removeEventListener("location-changed", loadSaved);
        };
    }, []);

    // Handle Modal Open & Data Fetching (dengan Cache-First untuk daftar kota)
    const handleOpenModalData = async () => {
        setIsModalOpen(true);
        if (cities.length === 0) {
            // Cek cache lokal terlebih dahulu
            const cachedCities = safeLocalStorage.getItem(CACHE_KEYS.CITIES, []);
            if (cachedCities && cachedCities.length > 0) {
                setCities(cachedCities);
            }

            const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
            if (isOnline || !cachedCities || cachedCities.length === 0) {
                if (!cachedCities || cachedCities.length === 0) {
                    setLoadingLocation(true);
                }
                try {
                    const res = await fetch("/api/province");
                    const data = await res.json();

                    // Flatten nested cities
                    const flatCities = [];
                    if (Array.isArray(data)) {
                        data.forEach((prov) => {
                            if (prov.cities && Array.isArray(prov.cities)) {
                                prov.cities.forEach((c) => {
                                    flatCities.push({ ...c, provinceName: prov.name });
                                });
                            }
                        });
                    }
                    if (flatCities.length > 0) {
                        setCities(flatCities);
                        safeLocalStorage.setItem(CACHE_KEYS.CITIES, flatCities);
                    }
                } catch (e) {
                    console.error("Failed to load cities", e);
                } finally {
                    setLoadingLocation(false);
                }
            }
        }
    };

    const handleSelectCity = (c) => {
        setCity(c);
        safeLocalStorage.setItem(CACHE_KEYS.LOCATION, c);
        window.dispatchEvent(new Event("location-changed"));
        setIsModalOpen(false);
    };

    // Derived Data
    const filteredCities = cities.filter((c) =>
        c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
        c.provinceName.toLowerCase().includes(searchCity.toLowerCase())
    );

    const displayPrayers = [
        { key: "imsak", label: "Imsak", time: prayerToday?.imsak || "--:--" },
        { key: "subuh", label: "Subuh", time: prayerToday?.subuh || "--:--" },
        { key: "dzuhur", label: "Dzuhur", time: prayerToday?.dzuhur || "--:--" },
        { key: "ashar", label: "Ashar", time: prayerToday?.ashar || "--:--" },
        { key: "maghrib", label: "Maghrib", time: prayerToday?.maghrib || "--:--" },
        { key: "isya", label: "Isya", time: prayerToday?.isya || "--:--" }
    ];

    return (
        <div className="relative w-full">
            {/* Background Decoration */}
            <div className="absolute -right-10 -top-[140px] opacity-10 pointer-events-none">
                <Moon size={200} fill="currentColor" />
            </div>

            {/* Countdown / Next Prayer Info */}
            <AnimatePresence>
                <div className="relative z-10 flex flex-col items-center text-center mt-2 space-y-4">
                    <motion.span
                        className="text-primary-foreground/80 text-xs shadow-md font-medium tracking-wide bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5"
                        initial={{ y: 100, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        Menuju Waktu {nextPrayer.name}
                    </motion.span>

                    <motion.h2
                        className="text-6xl font-extrabold tracking-tight mb-4 text-white text-shadow-lg"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        {nextPrayer.timeLeft}
                    </motion.h2>

                    <motion.div
                        className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 mt-2 shadow-md"
                        initial={{ y: -100, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <Clock size={13} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                        <span className="text-sm font-medium text-white">{nextPrayer.time}</span>
                    </motion.div>

                    {/* Banner Indikator Halus jika Sedang Menggunakan Estimasi Hari Terakhir (Edge Case Ganti Bulan Offline) */}
                    {isEstimated && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-300/30 rounded-full text-[11px] text-amber-200 mt-1 shadow-sm"
                        >
                            <AlertCircle size={12} className="text-amber-300" />
                            <span>Jadwal estimasi kemarin (offline). Hubungkan ke internet untuk bulan baru.</span>
                        </motion.div>
                    )}
                </div>
            </AnimatePresence>

            {/* Prayer List */}
            <AnimatePresence>
                <motion.div
                    className="mt-8 grid grid-cols-6 gap-1 sm:gap-2 text-center text-white hover:cursor-default drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                >
                    {displayPrayers.map((prayer) => {
                        const isNext = prayer.label === nextPrayer.name;
                        return (
                            <div
                                key={prayer.key}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-colors",
                                    isNext ? "bg-white/20 border border-white/20 shadow-sm" : "opacity-80"
                                )}
                            >
                                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider texat-accent">
                                    {prayer.label}
                                </span>
                                <span className="text-xs font-bold sm:text-sm">
                                    {prayer.time}
                                </span>
                                {isNext && (
                                    <div className="w-1 h-1 bg-accent rounded-full mt-0.5"></div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Notification Bar via distinct component */}
            <AdzanNotification prayerToday={prayerToday} city={city} />

            {/* Modal Location Picker */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.50 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh] sm:h-[70vh] pointer-events-auto"
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">Pilih Lokasi</h3>
                                    <p className="text-sm text-muted-foreground">Sesuaikan jadwal shalat dengan lokasimu</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-muted-foreground cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Cari Kota atau Kabupaten..."
                                        className="w-full border border-black/5 border-transparent text-foreground rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/60 transition-all font-medium"
                                        value={searchCity}
                                        onChange={(e) => setSearchCity(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {loadingLocation ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                                        <Loader2 className="animate-spin text-primary" size={24} />
                                        <span className="text-sm">Memuat daftar kota...</span>
                                    </div>
                                ) : filteredCities.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <MapPin className="opacity-20 mb-2" size={32} />
                                        <span className="text-sm">Kota tidak ditemukan</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 pb-4">
                                        {filteredCities.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleSelectCity(c)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left cursor-pointer",
                                                    city?.id === c.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-black/5 text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <MapPin size={16} className="text-primary" />
                                                    <div>
                                                        <div className="text-sm font-medium">{c.name}</div>
                                                        <div className="text-[10px] opacity-70 mt-0.5 font-medium">{c.provinceName}</div>
                                                    </div>
                                                </div>
                                                {city?.id === c.id && <CheckCircle2 size={16} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
