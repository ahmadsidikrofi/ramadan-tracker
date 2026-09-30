"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, MapPinOff, Loader2, Compass, Hand } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue } from "framer-motion";

// Koordinat Ka'bah (Masjidil Haram, Mekkah, Arab Saudi)
// Lintang (Latitude): +21° 25' 21" LU (21.4225°)
// Bujur (Longitude): 39° 50' 34" BT (39.8428°)
const KAABA_COORDS = {
    lat: 21.4225,
    lng: 39.8428
};

function calculateQiblaDirection(userLat, userLng) {
    const kaabaLat = KAABA_COORDS.lat * (Math.PI / 180);
    const kaabaLng = KAABA_COORDS.lng * (Math.PI / 180);
    const lat = userLat * (Math.PI / 180);
    const lng = userLng * (Math.PI / 180);

    const dLng = kaabaLng - lng;
    const y = Math.sin(dLng) * Math.cos(kaabaLat);
    const x =
        Math.cos(lat) * Math.sin(kaabaLat) -
        Math.sin(lat) * Math.cos(kaabaLat) * Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

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

// Audio context helper (konsisten dengan TasbihView.jsx)
let audioCtx = null;
const playSoftClick = (volume = 0.4) => {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) { }
};

// Haptic feedback function (menggunakan pola TasbihView.jsx)
const triggerHapticFeedback = () => {
    // 1. Getaran fisik smartphone (Android Chrome / Web Vibration API)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
            navigator.vibrate(50);
        } catch (e) {
            try { navigator.vibrate([40, 30, 40]); } catch (err) { }
        }
    }

    // 2. Audio click tactile (iOS Safari & penegas tactile)
    playSoftClick(0.35);
};

