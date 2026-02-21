"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPinOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function getQiblaDirection(lat, lng) {
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLng = 39.8262 * Math.PI / 180;
    const userLat = lat * Math.PI / 180;
    const userLng = lng * Math.PI / 180;

    const dLng = kaabaLng - userLng;

    const x = Math.sin(dLng) * Math.cos(kaabaLat);
    const y =
        Math.cos(userLat) * Math.sin(kaabaLat) -
        Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(dLng);

    const bearing = Math.atan2(x, y) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

export default function QiblaCompass() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [qiblaAngle, setQiblaAngle] = useState(null);
    const [compassRotation, setCompassRotation] = useState(0);

    const compassRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startDragAngle, setStartDragAngle] = useState(0);
    const [startRotation, setStartRotation] = useState(0);

    // Prompt location
    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setErrorMsg("Geolocation tidak didukung oleh browser Anda.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocation({ lat, lng });
                const angle = getQiblaDirection(lat, lng);
                setQiblaAngle(angle);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setErrorMsg("Izin lokasi ditolak. Harap izinkan akses lokasi untuk mencari arah kiblat.");
                } else {
                    setErrorMsg("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
                }
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const handlePointerDown = (e) => {
        if (!compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setStartDragAngle(angle);
        setStartRotation(compassRotation);
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !compassRef.current) return;
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const delta = angle - startDragAngle;
        let newRot = (startRotation + delta) % 360;
        if (newRot < 0) newRot += 360;
        setCompassRotation(newRot);
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) { }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto pt-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 py-4 px-6 fixed top-0 w-full max-w-md bg-white/60 backdrop-blur-md z-50 border-b border-emerald-100">
                <button onClick={() => router.back()} className="text-emerald-900 p-2 hover:bg-emerald-50 rounded-full transition-colors -ml-2">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-[17px] font-bold text-center flex-1 pr-6 text-emerald-950 tracking-wide">Kompas Kiblat</h1>
            </div>

            {/* Content Body */}
            <div className="flex flex-col flex-1 justify-center items-center px-6 mt-20 relative">
                {errorMsg ? (
                    <div className="flex flex-col items-center text-center space-y-4 text-red-800 bg-red-50/80 backdrop-blur-md p-8 rounded-3xl border border-red-200 shadow-sm">
                        <MapPinOff size={48} className="text-red-500 mb-2" />
                        <p className="text-sm font-medium">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs font-bold mt-2 transition-all shadow-md">
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
                        <h2 className="text-emerald-800 text-xs sm:text-[13px] font-semibold mb-10 w-full text-center px-4 tracking-wide shadow-emerald-100 drop-shadow-sm">
                            Putar kompas secara manual untuk menyelaraskan N ke Utara
                        </h2>

                        {/* Compass Component Area */}
                        <div className="relative flex justify-center items-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">

                            {/* Static Red Needle (Device Heading Reference) */}
                            <div className="absolute top-[-10px] w-1 h-5 bg-red-600 rounded-sm z-30 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>

                            {/* Outer Frame ring */}
                            <div className="absolute w-[105%] h-[105%] rounded-full border border-emerald-100 bg-emerald-50/80 backdrop-blur-md shadow-[0_20px_50px_rgba(4,120,87,0.15)]"></div>

                            {/* Inner Compass Base */}
                            <div className="absolute w-full h-full rounded-full bg-white shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] border border-emerald-50 overflow-hidden"></div>

                            {/* Rotating Dial */}
                            <motion.div
                                ref={compassRef}
                                className="absolute w-full h-full rounded-full cursor-grab active:cursor-grabbing touch-none z-20"
                                style={{ rotate: compassRotation }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            >
                                {/* Center pivot */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-lg"></div>

                                {/* Tick marks */}
                                {[...Array(72)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-px ${i % 18 === 0 ? 'h-3 bg-emerald-400' : i % 2 === 0 ? 'h-2 bg-emerald-300' : 'h-1.5 bg-emerald-200/60'} origin-[0_134px] sm:origin-[0_154px]`}
                                        style={{ transform: `rotate(${i * 5}deg)` }}
                                    />
                                ))}

                                {/* Ordinal Labels */}
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 font-extrabold text-red-600 text-lg tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">N</div>
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-bold text-emerald-800/40 text-sm">S</div>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-emerald-800/40 text-sm">E</div>
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-emerald-800/40 text-sm ">W</div>

                                {/* Qibla Arrow Wrapper - placed exactly at calculated bearing relative to North */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ transform: `rotate(${qiblaAngle}deg)` }}
                                >
                                    {/* Kaaba Shape */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#d9a84e] mb-1" />
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

            {/* Bottom Info Card */}
            {location && qiblaAngle !== null && (
                <div className="mt-8 px-6 w-full">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[28px] p-8 flex flex-col items-center justify-center border border-white shadow-[0_8px_30px_rgb(4,120,87,0.1)] relative overflow-hidden">

                        {/* Shimmer gradient inside card */}
                        <div className="absolute -inset-10 bg-linear-to-r from-transparent hover:via-emerald-500/5 to-transparent skew-x-12 opacity-0 hover:opacity-100 transition-opacity pointer-events-none duration-1000"></div>

                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-extrabold text-emerald-800 tracking-tight drop-shadow-sm">
                                {Math.round(qiblaAngle)}°
                            </span>
                            <span className="text-emerald-950 font-bold tracking-wide text-base mt-2">Arah Kiblat</span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-emerald-600/80 uppercase mt-5">
                            Mode Manual
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
