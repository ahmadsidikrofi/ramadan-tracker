"use client";

import { Share2, Copy } from "lucide-react";
import { useState, useEffect } from "react";

const QUOTES = [
    { text: "Maka sesungguhnya bersama kesulitan ada kemudahan.", source: "QS. Al-Insyirah: 5" },
    { text: "Dan Dialah yang menerima taubat dari hamba-hamba-Nya.", source: "QS. Asy-Syura: 25" },
    { text: "Berlomba-lombalah kamu dalam berbuat kebaikan.", source: "QS. Al-Baqarah: 148" },
    { text: "Barangsiapa berpuasa Ramadan karena iman dan mengharap pahala dari Allah, niscaya diampuni dosa-dosanya yang telah lalu.", source: "HR. Bukhari & Muslim" },
];

export default function InspirationCard() {
    const [mounted, setMounted] = useState(false);
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        setMounted(true);
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    if (!mounted) {
        return <div className="glass-dark rounded-2xl p-6 mb-6 h-40 animate-pulse" />;
    }

    return (
        <div className="glass-dark rounded-2xl p-6 relative overflow-hidden mb-6 group hover:shadow-lg transition-all">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10 text-white">
                <div className="flex items-center gap-2 mb-3 opacity-80">
                    <span className="text-xs font-bold tracking-wider uppercase text-accent">Kutipian Hari Ini</span>
                </div>

                <blockquote className="text-xl font-medium leading-relaxed mb-4 font-serif italic">
                    "{quote.text}"
                </blockquote>

                <div className="flex justify-between items-end">
                    <cite className="text-sm font-medium not-italic opacity-90 block mt-2">
                        — {quote.source}
                    </cite>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Salin">
                            <Copy size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Bagikan">
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
