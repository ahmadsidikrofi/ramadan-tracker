"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Download, X, CheckCircle2, Flame, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { toPng } from "html-to-image";
import Image from "next/image";

const TASKS = [
    { id: "subuh", label: "Shalat Subuh" },
    { id: "zuhur", label: "Shalat Zuhur" },
    { id: "ashar", label: "Shalat Ashar" },
    { id: "maghrib", label: "Shalat Maghrib" },
    { id: "isya", label: "Shalat Isya" },
    { id: "tarawih", label: "Shalat Tarawih" },
    { id: "tadarus", label: "Tadarus Al-Qur'an" },
];

export default function ShareProgress({ selectedDate, completedTasks, isFasting, isOpen, onClose }) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [streak, setStreak] = useState(0);

    // Assumption: Ramadan starts around March 1st 2025 for this example, or we just rely on date diff
    // Alternatively, we can just display the date.
    // Let's calculate typical streak
    useEffect(() => {
        if (!isOpen) return;

        let currentStreak = 0;
        let checkDate = new Date(selectedDate);

        // Loop backwards to find streak of days with > 0 tasks or fasting
        for (let i = 0; i < 30; i++) {
            const dateKey = format(checkDate, "yyyy-MM-dd");
            const storedTasks = localStorage.getItem(`ramadan-tracker-${dateKey}`);
            const storedFasting = localStorage.getItem(`ramadan-fasting-${dateKey}`);

            const hasTasks = storedTasks && JSON.parse(storedTasks).length > 0;
            const hasFasting = storedFasting === "true";

            // For the selected day, we use the props because it might not be strictly saved yet
            if (i === 0) {
                if (completedTasks.length > 0 || isFasting) {
                    currentStreak++;
                } else {
                    break;
                }
            } else {
                if (hasTasks || hasFasting) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            checkDate = subDays(checkDate, 1);
        }
        setStreak(currentStreak);
    }, [isOpen, selectedDate, completedTasks, isFasting]);

    if (!isOpen) return null;

    const formattedDate = format(selectedDate, "EEEE, d MMMM yyyy", { locale: id });

    const handleShare = async () => {
        const text = `Progress Ramadan saya tanggal ${formattedDate}!\n\n` +
            `🌙 Puasa: ${isFasting ? "Selesai ✅" : "Tidak ❌"}\n` +
            `📝 Aktivitas: ${completedTasks.length}/${TASKS.length} Selesai\n` +
            `🔥 Streak: ${streak} Hari\n\n` +
            `Mari tingkatkan ibadah bersama di bulan yang suci ini! #RamadanTracker`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Progress Ramadan',
                    text: text,
                });
            } catch (err) {
                console.log("Error sharing:", err);
            }
        } else {
            // Fallback copy to clipboard
            navigator.clipboard.writeText(text);
            alert("Teks progress disalin ke clipboard!");
        }
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
            });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `Ramadan-Progress-${format(selectedDate, "yyyy-MM-dd")}.png`;
            link.click();
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm sm:p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-emerald-50">
                    <h3 className="font-bold text-emerald-900">Bagikan Progress</h3>
                    <button onClick={onClose} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Card Preview Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-emerald-50/50 flex justify-center items-center">

                    {/* The Card to be captured */}
                    <div
                        ref={cardRef}
                        className="w-full max-w-sm bg-linear-to-bl from-emerald-800 via-emerald-900 to-emerald-950 p-6 rounded-4xl shadow-2xl relative overflow-hidden border border-emerald-700/50"
                    >
                        {/* Decorative Giant Moon Background */}
                        <Moon size={280} className="absolute -bottom-16 -left-12 text-emerald-700/30 -rotate-12" strokeWidth={1} />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col gap-6">
                            {/* Card Header & Logo */}
                            <div className="text-center flex flex-col items-center">
                                <Image src="/android-chrome-512x512.png" alt="Ramadan Tracker" width={64} height={64} className="rounded-full mb-3 shadow-lg border-2 border-emerald-700 bg-white" />
                                <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Jurnal Ramadan</h2>
                                <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">{formattedDate}</p>

                                {/* Badge Pencapaian Streak */}
                                {streak >= 3 && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 bg-linear-to-r from-amber-400 to-amber-500 text-emerald-950 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                                        <Flame size={12} className="fill-emerald-950" /> {streak} Hari Konsisten!
                                    </div>
                                )}
                            </div>

                            {/* Progress Visual Sederhana */}
                            <div className="bg-emerald-950/40 backdrop-blur-md rounded-2xl p-5 shadow-inner border border-emerald-800/60">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-emerald-100 font-bold text-sm">Pencapaian Hari Ini</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-amber-400">{completedTasks.length + (isFasting ? 1 : 0)}</span>
                                        <span className="text-emerald-500 font-bold text-xs">/ {TASKS.length + 1}</span>
                                    </div>
                                </div>
                                {/* Simple Progress Bar */}
                                <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden shadow-inner border border-emerald-900/50">
                                    <div
                                        className="h-full bg-linear-to-r from-amber-300 to-amber-500 rounded-full transition-all"
                                        style={{ width: `${((completedTasks.length + (isFasting ? 1 : 0)) / (TASKS.length + 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="bg-emerald-950/40 backdrop-blur-md rounded-2xl p-4 shadow-inner border border-emerald-800/60 grid grid-cols-2 gap-y-3 gap-x-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", isFasting ? "bg-amber-400 text-emerald-950" : "bg-emerald-900 text-emerald-600 border border-emerald-800")}>
                                        <CheckCircle2 size={12} />
                                    </div>
                                    <span className={cn("text-xs font-semibold truncate", isFasting ? "text-white" : "text-emerald-500")}>Puasa Harian</span>
                                </div>
                                {TASKS.map(task => {
                                    const isDone = completedTasks.includes(task.id);
                                    return (
                                        <div key={task.id} className="flex items-center gap-2">
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", isDone ? "bg-amber-400 text-emerald-950" : "bg-emerald-900 text-emerald-600 border border-emerald-800")}>
                                                <CheckCircle2 size={12} />
                                            </div>
                                            <span className={cn("text-xs font-semibold truncate", isDone ? "text-white" : "text-emerald-500")}>{task.label}</span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Emotional Footer Microcopy */}
                            <div className="text-center pt-3 border-t border-emerald-800/50 mt-1">
                                <p className="text-xs text-emerald-200/80 font-medium italic">
                                    "Semoga setiap langkah kecil ini <br /> membawamu lebih dekat pada-Nya."
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-amber-500/60 font-bold tracking-widest uppercase">
                                    <Sparkles size={10} /> Amal.in
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all"
                    >
                        <Share2 size={18} />
                        Bagikan Teks
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-70"
                    >
                        <Download size={18} />
                        {isGenerating ? "Menyimpan..." : "Unduh Gambar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
