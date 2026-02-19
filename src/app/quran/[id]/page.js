"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSurah } from "@/lib/quran-api";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Heart, Copy, ChevronLeft, ArrowLeft, Bookmark, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Optimized Image Component for Arabic Calligraphy if needed
// For now, pure text rendering

export default function SurahDetail() {
    const params = useParams(); // Ensure params is defined
    const id = params?.id; // Safely access id
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playingIndex, setPlayingIndex] = useState(null);
    const [audio, setAudio] = useState(null);
    const [mode, setMode] = useState("read"); // "read" or "practice"

    const [memorized, setMemorized] = useState(new Set());

    // Initialize Audio only on client side
    useEffect(() => {
        setAudio(new Audio());
        // Load memorized ayahs
        const saved = localStorage.getItem("ramadan-memorized");
        if (saved) {
            setMemorized(new Set(JSON.parse(saved)));
        }
    }, []);

    // Calculate Progress
    const memorizedCount = data ? data.ayahs.filter(a => memorized.has(`${id}:${a.numberInSurah}`)).length : 0;
    const progress = (data && data.numberOfAyahs > 0) ? Math.round((memorizedCount / data.numberOfAyahs) * 100) : 0;

    useEffect(() => {
        async function load() {
            if (!id) return;
            setLoading(true);
            const surahData = await getSurah(id);
            setData(surahData);
            setLoading(false);
        }
        load();
    }, [id]);

    useEffect(() => {
        if (!audio) return;

        const handleEnded = () => setPlayingIndex(null);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audio]);

    const toggleMemorized = (ayahNumber) => {
        const key = `${id}:${ayahNumber}`;
        const newSet = new Set(memorized);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setMemorized(newSet);
        localStorage.setItem("ramadan-memorized", JSON.stringify([...newSet]));
    };

    const toggleAudio = (url, index) => {
        if (!audio) return;

        if (playingIndex === index) {
            audio.pause();
            setPlayingIndex(null);
        } else {
            audio.src = url;
            audio.play().catch(e => console.error("Audio play error:", e));
            setPlayingIndex(index);
        }
    };

    if (loading) return (
        <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center text-muted-foreground animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <p>Memuat Surah...</p>
        </div>
    );

    if (!data) return (
        <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center text-red-500">
            <p>Gagal memuat surah. Periksa koneksi internet.</p>
            <Link href="/quran" className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">Kembali</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground relative pb-20">

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 glass border-b border-border/40 px-4 py-3 shadow-sm backdrop-blur-xl flex flex-col gap-3 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <Link href="/quran" className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-base font-bold text-foreground">{data.englishName}</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{data.englishNameTranslation}</p>
                    </div>
                    {/* Mode Toggle */}
                    <button
                        onClick={() => setMode(mode === "read" ? "practice" : "read")}
                        className={cn(
                            "p-2 rounded-full transition-all duration-500",
                            mode === "practice" ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-black/5 text-muted-foreground hover:bg-black/10"
                        )}
                        title={mode === "read" ? "Mode Latihan" : "Mode Baca"}
                    >
                        {mode === "read" ? <GraduationCap size={20} /> : <BookOpen size={20} />}
                    </button>
                </div>

                {/* Progress Bar with Slide Animation */}
                <AnimatePresence>
                    {mode === "practice" && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-col gap-1.5 pb-1">
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium px-0.5">
                                    <span>{memorizedCount} / {data.numberOfAyahs} Ayat</span>
                                    <span>{progress}% Hafal</span>
                                </div>
                                <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-linear-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <main className="px-4 pt-6 max-w-md mx-auto">
                {/* Bismillah Header (Except At-Tawbah) */}
                {parseInt(id) !== 9 && (
                    <div className="text-center mb-8 py-6 relative">
                        <div className="absolute inset-x-10 top-1/2 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>
                        <span className="relative bg-background px-4 font-amiri text-2xl text-primary">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </span>
                    </div>
                )}

                {/* Ayahs */}
                <div className="flex flex-col gap-6">
                    {data.ayahs.map((ayah, index) => {
                        const isPlaying = playingIndex === index;
                        const isMemorized = memorized.has(`${id}:${ayah.numberInSurah}`);
                        const isBlurred = mode === "practice" && !isMemorized;

                        return (
                            <div
                                key={ayah.number}
                                className={cn(
                                    "relative group transition-all duration-300 rounded-2xl p-4 border",
                                    isPlaying
                                        ? "border-transparent bg-white/80 shadow-sm"
                                        : "bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/10"
                                )}
                            >
                                {/* Actions Toolbar */}
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs ring-2 ring-white">
                                            {ayah.numberInSurah}
                                        </span>
                                        <button
                                            onClick={() => toggleAudio(ayah.audio, index)}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95",
                                                isPlaying ? "bg-primary text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary"
                                            )}
                                        >
                                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Salin Ayat">
                                            <Bookmark size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleMemorized(ayah.numberInSurah)}
                                            className={cn("p-2 hover:bg-black/5 rounded-full transition-colors", isMemorized ? "text-red-500 fill-current" : "")}
                                            title="Tandai Sudah Hafal"
                                        >
                                            <Heart size={16} fill={isMemorized ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={cn("transition-all duration-500", isBlurred && "blur-md select-none opacity-50 pointer-events-none")}>
                                    <div className="text-right mb-4 pl-8">
                                        <p className="font-amiri text-3xl leading-[2.2] text-foreground" dir="rtl">
                                            {(ayah.numberInSurah === 1 && parseInt(id) !== 1 && parseInt(id) !== 9)
                                                ? ayah.text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "").trim()
                                                : ayah.text
                                            }
                                        </p>
                                    </div>

                                    <div className="text-sm leading-relaxed text-muted-foreground/90 font-sans">
                                        {ayah.translation}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Footer */}
                <div className="mt-12 mb-8 flex justify-between">
                    {parseInt(id) > 1 && (
                        <Link href={`/quran/${parseInt(id) - 1}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors pl-2">
                            ← Surah Sebelumnya
                        </Link>
                    )}
                    {parseInt(id) < 114 && (
                        <Link href={`/quran/${parseInt(id) + 1}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors pr-2">
                            Surah Berikutnya →
                        </Link>
                    )}
                </div>
            </main>
        </div>
    );
}
