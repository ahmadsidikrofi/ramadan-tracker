"use client";

import { Heart, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DoaCard({ prayer }) {
    const [isCopied, setIsCopied] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleCopy = () => {
        const text = `${prayer.title}\n\n${prayer.arabic}\n\n${prayer.translation}`;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: prayer.title,
                    text: `${prayer.title}\n\n${prayer.arabic}\n\n${prayer.translation}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="glass p-6 rounded-3xl relative group hover:bg-white/60 transition-all duration-300 border border-white/20 shadow-sm hover:shadow-md">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full mb-2 uppercase tracking-wider">
                        {prayer.category}
                    </span>
                    <h3 className="font-bold text-lg text-foreground">{prayer.title}</h3>
                </div>
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-rose-500"
                >
                    <Heart size={20} className={cn("transition-colors", isFavorite ? "fill-rose-500 text-rose-500" : "")} />
                </button>
            </div>

            {/* Arabic */}
            <div className="text-right mb-6" dir="rtl">
                <p className="font-amiri text-3xl leading-[2.2] text-foreground">{prayer.arabic}</p>
            </div>

            {/* Transliteration */}
            {prayer.transliteration && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-primary italic leading-relaxed">
                        {prayer.transliteration}
                    </p>
                </div>
            )}

            {/* Translation */}
            <div className="mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    "{prayer.translation}"
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                    Sumber: {prayer.source}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
                >
                    <Copy size={14} />
                    {isCopied ? "Tersalin!" : "Salin"}
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
                >
                    <Share2 size={14} />
                    Bagikan
                </button>
            </div>
        </div>
    );
}
