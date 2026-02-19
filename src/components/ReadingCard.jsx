"use client";

import { BookOpen, ChevronRight } from "lucide-react";

export default function ReadingCard() {
    return (
        <div className="glass rounded-2xl p-4 flex items-center justify-between mb-6 group cursor-pointer hover:bg-white/60 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-foreground">Lanjutkan Membaca</h3>
                    <p className="text-xs text-muted-foreground">Al-Fatiha, Ayat 1</p>
                </div>
            </div>
            <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
    );
}
