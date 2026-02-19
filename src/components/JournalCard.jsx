"use client";

import { useState, useEffect } from "react";
import { Save, PenLine } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function JournalCard() {
    const [entry, setEntry] = useState("");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const todayKey = format(new Date(), "yyyy-MM-dd");
        const stored = localStorage.getItem(`ramadan-journal-${todayKey}`);
        if (stored) {
            setEntry(stored);
        }
    }, []);

    const handleSave = () => {
        const todayKey = format(new Date(), "yyyy-MM-dd");
        localStorage.setItem(`ramadan-journal-${todayKey}`, entry);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="glass rounded-2xl p-5 mb-6 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-3 text-secondary">
                <PenLine size={18} />
                <h3 className="font-bold text-sm">Refleksi Harian</h3>
            </div>

            <textarea
                className="w-full bg-white/40 focus:bg-white/60 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/20 transition-all resize-none h-24"
                placeholder="Apa yang kamu syukuri hari ini?"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
            />

            <div className="flex justify-end mt-2">
                <button
                    onClick={handleSave}
                    disabled={!entry.trim()}
                    className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isSaved
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isSaved ? "Tersimpan" : "Simpan"}
                    <Save size={14} />
                </button>
            </div>
        </div>
    );
}