export default function QiblaCompass() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [qiblaAngle, setQiblaAngle] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [isAligned, setIsAligned] = useState(false);

    // Mode Manual vs Sensor Otomatis (Default langsung sensor kompas HP aktif)
    const [isManualMode, setIsManualMode] = useState(false);
    const isManualModeRef = useRef(false);

    // Motion value untuk rotasi dial (hardware accelerated di GPU)
    const rotation = useMotionValue(0);

    // Refs untuk algoritma LERP smoothing & pencegahan race condition
    const qiblaAngleRef = useRef(null);
    const isAlignedRef = useRef(false);
    const targetRotRef = useRef(0);
    const currentRotRef = useRef(0);
    const hasAbsoluteRef = useRef(false);

    // Manual drag (desktop / laptop / opsi manual di HP)
    const compassRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startDragAngle, setStartDragAngle] = useState(0);
    const [startRotation, setStartRotation] = useState(0);

    // Sinkronkan qiblaAngle state ke ref
    useEffect(() => {
        qiblaAngleRef.current = qiblaAngle;
    }, [qiblaAngle]);

    // Sinkronkan isManualMode ke ref
    useEffect(() => {
        isManualModeRef.current = isManualMode;
    }, [isManualMode]);

    // Inisialisasi AudioContext pada interaksi pertama (unlock audio/vibrate policy di Chrome)
    useEffect(() => {
        const unlockUserGesture = () => {
            try {
                if (audioCtx && audioCtx.state === "suspended") {
                    audioCtx.resume();
                }
            } catch (e) { }
        };
        window.addEventListener("pointerdown", unlockUserGesture, { once: true, passive: true });
        window.addEventListener("touchstart", unlockUserGesture, { once: true, passive: true });
        return () => {
            window.removeEventListener("pointerdown", unlockUserGesture);
            window.removeEventListener("touchstart", unlockUserGesture);
        };
    }, []);

    // 1. Inisialisasi Lokasi (Cepat dari localStorage, lalu GPS presisi)
    useEffect(() => {
        let hasLocation = false;
        try {
            const saved = localStorage.getItem("ramadan-location");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.coordinate?.latitude && parsed.coordinate?.longitude) {
                    const lat = parsed.coordinate.latitude;
                    const lng = parsed.coordinate.longitude;
                    setLocation({ lat, lng });
                    setQiblaAngle(calculateQiblaDirection(lat, lng));
                    setDistanceKm(calculateKaabaDistance(lat, lng));
                    hasLocation = true;
                }
            }
        } catch (e) { }

        if (!("geolocation" in navigator)) {
            if (!hasLocation) {
                setErrorMsg("Geolocation tidak didukung oleh browser Anda.");
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocation({ lat, lng });
                setQiblaAngle(calculateQiblaDirection(lat, lng));
                setDistanceKm(calculateKaabaDistance(lat, lng));
                setErrorMsg(null);
            },
            (err) => {
                if (!hasLocation) {
                    if (err.code === err.PERMISSION_DENIED) {
                        setErrorMsg("Izin lokasi ditolak. Harap izinkan akses lokasi untuk mencari arah kiblat.");
                    } else {
                        setErrorMsg("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
                    }
                }
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    // Cek alignment dan trigger haptic feedback ketika menyentuh Q needle
    const checkAndTriggerAlignment = useCallback((rot) => {
        if (qiblaAngleRef.current === null) return;
        const screenDiff = ((qiblaAngleRef.current + rot + 540) % 360) - 180;
        const aligned = Math.abs(screenDiff) <= 4.0;

        if (aligned && !isAlignedRef.current) {
            isAlignedRef.current = true;
            setIsAligned(true);
            triggerHapticFeedback();
        } else if (!aligned && isAlignedRef.current) {
            isAlignedRef.current = false;
            setIsAligned(false);
        }
    }, []);

    // Proses data heading dari sensor dengan Continuous Angle Unwinding
    const processNewHeading = useCallback((heading) => {
        if (isManualModeRef.current) return;

        const rawTargetRot = -heading;
        const delta = ((rawTargetRot - targetRotRef.current + 540) % 360) - 180;
        targetRotRef.current = targetRotRef.current + delta;
    }, []);

    // 2. Sensor Orientasi Smartphone (Langsung aktif otomatis di Android tanpa klik)
    useEffect(() => {
        const handleAbsoluteOrientation = (e) => {
            if (e.alpha === null || typeof e.alpha === "undefined") return;
            hasAbsoluteRef.current = true;
            const heading = (360 - e.alpha + 360) % 360;
            processNewHeading(heading);
        };

        const handleStandardOrientation = (e) => {
            if (hasAbsoluteRef.current) return;

            let heading = null;
            if (typeof e.webkitCompassHeading !== "undefined" && e.webkitCompassHeading !== null) {
                // iOS Safari
                heading = e.webkitCompassHeading;
            } else if (e.absolute === true && e.alpha !== null && typeof e.alpha !== "undefined") {
                heading = (360 - e.alpha + 360) % 360;
            } else if (e.alpha !== null && typeof e.alpha !== "undefined") {
                heading = (360 - e.alpha + 360) % 360;
            }

            if (heading !== null && !isNaN(heading)) {
                processNewHeading(heading);
            }
        };

        const attachListeners = () => {
            window.addEventListener("deviceorientationabsolute", handleAbsoluteOrientation, true);
            window.addEventListener("deviceorientation", handleStandardOrientation, true);
        };

        const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (
            isIOS &&
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            // Khusus iOS 13+ membutuhkan izin interaksi pertama kali
            const handleTouchPrompt = async () => {
                try {
                    const state = await DeviceOrientationEvent.requestPermission();
                    if (state === "granted") {
                        attachListeners();
                    }
                } catch (e) { }
                window.removeEventListener("touchstart", handleTouchPrompt);
            };
            window.addEventListener("touchstart", handleTouchPrompt, { once: true });
        } else {
            // Android & Desktop: LANGSUNG AKTIFKAN SENSOR TANPA HARUS KLIK
            attachListeners();
        }

        return () => {
            window.removeEventListener("deviceorientationabsolute", handleAbsoluteOrientation, true);
            window.removeEventListener("deviceorientation", handleStandardOrientation, true);
        };
    }, [processNewHeading]);

    // 3. Animation Frame Loop: LERP Filter + Deadzone + Magnetic Snap
    useEffect(() => {
        let animId;

        const tick = () => {
            if (!isManualModeRef.current) {
                const current = currentRotRef.current;
                let target = targetRotRef.current;

                // Magnetic Snap: saat arah Ka'bah mendekati tanda Q (< 2.5°),
                // kunci secara magnetis agar stabil
                if (qiblaAngleRef.current !== null) {
                    const alignDiff = ((qiblaAngleRef.current + target + 540) % 360) - 180;
                    if (Math.abs(alignDiff) <= 2.5) {
                        target = target - alignDiff;
                    }
                }

                const diff = target - current;

                // Deadzone: jika perubahan sangat kecil (< 0.06°), pertahankan posisi diam
                if (Math.abs(diff) > 0.06) {
                    const next = current + diff * 0.14;
                    currentRotRef.current = next;
                    rotation.set(next);
                }

                // Selalu evaluasi keselarasan pada frame saat ini
                checkAndTriggerAlignment(currentRotRef.current);
            }

            animId = requestAnimationFrame(tick);
        };

        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [rotation, checkAndTriggerAlignment]);

    // 4. Manual Drag (Khusus Laptop / PC atau ketika user menekan tombol Mode Manual)
    const handlePointerDown = (e) => {
        if (!isManualModeRef.current) return;
        if (!compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setStartDragAngle(angle);
        setStartRotation(currentRotRef.current);
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !isManualModeRef.current || !compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const delta = angle - startDragAngle;
        let newRot = startRotation + delta;

        // Magnetic snap saat drag manual mendekati tanda Q
        if (qiblaAngleRef.current !== null) {
            const alignDiff = ((qiblaAngleRef.current + newRot + 540) % 360) - 180;
            if (Math.abs(alignDiff) <= 3.0) {
                newRot = newRot - alignDiff;
            }
        }

        currentRotRef.current = newRot;
        rotation.set(newRot);
        checkAndTriggerAlignment(newRot);
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) { }
    };

    // Toggle antara Mode Manual dan Sensor Kompas Otomatis
    const toggleManualMode = () => {
        setIsManualMode((prev) => {
            const nextMode = !prev;
            isManualModeRef.current = nextMode;
            return nextMode;
        });
    };

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto pt-6 pb-8">
            {/* Header persis tampilan sebelumnya */}
            <div className="flex items-center gap-4 py-4 px-6 fixed top-0 w-full max-w-md bg-white/60 backdrop-blur-md z-50 border-b border-emerald-100">
                <button
                    onClick={() => router.back()}
                    className="text-emerald-900 p-2 hover:bg-emerald-50 rounded-full transition-colors -ml-2 cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-[17px] font-bold text-center flex-1 pr-6 text-emerald-950 tracking-wide">
                    Kompas Kiblat
                </h1>
            </div>

            {/* Content Body */}
            <div className="flex flex-col flex-1 justify-center items-center px-6 mt-20 relative">
                {errorMsg ? (
                    <div className="flex flex-col items-center text-center space-y-4 text-red-800 bg-red-50/80 backdrop-blur-md p-8 rounded-3xl border border-red-200 shadow-sm">
                        <MapPinOff size={48} className="text-red-500 mb-2" />
                        <p className="text-sm font-medium">{errorMsg}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs font-bold mt-2 transition-all shadow-md cursor-pointer"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : !location || qiblaAngle === null ? (
                    <div className="flex flex-col items-center text-center space-y-5 text-emerald-800/80">
                        <Loader2 size={42} className="animate-spin text-emerald-500" />
                        <p className="text-[13px] font-medium tracking-wide">Mencari lokasi akurat...</p>
                    </div>
                ) : (
                    <>
                        {/* Text Instruksi & Tombol Toggle Mode */}
                        <div className="mb-8 w-full text-center px-4">
                            <div className="mb-4 w-full text-center px-4">
                                <h2 className="text-emerald-900 text-xs sm:text-[13px] font-semibold tracking-wide">
                                    {isManualMode
                                        ? "Arahkan HP hingga Ka'bah sejajar dengan tanda Q"
                                        : "Putar kompas secara manual untuk menyelaraskan ke tanda Q"}
                                </h2>
                                {/* {!isManualMode && (
                                    <p className="text-[11px] text-emerald-700/80 font-medium mt-1.5 tracking-normal">
                                        atau <span className="font-semibold text-emerald-900 underline decoration-emerald-400/50 underline-offset-2">gunakan HP</span> untuk mendapatkan informasi yang lebih akurat
                                    </p>
                                )} */}
                            </div>

                            {/* Tombol kecil mode manual / sensor kompas */}
                            <div className="mb-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={toggleManualMode}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer border ${isManualMode
                                        ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20 active:scale-95"
                                        : "bg-white/80 text-emerald-900 border-emerald-200 hover:bg-emerald-50 backdrop-blur-xs active:scale-95"
                                        }`}
                                >
                                    {isManualMode ? (
                                        <>
                                            <Compass size={14} className="text-emerald-200" />
                                            <span>Aktifkan Sensor HP</span>
                                        </>
                                    ) : (
                                        <>
                                            <Hand size={14} className="text-emerald-700" />
                                            <span>Gunakan Mode Manual</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Compass Component Area */}
                        <div className="relative flex justify-center items-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
                            {/* Device Heading Reference: Needle with Latin 'Q' (Cinzel Classical Serif) on top */}
                            <div className="absolute top-[-44px] flex flex-col items-center z-30 pointer-events-none">
                                {/* Huruf Q (Qiblat) - Font Latin Klasik Cinzel */}
                                <span
                                    className={`${isAligned
                                        ? "text-[#d9a84e] drop-shadow-[0_0_15px_rgba(217,168,78,0.95)] scale-115"
                                        : "text-red-600 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
                                        }`}
                                >
                                    <span className="my-3 font-cinzel text-xl font-black tracking-widest transition-all duration-300 select-none">Q</span>
                                </span>
                                {/* Static Needle Pointer */}
                                <div
                                    className={`w-1.5 h-5 rounded-sm transition-all duration-200 mt-1 ${isAligned
                                        ? "bg-[#d9a84e] shadow-[0_0_15px_rgba(217,168,78,0.9)] scale-110"
                                        : "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                        }`}
                                />
                            </div>

                            {/* Outer Frame ring */}
                            <div className="absolute w-[105%] h-[105%] rounded-full border border-emerald-100 bg-emerald-50/80 backdrop-blur-md shadow-[0_20px_50px_rgba(4,120,87,0.15)]" />

                            {/* Inner Compass Base */}
                            <div className="absolute w-full h-full rounded-full bg-white shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] border border-emerald-50 overflow-hidden" />

                            {/* Rotating Dial */}
                            <motion.div
                                ref={compassRef}
                                className={`absolute w-full h-full rounded-full z-20 ${!isManualMode ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"
                                    }`}
                                style={{ rotate: rotation }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            >
                                {/* Center pivot */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-lg" />

                                {/* Tick marks */}
                                {[...Array(72)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-px ${i % 18 === 0
                                            ? "h-3 bg-emerald-400"
                                            : i % 2 === 0
                                                ? "h-2 bg-emerald-300"
                                                : "h-1.5 bg-emerald-200/60"
                                            } origin-[0_134px] sm:origin-[0_154px]`}
                                        style={{ transform: `rotate(${i * 5}deg)` }}
                                    />
                                ))}

                                {/* Ordinal Labels */}
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 font-extrabold text-red-600 text-lg tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">
                                    N
                                </div>
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-bold text-emerald-800/40 text-sm">
                                    S
                                </div>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-emerald-800/40 text-sm">
                                    E
                                </div>
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-emerald-800/40 text-sm">
                                    W
                                </div>

                                {/* Qibla Arrow Wrapper - placed exactly at calculated bearing relative to North */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ transform: `rotate(${qiblaAngle}deg)` }}
                                >
                                    {/* Kaaba Shape */}
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-200 ${isAligned
                                        ? "drop-shadow-[0_0_16px_rgba(217,168,78,0.95)] scale-105"
                                        : "drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                        }`}>
                                        <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#d9a84e] mb-1 transition-transform ${isAligned ? "scale-110" : ""
                                            }`} />
                                        <div className="w-10 h-9 rounded-[7px] border-2 border-[#d9a84e] bg-black flex justify-center pt-1 shadow-2xl">
                                            <div className="w-full h-1 bg-[#d9a84e] px-1 opacity-90 mx-px" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Info Card - Sesuai tampilan sebelumnya + Jarak ke Ka'bah */}
            {location && qiblaAngle !== null && (
                <div className="mt-8 px-6 w-full">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 flex flex-col items-center justify-center border border-white shadow-[0_8px_30px_rgb(4,120,87,0.1)] relative overflow-hidden">
                        {/* Shimmer gradient inside card */}
                        <div className="absolute -inset-10 bg-linear-to-r from-transparent hover:via-emerald-500/5 to-transparent skew-x-12 opacity-0 hover:opacity-100 transition-opacity pointer-events-none duration-1000" />

                        {/* Arah & Jarak Kiblat */}
                        <div className="w-full flex items-center justify-around py-1">
                            {/* Arah Kiblat */}
                            <div className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-tight drop-shadow-sm">
                                    {Math.round(qiblaAngle)}°
                                </span>
                                <span className="text-emerald-950 font-bold tracking-wide text-xs sm:text-sm mt-1">
                                    Arah Kiblat
                                </span>
                            </div>

                            {/* Separator vertical */}
                            <div className="w-px h-10 bg-emerald-200/60" />

                            {/* Jarak ke Ka'bah */}
                            <div className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-tight drop-shadow-sm">
                                    {distanceKm ? distanceKm.toLocaleString("id-ID") : "8.316"}
                                </span>
                                <span className="text-emerald-950 font-bold tracking-wide text-xs sm:text-sm mt-1">
                                    km ke Ka'bah
                                </span>
                            </div>
                        </div>

                        {/* Mode Indicator Badge */}
                        <div className="flex items-center gap-1.5 mt-5">
                            <span className={`w-1.5 h-1.5 rounded-full ${!isManualMode ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-emerald-700 uppercase">
                                {!isManualMode ? "Sensor Kompas Otomatis" : "Mode Manual Aktif"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
