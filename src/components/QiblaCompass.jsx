"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, MapPinOff, Loader2 } from "lucide-react";
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

export default function QiblaCompass() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [qiblaAngle, setQiblaAngle] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [isAligned, setIsAligned] = useState(false);

    // Sensor status
    const [isSensorActive, setIsSensorActive] = useState(false);

    // Motion value untuk rotasi dial (hardware accelerated, tanpa lag & tanpa re-render berlebihan)
    const rotation = useMotionValue(0);

    // Refs untuk algoritma smoothing LERP & pencegahan race condition
    const qiblaAngleRef = useRef(null);
    const isSensorActiveRef = useRef(false);
    const isAlignedRef = useRef(false);
    const targetRotRef = useRef(0);
    const currentRotRef = useRef(0);
    const hasAbsoluteRef = useRef(false);
    const lastVibratedRef = useRef(false);

    // Manual drag (desktop / laptop)
    const compassRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startDragAngle, setStartDragAngle] = useState(0);
    const [startRotation, setStartRotation] = useState(0);

    // Sinkronkan qiblaAngle state ke ref untuk diakses aman dalam loop animasi rAF
    useEffect(() => {
        qiblaAngleRef.current = qiblaAngle;
    }, [qiblaAngle]);

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

    // Haptic & Tactile Feedback saat Ka'bah mengunci ke Needle
    const triggerHaptic = useCallback(() => {
        // 1. Getaran fisik smartphone (Android Chrome / Web Vibration API)
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
                navigator.vibrate([60, 40, 60]);
            } catch (e) { }
        }

        // 2. Tactile audio tick (iOS Safari / browser tanpa navigator.vibrate)
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                if (ctx.state === "suspended") {
                    ctx.resume();
                }
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            }
        } catch (e) { }
    }, []);

    // Proses data heading dari sensor dengan Continuous Angle Unwinding (mencegah kompas berputar 360 derajat)
    const processNewHeading = useCallback((heading) => {
        if (!isSensorActiveRef.current) {
            isSensorActiveRef.current = true;
            setIsSensorActive(true);
            targetRotRef.current = -heading;
            currentRotRef.current = -heading;
            rotation.set(-heading);
            return;
        }

        const rawTargetRot = -heading;
        // Hitung delta sudut terpendek (shortest path) agar rotasi kontinu tanpa melompat saat melewati 0°/360°
        const delta = ((rawTargetRot - targetRotRef.current + 540) % 360) - 180;
        targetRotRef.current = targetRotRef.current + delta;
    }, [rotation]);

    // 2. Sensor Orientasi Smartphone
    useEffect(() => {
        const handleAbsoluteOrientation = (e) => {
            if (e.alpha === null || typeof e.alpha === "undefined") return;
            hasAbsoluteRef.current = true;

            // Android Chrome deviceorientationabsolute mengacu ke Utara Sejati bumi
            const heading = (360 - e.alpha + 360) % 360;
            processNewHeading(heading);
        };

        const handleStandardOrientation = (e) => {
            // PENTING: Jika deviceorientationabsolute sudah aktif, abaikan deviceorientation agar tidak saling bertabrakan
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

        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            // iOS 13+ permission via touch
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
            attachListeners();
        }

        return () => {
            window.removeEventListener("deviceorientationabsolute", handleAbsoluteOrientation, true);
            window.removeEventListener("deviceorientation", handleStandardOrientation, true);
        };
    }, [processNewHeading]);

    // 3. Animation Frame Loop: Low-Pass Filter (LERP) + Deadzone + Magnetic Snap
    useEffect(() => {
        let animId;

        const tick = () => {
            if (isSensorActiveRef.current) {
                const current = currentRotRef.current;
                let target = targetRotRef.current;

                // Magnetic Snap: saat arah Ka'bah sudah dekat dengan needle (< 2.5°),
                // kunci secara magnetis agar tidak berguncang oleh tremor tangan
                if (qiblaAngleRef.current !== null) {
                    const alignDiff = ((qiblaAngleRef.current + target + 540) % 360) - 180;
                    if (Math.abs(alignDiff) <= 2.5) {
                        target = target - alignDiff;
                    }
                }

                const diff = target - current;

                // Deadzone: Jika selisih sangat kecil (< 0.08°), hentikan kompas agar diam sempurna
                if (Math.abs(diff) > 0.08) {
                    // LERP factor 0.14 memberikan transisi mulus tanpa osilasi atau lagging
                    const next = current + diff * 0.14;
                    currentRotRef.current = next;
                    rotation.set(next);

                    // Evaluasi keselarasan needle dengan Ka'bah
                    if (qiblaAngleRef.current !== null) {
                        const screenDiff = ((qiblaAngleRef.current + next + 540) % 360) - 180;
                        const aligned = Math.abs(screenDiff) <= 3.5;

                        if (aligned !== isAlignedRef.current) {
                            isAlignedRef.current = aligned;
                            setIsAligned(aligned);

                            if (aligned && !lastVibratedRef.current) {
                                lastVibratedRef.current = true;
                                triggerHaptic();
                            } else if (!aligned) {
                                lastVibratedRef.current = false;
                            }
                        }
                    }
                }
            }

            animId = requestAnimationFrame(tick);
        };

        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [rotation, triggerHaptic]);

    // 4. Manual Drag (Khusus Laptop / PC ketika sensor fisik tidak aktif)
    const handlePointerDown = (e) => {
        if (isSensorActiveRef.current) return;
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
        if (!isDragging || isSensorActiveRef.current || !compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const delta = angle - startDragAngle;
        let newRot = startRotation + delta;

        // Magnetic snap saat drag manual mendekati needle
        if (qiblaAngleRef.current !== null) {
            const alignDiff = ((qiblaAngleRef.current + newRot + 540) % 360) - 180;
            if (Math.abs(alignDiff) <= 3.0) {
                newRot = newRot - alignDiff;
            }
        }

        currentRotRef.current = newRot;
        rotation.set(newRot);

        // Evaluasi alignment
        if (qiblaAngleRef.current !== null) {
            const screenDiff = ((qiblaAngleRef.current + newRot + 540) % 360) - 180;
            const aligned = Math.abs(screenDiff) <= 3.5;
            if (aligned !== isAlignedRef.current) {
                isAlignedRef.current = aligned;
                setIsAligned(aligned);
                if (aligned && !lastVibratedRef.current) {
                    lastVibratedRef.current = true;
                    triggerHaptic();
                } else if (!aligned) {
                    lastVibratedRef.current = false;
                }
            }
        }
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) { }
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
                        <div className="mb-8 w-full text-center px-4">
                            <h2 className="text-emerald-900 text-xs sm:text-[13px] font-semibold tracking-wide">
                                {isSensorActive
                                    ? "Arahkan HP hingga Ka'bah berada di posisi atas"
                                    : "Putar kompas secara manual untuk menyelaraskan N ke Utara"}
                            </h2>
                            {!isSensorActive && (
                                <p className="text-[11px] text-emerald-700/80 font-medium mt-1.5 tracking-normal">
                                    atau <span className="font-semibold text-emerald-900 underline decoration-emerald-400/50 underline-offset-2">gunakan HP</span> untuk mendapatkan informasi yang lebih akurat
                                </p>
                            )}
                        </div>

                        {/* Compass Component Area */}
                        <div className="relative flex justify-center items-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
                            {/* Static Red / Gold Needle (Device Heading Reference) */}
                            <div className={`absolute top-[-10px] w-1.5 h-5 rounded-sm z-30 transition-all duration-200 ${
                                isAligned
                                    ? "bg-[#d9a84e] shadow-[0_0_15px_rgba(217,168,78,0.9)] scale-110"
                                    : "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                            }`} />

                            {/* Outer Frame ring */}
                            <div className="absolute w-[105%] h-[105%] rounded-full border border-emerald-100 bg-emerald-50/80 backdrop-blur-md shadow-[0_20px_50px_rgba(4,120,87,0.15)]" />

                            {/* Inner Compass Base */}
                            <div className="absolute w-full h-full rounded-full bg-white shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] border border-emerald-50 overflow-hidden" />

                            {/* Rotating Dial */}
                            <motion.div
                                ref={compassRef}
                                className={`absolute w-full h-full rounded-full z-20 ${
                                    isSensorActive ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"
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
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-200 ${
                                        isAligned
                                            ? "drop-shadow-[0_0_16px_rgba(217,168,78,0.95)] scale-105"
                                            : "drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                    }`}>
                                        <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#d9a84e] mb-1 transition-transform ${
                                            isAligned ? "scale-110" : ""
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
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-emerald-600/80 uppercase mt-5">
                            {isSensorActive ? "Kompas Otomatis" : "Mode Manual"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
