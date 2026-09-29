"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Compass, MapPin, CheckCircle2, Navigation, RotateCw, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Koordinat Ka'bah (Masjidil Haram, Mekkah, Arab Saudi)
// 21° 25' 21" LU (21.4225°), 39° 50' 34" BT (39.8428°)
const KAABA_COORDS = {
    lat: 21.4225,
    lng: 39.8428
};

// Perhitungan Arah Kiblat berdasarkan rumus Trigonometri Bola (Great Circle Bearing)
function calculateQiblaBearing(userLat, userLng) {
    const phi1 = (userLat * Math.PI) / 180;
    const lambda1 = (userLng * Math.PI) / 180;
    const phi2 = (KAABA_COORDS.lat * Math.PI) / 180;
    const lambda2 = (KAABA_COORDS.lng * Math.PI) / 180;

    const deltaLambda = lambda2 - lambda1;
    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

    const qiblaRad = Math.atan2(y, x);
    let qiblaDeg = (qiblaRad * 180) / Math.PI;
    return (qiblaDeg + 360) % 360;
}

// Perhitungan Jarak ke Ka'bah menggunakan rumus Haversine
function calculateKaabaDistance(userLat, userLng) {
    const R = 6371; // Radius bumi dalam km
    const dLat = (KAABA_COORDS.lat - userLat) * (Math.PI / 180);
    const dLng = (KAABA_COORDS.lng - userLng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
        Math.cos((KAABA_COORDS.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

export default function QiblaCompass() {
    const router = useRouter();

    // State lokasi
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState("Mencari Lokasi...");
    const [qiblaAngle, setQiblaAngle] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);

    // State orientasi kompas
    const [deviceHeading, setDeviceHeading] = useState(0); // Derajat hadap HP dari Utara (0 - 360)
    const [isSensorActive, setIsSensorActive] = useState(false);
    const [requiresPermission, setRequiresPermission] = useState(false);
    const [isAligned, setIsAligned] = useState(false);

    // Manual fallback untuk browser tanpa sensor (misal desktop/laptop)
    const compassRef = useRef(null);
    const [manualRotation, setManualRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startDragAngle, setStartDragAngle] = useState(0);
    const [startRotation, setStartRotation] = useState(0);

    const lastVibratedRef = useRef(false);

    // 1. Inisialisasi Lokasi: Cek localStorage (kota tersimpan) lalu perbarui dengan GPS presisi
    useEffect(() => {
        let hasSavedLocation = false;
        try {
            const saved = localStorage.getItem("ramadan-location");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.coordinate?.latitude && parsed.coordinate?.longitude) {
                    const lat = parsed.coordinate.latitude;
                    const lng = parsed.coordinate.longitude;
                    setLocation({ lat, lng });
                    setLocationName(parsed.name || "Lokasi Tersimpan");
                    const bearing = calculateQiblaBearing(lat, lng);
                    setQiblaAngle(bearing);
                    setDistanceKm(calculateKaabaDistance(lat, lng));
                    hasSavedLocation = true;
                }
            }
        } catch (e) {
            console.error("Error reading saved location:", e);
        }

        // Dapatkan koordinat GPS presisi
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation({ lat, lng });
                    setLocationName("Lokasi GPS Presisi");
                    const bearing = calculateQiblaBearing(lat, lng);
                    setQiblaAngle(bearing);
                    setDistanceKm(calculateKaabaDistance(lat, lng));
                },
                (err) => {
                    console.warn("GPS error / denied:", err);
                    if (!hasSavedLocation) {
                        // Fallback ke Semarang jika belum ada data sama sekali
                        const defaultLat = -6.9835;
                        const defaultLng = 110.4453;
                        setLocation({ lat: defaultLat, lng: defaultLng });
                        setLocationName("Kota Semarang");
                        setQiblaAngle(calculateQiblaBearing(defaultLat, defaultLng));
                        setDistanceKm(calculateKaabaDistance(defaultLat, defaultLng));
                    }
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else if (!hasSavedLocation) {
            const defaultLat = -6.9835;
            const defaultLng = 110.4453;
            setLocation({ lat: defaultLat, lng: defaultLng });
            setLocationName("Kota Semarang");
            setQiblaAngle(calculateQiblaBearing(defaultLat, defaultLng));
            setDistanceKm(calculateKaabaDistance(defaultLat, defaultLng));
        }
    }, []);

    // 2. Inisialisasi Sensor Orientasi (DeviceOrientation)
    const handleDeviceOrientation = useCallback((e) => {
        let heading = null;

        // iOS Safari menyediakan webkitCompassHeading langsung (0 = Utara)
        if (typeof e.webkitCompassHeading !== "undefined" && e.webkitCompassHeading !== null) {
            heading = e.webkitCompassHeading;
        } else if (e.alpha !== null && typeof e.alpha !== "undefined") {
            // Android Chrome / standar W3C
            // Jika perangkat mendukung orientasi absolut
            if (e.absolute) {
                heading = 360 - e.alpha;
            } else {
                heading = 360 - e.alpha;
            }
        }

        if (heading !== null) {
            heading = (heading + 360) % 360;
            setDeviceHeading(heading);
            setIsSensorActive(true);
        }
    }, []);

    const requestOrientationPermission = async () => {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            try {
                const state = await DeviceOrientationEvent.requestPermission();
                if (state === "granted") {
                    setRequiresPermission(false);
                    window.addEventListener("deviceorientation", handleDeviceOrientation, true);
                } else {
                    alert("Izin sensor kompas diperlukan untuk mengarahkan ponsel secara otomatis.");
                }
            } catch (err) {
                console.error("Device orientation permission error:", err);
            }
        }
    };

    useEffect(() => {
        // Cek apakah iOS memerlukan izin izin eksplisit
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            setRequiresPermission(true);
        } else {
            // Android & Desktop langsung pasang event listener
            window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
            window.addEventListener("deviceorientation", handleDeviceOrientation, true);
        }

        return () => {
            window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
            window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
        };
    }, [handleDeviceOrientation]);

    // 3. Logika Penyelarasan Arah Kiblat & Haptic Feedback
    const activeHeading = isSensorActive ? deviceHeading : manualRotation;

    useEffect(() => {
        if (qiblaAngle === null) return;

        // Hitung selisih derajat sudut (-180 hingga +180)
        const diff = (qiblaAngle - activeHeading + 540) % 360 - 180;
        const aligned = Math.abs(diff) <= 3; // Toleransi presisi 3 derajat

        setIsAligned(aligned);

        // Haptic feedback saat ponsel pas menghadap Kiblat
        if (aligned && !lastVibratedRef.current) {
            lastVibratedRef.current = true;
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                try {
                    navigator.vibrate([40, 60, 40]);
                } catch (e) {}
            }
        } else if (!aligned) {
            lastVibratedRef.current = false;
        }
    }, [qiblaAngle, activeHeading]);

    // Selisih sudut untuk panduan putaran
    const angleDiff = qiblaAngle !== null ? (qiblaAngle - activeHeading + 540) % 360 - 180 : 0;
    const absDiff = Math.round(Math.abs(angleDiff));

    // Dial kompas berputar berlawanan dengan arah hadap ponsel (-heading)
    const dialRotation = -activeHeading;

    // 4. Manual drag handler (jika di laptop/PC tanpa sensor kompas)
    const handlePointerDown = (e) => {
        if (isSensorActive) return; // Prioritaskan sensor gyro/magnetometer
        if (!compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setStartDragAngle(angle);
        setStartRotation(manualRotation);
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || isSensorActive || !compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const delta = angle - startDragAngle;
        let newRot = (startRotation - delta) % 360;
        if (newRot < 0) newRot += 360;
        setManualRotation(newRot);
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
    };

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto pt-4 pb-8 select-none">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between py-3.5 px-5 fixed top-0 w-full max-w-md bg-white/70 dark:bg-black/60 backdrop-blur-md z-50 border-b border-emerald-900/10">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-emerald-950 dark:text-white hover:bg-emerald-500/10 rounded-full transition-colors -ml-1 cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="text-sm font-bold text-emerald-950 dark:text-white tracking-wide">
                        Kompas Arah Kiblat
                    </h1>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <MapPin size={11} />
                        <span className="truncate max-w-[170px]">{locationName}</span>
                    </div>
                </div>
                <div className="w-8" />
            </div>

            {/* Compass Container Area */}
            <div className="flex flex-col flex-1 justify-center items-center px-4 mt-16 relative">
                {/* Permintaan Izin Sensor Kompas (Khusus Safari iOS) */}
                {requiresPermission && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 w-full bg-emerald-900/10 border border-emerald-500/30 rounded-2xl p-3 text-center"
                    >
                        <p className="text-xs text-emerald-950 dark:text-white mb-2 font-medium">
                            Aktifkan sensor kompas untuk pergerakan otomatis mengikuti arah HP.
                        </p>
                        <button
                            onClick={requestOrientationPermission}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            Izinkan Sensor Kompas
                        </button>
                    </motion.div>
                )}

                {/* Status Penyelarasan Arah */}
                <div className="w-full flex justify-center mb-6">
                    <AnimatePresence mode="wait">
                        {isAligned ? (
                            <motion.div
                                key="aligned"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.4)] border border-emerald-400 font-semibold text-xs tracking-wide animate-pulse"
                            >
                                <CheckCircle2 size={15} className="text-accent" />
                                <span>Tepat Menghadap Kiblat</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="guiding"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-emerald-900/10 dark:border-white/10 text-xs font-medium text-emerald-900 dark:text-emerald-100 shadow-sm"
                            >
                                {angleDiff > 0 ? (
                                    <>
                                        <RotateCw size={13} className="text-accent animate-spin-slow" />
                                        <span>Putar {absDiff}° ke kanan</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={13} className="text-accent animate-spin-slow" />
                                        <span>Putar {absDiff}° ke kiri</span>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Lingkaran Kompas */}
                <div className="relative flex justify-center items-center w-[290px] h-[290px] sm:w-[320px] sm:h-[320px]">
                    {/* Jarum Penunjuk Arah Depan Ponsel (Fixed Top Reference Needle) */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none">
                        <div
                            className={`w-1.5 h-6 rounded-full transition-colors duration-300 ${
                                isAligned ? "bg-accent shadow-[0_0_12px_rgba(251,191,36,0.9)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                            }`}
                        />
                    </div>

                    {/* Bingkai Luar Kompas (Glassmorphism & Border Glow saat Selaras) */}
                    <div
                        className={`absolute w-[104%] h-[104%] rounded-full transition-all duration-500 backdrop-blur-md ${
                            isAligned
                                ? "border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                                : "border border-emerald-100/80 dark:border-white/15 bg-white/40 dark:bg-white/5 shadow-[0_15px_35px_rgba(4,120,87,0.08)]"
                        }`}
                    />

                    {/* Alas Dial Kompas */}
                    <div className="absolute w-full h-full rounded-full bg-white/80 dark:bg-zinc-900/90 shadow-[inset_0_4px_16px_rgba(0,0,0,0.04)] border border-emerald-50 dark:border-white/10 overflow-hidden" />

                    {/* Dial Kompas yang Berputar Mengikuti Hadap Ponsel */}
                    <motion.div
                        ref={compassRef}
                        className={`absolute w-full h-full rounded-full z-20 ${
                            isSensorActive ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"
                        }`}
                        animate={{ rotate: dialRotation }}
                        transition={{ type: "spring", damping: 25, stiffness: 180, mass: 0.6 }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {/* Poros Pusat */}
                        <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-colors shadow-md ${
                                isAligned ? "bg-accent shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "bg-emerald-700"
                            }`}
                        />

                        {/* Garis-Garis Detik/Derajat Dial (72 ticks) */}
                        {[...Array(72)].map((_, i) => (
                            <div
                                key={i}
                                className={`absolute top-2 left-1/2 -translate-x-1/2 w-px ${
                                    i % 18 === 0
                                        ? "h-3.5 bg-emerald-600 dark:bg-emerald-400"
                                        : i % 2 === 0
                                        ? "h-2 bg-emerald-300 dark:bg-emerald-600/70"
                                        : "h-1.5 bg-emerald-200/60 dark:bg-zinc-700"
                                } origin-[0_137px] sm:origin-[0_152px]`}
                                style={{ transform: `rotate(${i * 5}deg)` }}
                            />
                        ))}

                        {/* Huruf Mata Angin (N, S, E, W) */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 font-black text-red-500 dark:text-red-400 text-sm tracking-wider drop-shadow-xs">
                            N
                        </div>
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-bold text-emerald-900/40 dark:text-zinc-500 text-xs">
                            S
                        </div>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-emerald-900/40 dark:text-zinc-500 text-xs">
                            E
                        </div>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-emerald-900/40 dark:text-zinc-500 text-xs">
                            W
                        </div>

                        {/* Qibla Marker & Ka'bah Shape di posisi sudut kiblat sebenarnya */}
                        {qiblaAngle !== null && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ transform: `rotate(${qiblaAngle}deg)` }}
                            >
                                {/* Ka'bah Shape & Penunjuk Emas */}
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    {/* Segitiga Emas Penunjuk */}
                                    <div
                                        className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#d9a84e] mb-1 transition-transform ${
                                            isAligned ? "scale-110 drop-shadow-[0_0_8px_rgba(217,168,78,1)]" : "drop-shadow-sm"
                                        }`}
                                    />

                                    {/* Kubus Ka'bah */}
                                    <div
                                        className={`w-9 h-8 sm:w-10 sm:h-9 rounded-[6px] border-2 border-[#d9a84e] bg-zinc-950 flex flex-col justify-start items-center pt-1 shadow-xl transition-all duration-300 ${
                                            isAligned
                                                ? "shadow-[0_0_20px_rgba(217,168,78,0.9)] scale-105"
                                                : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                                        }`}
                                    >
                                        {/* Pita Emas Kiswah */}
                                        <div className="w-[85%] h-1 bg-[#d9a84e] rounded-xs shadow-xs" />
                                        {/* Pintu Ka'bah Kecil */}
                                        <div className="w-1.5 h-2 bg-[#d9a84e]/80 rounded-t-xs mt-auto mb-1 ml-auto mr-1.5" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {!isSensorActive && (
                    <p className="text-[11px] text-emerald-800/60 dark:text-zinc-400 mt-4 text-center">
                        Sensor orientasi pasif. Kompas dapat diputar manual untuk simulasi.
                    </p>
                )}
            </div>

            {/* Bottom Info Card: Derajat Kiblat, Jarak & Arah */}
            {qiblaAngle !== null && (
                <div className="mt-6 px-4 w-full">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 border border-emerald-900/10 dark:border-white/10 shadow-[0_8px_30px_rgba(4,120,87,0.06)] flex justify-between items-center">
                        {/* Sudut Kiblat */}
                        <div className="flex flex-col text-left">
                            <span className="text-[11px] font-medium text-emerald-800/70 dark:text-zinc-400">
                                Arah Kiblat
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl font-black text-emerald-950 dark:text-white">
                                    {Math.round(qiblaAngle)}°
                                </span>
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    Barat Laut
                                </span>
                            </div>
                        </div>

                        {/* Garis Pemisah */}
                        <div className="w-px h-9 bg-emerald-900/10 dark:bg-white/10" />

                        {/* Jarak ke Ka'bah */}
                        <div className="flex flex-col text-right">
                            <span className="text-[11px] font-medium text-emerald-800/70 dark:text-zinc-400">
                                Jarak ke Ka'bah
                            </span>
                            <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                <span className="text-2xl font-black text-emerald-950 dark:text-white">
                                    {distanceKm ? distanceKm.toLocaleString("id-ID") : "8.316"}
                                </span>
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    km
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
