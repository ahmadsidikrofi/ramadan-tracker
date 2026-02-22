"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Settings2, RotateCcw, Volume2, VolumeX, Vibrate, VibrateOff, Check, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const DZIKIR_OPTIONS = [
    { id: "subhanallah", name: "Subhanallah", arabic: "سُبْحَانَ ٱللَّٰهِ", meaning: "Maha Suci Allah" },
    { id: "alhamdulillah", name: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", meaning: "Segala Puji Bagi Allah" },
    { id: "allahu_akbar", name: "Allahu Akbar", arabic: "ٱللَّٰهُ أَكْبَرُ", meaning: "Allah Maha Besar" },
    { id: "astaghfirullah", name: "Astaghfirullah", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", meaning: "Aku memohon ampun kepada Allah" },
    { id: "la_ilaha_illallah", name: "La ilaha illallah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", meaning: "Tiada Tuhan selain Allah" },
    { id: "custom", name: "Kustom...", arabic: "", meaning: "Dzikir Kustom" }
];

const TARGETS = [33, 99, 1000]; // 1000 as practical "Unlimited" visually

// Helper for pure sine beep to avoid external assets overhead
let audioCtx = null;
const playSoftClick = (volume = 0.5) => {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) { }
}

const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
    }
}

export default function TasbihView() {
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [count, setCount] = useState(0);

    // Preferences
    const [selectedDzikirIdx, setSelectedDzikirIdx] = useState(0);
    const [customText, setCustomText] = useState("Salawat...");
    const [target, setTarget] = useState(33);
    const [soundOn, setSoundOn] = useState(true);
    const [vibrateOn, setVibrateOn] = useState(true);

    // UI States
    const [showSettings, setShowSettings] = useState(false);
    const [ripples, setRipples] = useState([]);
    const [beadMove, setBeadMove] = useState(0);

    // Init local storage
    useEffect(() => {
        setIsClient(true);
        try {
            const saved = localStorage.getItem("ramadan-tasbih");
            if (saved) {
                const p = JSON.parse(saved);
                if (p.selectedDzikirIdx !== undefined) setSelectedDzikirIdx(p.selectedDzikirIdx);
                if (p.customText) setCustomText(p.customText);
                if (p.target) setTarget(p.target);
                if (p.soundOn !== undefined) setSoundOn(p.soundOn);
                if (p.vibrateOn !== undefined) setVibrateOn(p.vibrateOn);
                if (p.count) setCount(p.count);
            }
        } catch (e) { }
    }, []);

    // Save state on change
    useEffect(() => {
        if (!isClient) return;
        localStorage.setItem("ramadan-tasbih", JSON.stringify({
            selectedDzikirIdx, customText, target, soundOn, vibrateOn, count
        }));
    }, [selectedDzikirIdx, customText, target, soundOn, vibrateOn, count, isClient]);


    const handleTap = (e) => {
        // Prevent click if we tap settings button overlay
        if (showSettings) return;

        // Visual Ripple
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
        const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

        const newRipple = { id: Date.now(), x, y };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 800);

        // Feedback
        if (soundOn) playSoftClick(0.3);
        if (vibrateOn) triggerHaptic();

        // Count logic: if target is not unlimited and reached, vibrate twice? 
        // For now just auto loop when reaching target, but vibrate heavily
        if (count + 1 === target && vibrateOn) {
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }

        setCount(prev => prev >= target && target !== 1000 ? 1 : prev + 1);

        // Advance bead animation
        setBeadMove(prev => (prev + 1) % 3);
    };

    const handleReset = (e) => {
        e.stopPropagation();
        setCount(0);
        if (vibrateOn) triggerHaptic();
    }

    const currentDzikir = DZIKIR_OPTIONS[selectedDzikirIdx];
    const currentName = currentDzikir.id === "custom" ? "Dzikir Kustom" : currentDzikir.name;
    const currentArabic = currentDzikir.id === "custom" ? customText : currentDzikir.arabic;
    const currentMeaning = currentDzikir.id === "custom" ? "" : `"${currentDzikir.meaning}"`;

    const progressPerc = target === 1000 ? 100 : Math.min((count / target) * 100, 100);

    const nextDzikir = (e) => {
        e.stopPropagation();
        setSelectedDzikirIdx((prev) => (prev + 1) % DZIKIR_OPTIONS.length);
        setCount(0);
    };

    const prevDzikir = (e) => {
        e.stopPropagation();
        setSelectedDzikirIdx((prev) => (prev - 1 + DZIKIR_OPTIONS.length) % DZIKIR_OPTIONS.length);
        setCount(0);
    };

    if (!isClient) return null; // Avoid hydration mismatch

    // Generate Bead Coordinates for SVG
    const beads = [];
    if (target !== 1000 && target <= 100) {
        // We only render individual beads if target isn't too large, 99 is still okay 
        for (let i = 0; i < target; i++) {
            const angle = (i / target) * Math.PI * 2 - Math.PI / 2; // Start from top (-90 deg)
            const cx = 50 + 46 * Math.cos(angle);
            const cy = 50 + 46 * Math.sin(angle);
            beads.push({ id: i, cx, cy });
        }
    }

    return (
        <div className="flex flex-col min-h-dvh w-full max-w-md mx-auto relative text-emerald-950 font-sans cursor-pointer" onClick={(e) => { if (!audioCtx) playSoftClick(0); handleTap(e); }}>

            {/* Header */}
            <div className="flex items-center gap-4 py-4 px-6 fixed top-0 w-full max-w-md bg-white z-40 shadow-sm">
                <button onClick={(e) => { e.stopPropagation(); router.back() }} className="text-emerald-900 p-2 hover:bg-emerald-50 rounded-full transition-colors -ml-2">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-[18px] font-bold text-emerald-950 tracking-wide">Tasbih Digital</h1>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setSoundOn(!soundOn) }}
                    className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-full transition-colors active:scale-95"
                >
                    {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} className="text-emerald-400" />}
                </button>
            </div>

            <div>
                <div className="flex-1 pt-24 pb-8 px-6 relative flex flex-col justify-between items-center w-full z-10 overflow-y-auto overflow-x-hidden pb-safe">
                    {/* Ripples Layer */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                        <AnimatePresence>
                            {ripples.map(r => (
                                <motion.span
                                    key={r.id}
                                    className="absolute bg-emerald-400/20 rounded-full pointer-events-none"
                                    initial={{ width: 0, height: 0, x: r.x, y: r.y, opacity: 1 }}
                                    animate={{ width: 400, height: 400, x: r.x - 200, y: r.y - 200, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Dzikir Carousel Picker */}
                    <div className="flex items-center justify-between w-full max-w-[320px] mb-6 sm:mb-8 z-10 pointer-events-auto">
                        <button onClick={prevDzikir} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full active:scale-90 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-emerald-900 text-[15px] select-none text-center">
                            {currentName}
                        </span>
                        <button onClick={nextDzikir} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full active:scale-90 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Counter Ring Section */}
                    <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full min-h-[250px] sm:min-h-[300px] pointer-events-none">
                        {/* Ring Container */}
                        <div className="relative w-[340px] h-[340px] sm:w-[300px] sm:h-[300px] flex items-center justify-center shrink-0">
                            <motion.div
                                key={count}
                                initial={{ scale: 1, opacity: 0.1 }}
                                animate={{ scale: 1.1, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-4 rounded-full bg-emerald-300 blur-2xl z-0 pointer-events-none"
                            ></motion.div>

                            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" viewBox="0 0 100 100">
                                {target === 1000 && (
                                    <circle cx="50" cy="50" r="46" fill="transparent" strokeWidth="2.5" className="stroke-emerald-100" />
                                )}

                                {target !== 1000 && beads.map((b) => {
                                    const isPassed = b.id <= count - 1;
                                    const isCurrent = b.id === count - 1;
                                    return (
                                        <circle
                                            key={b.id}
                                            cx={b.cx} cy={b.cy}
                                            r={target > 50 ? "1.5" : "2.5"}
                                            className={cn(
                                                "transition-colors duration-300",
                                                isPassed ? "fill-emerald-400" : "fill-emerald-100/80",
                                                isCurrent ? "fill-emerald-500 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]" : ""
                                            )}
                                        />
                                    );
                                })}

                                {count === 0 && target !== 1000 && (
                                    <polygon points="48,2 52,2 50,6" className="fill-emerald-500" />
                                )}

                                {target === 1000 && (
                                    <motion.circle
                                        cx="50" cy="50" r="46" fill="transparent" strokeWidth="3"
                                        className="transition-all duration-300 ease-out stroke-emerald-400 -rotate-90 origin-center"
                                        strokeDasharray="289"
                                        strokeDashoffset={289 - (289 * progressPerc) / 100}
                                        strokeLinecap="round"
                                    />
                                )}
                            </svg>

                            <div className="relative z-10 w-[78%] h-[78%] rounded-full bg-white/70 backdrop-blur-md border-[6px] border-emerald-100/50 shadow-[0_15px_40px_rgb(4,120,87,0.08)] flex flex-col items-center justify-center">
                                <div className="flex flex-col items-center justify-center">
                                    <motion.span
                                        className="text-8xl font-black text-emerald-950 tracking-tighter tabular-nums drop-shadow-sm leading-none"
                                        key={count}
                                        initial={{ y: -5, opacity: 0, scale: 0.9 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        {count}
                                    </motion.span>
                                    {target !== 1000 && (
                                        <span className="text-lg font-bold text-emerald-600/50 mt-1 uppercase tracking-widest">
                                            / {target}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls Row & Hint */}
                    <div className="flex flex-col w-full max-w-[320px] z-20 mt-auto pt-2 gap-3 sm:gap-5 pointer-events-none">

                        <div className="flex justify-between items-center w-full pointer-events-auto">
                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="p-4 bg-white hover:bg-emerald-50 active:scale-90 transition-all text-emerald-600 rounded-full shadow-md border border-emerald-100 group"
                                title="Reset Hitungan"
                            >
                                <RotateCcw size={22} className="group-active:-rotate-90 transition-transform duration-500" />
                            </button>

                            {/* Arabic Text & Meaning */}
                            <div className="h-[90px] sm:h-[110px] flex items-center justify-center w-full z-10 my-4 sm:my-6 pointer-events-none">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentDzikir.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col items-center text-center"
                                    >
                                        {currentArabic && (
                                            <p className="font-amiri text-3xl sm:text-4xl text-emerald-950 mb-2 leading-relaxed tracking-wide" dir="rtl">
                                                {currentArabic}
                                            </p>
                                        )}
                                        {currentMeaning && (
                                            <p className="text-xs sm:text-sm text-emerald-700/80 font-medium">
                                                {currentMeaning}
                                            </p>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Settings Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowSettings(true) }}
                                className="p-4 bg-white hover:bg-emerald-50 active:scale-95 transition-all text-emerald-600 rounded-full shadow-md border border-emerald-100 relative"
                                title="Pengaturan"
                            >
                                <Settings2 size={22} />
                                {target !== 1000 && (
                                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {target}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Helper Text */}
                        <p className="text-sm text-emerald-600/70 text-center leading-relaxed">
                            <span className="font-bold">Tip:</span> Coba sentuh di manapun pada layar untuk bertasbih.
                        </p>
                    </div>
                </div>
            </div>

            {/* Drawer Modal Settings */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettings(false)}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/40 backdrop-blur-[2px] p-2 sm:p-4 touch-none"
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-emerald-50 mb-0 pb-6 pointer-events-auto max-h-[85vh] overflow-y-auto"
                        >
                            {/* Drawer Handle */}
                            <div className="w-full flex justify-center pt-4 pb-2">
                                <div className="w-12 h-1.5"></div>
                            </div>

                            <div className="px-6 pb-2">
                                <h3 className="font-bold text-emerald-950 text-xl tracking-tight">Pengaturan Tasbih</h3>
                                <p className="text-xs text-emerald-700/60 font-medium">Sesuaikan bacaan dan target harianmu</p>
                            </div>

                            {/* Dzikir List Options */}
                            <div className="px-6 mt-4 flex flex-col gap-2">
                                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest pl-1">Pilihan Dzikir</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {DZIKIR_OPTIONS.map((dzikir, idx) => {
                                        const isSelected = selectedDzikirIdx === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedDzikirIdx(idx);
                                                    setCount(0); // Optional: reset count when switching dzikir
                                                }}
                                                className={cn(
                                                    "p-3 rounded-2xl border text-sm font-semibold transition-all text-left relative overflow-hidden",
                                                    isSelected ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm" : "bg-white border-emerald-50 text-emerald-900/60 hover:bg-emerald-50/50"
                                                )}
                                            >
                                                <span className="relative z-10">{dzikir.name}</span>
                                                {isSelected && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50 stroke-3" />}
                                            </button>
                                        )
                                    })}
                                </div>

                                <AnimatePresence>
                                    {currentDzikir.id === "custom" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-2"
                                        >
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-1 px-3 flex items-center gap-2">
                                                <Edit2 size={16} className="text-emerald-500" />
                                                <input
                                                    type="text"
                                                    value={customText}
                                                    onChange={(e) => setCustomText(e.target.value)}
                                                    placeholder="Tulis dzikir..."
                                                    className="w-full bg-transparent border-none py-3 text-sm font-semibold text-emerald-900 placeholder:text-emerald-300 focus:outline-none"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Targets */}
                            <div className="px-6 mt-6 flex flex-col gap-2">
                                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest pl-1">Target Putaran</h4>
                                <div className="flex gap-2">
                                    {TARGETS.map(t => {
                                        const isSelected = target === t;
                                        const isUnlimited = t === 1000;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setTarget(t)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-2xl border font-bold text-sm transition-all",
                                                    isSelected ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-white border-emerald-100 text-emerald-800 hover:bg-emerald-50"
                                                )}
                                            >
                                                {isUnlimited ? "∞ Bebas" : `${t}x`}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Submit Settings */}
                            <div className="px-6 mt-8">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="w-full bg-emerald-950 text-emerald-50 font-bold py-4 rounded-full active:scale-95 transition-transform"
                                >
                                    Selesai
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
