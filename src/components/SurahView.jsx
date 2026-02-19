"use client";

import { useEffect, useState } from "react";
import { Copy, Heart, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";
import { getSurah } from "@/lib/quran-api";

export default function SurahView({ surahNumber }) {
    const [data, setData] = useState(null);
    const [playingAyah, setPlayingAyah] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        async function load() {
            const quranData = await getSurah(surahNumber);
            setData(quranData);
            setLoading(false);
        }
        load();

        // Load bookmarks (mock implementation for localStorage)
        // const saved = JSON.parse(localStorage.getItem("ramadan-quran-bookmarks") || "[]");
        // setBookmarks(saved);
    }, [surahNumber]);

    const toggleAudio = (index) => {
        if (playingAyah === index) {
            setPlayingAyah(null);
        } else {
            setPlayingAyah(index);
        }
    }

    const toggleBookmark = (ayatNumber) => {
        // Basic toggle implementation
        // setBookmarks via local storage
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat ayat...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Gagal memuat surah.</div>;

    return (
        <div className="flex flex-col gap-6 pb-24">
            {/* Surah Header */}
            <div className="bg-linear-to-br from-primary to-secondary rounded-2xl p-6 text-center text-white relative overflow-hidden shadow-lg">
                <h1 className="text-3xl font-bold mb-1">{data.englishName}</h1>
                <p className="opacity-90">{data.englishNameTranslation}</p>
                <div className="h-px w-20 bg-white/30 mx-auto my-3"></div>
                <p className="text-xs uppercase tracking-widest opacity-80">{data.revelationType} • {data.numberOfAyahs} Ayat</p>

                {/* Bismillah (except for At-Tawbah/9) */}
                {surahNumber !== 9 && (
                    <div className="font-amiri text-2xl mt-6">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                )}
            </div>

            {/* Ayahs List */}
            <div className="flex flex-col gap-4">
                {data.ayahs.map((ayah, index) => (
                    <div
                        key={ayah.number}
                        className={cn(
                            "glass rounded-xl p-5 border-l-4 transition-colors duration-300",
                            playingAyah === index ? "border-l-accent bg-accent/5 ring-1 ring-accent/20" : "border-l-transparent hover:border-l-primary/30"
                        )}
                    >
                        {/* Toolbar */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                    {ayah.numberInSurah}
                                </span>
                                <AudioPlayer
                                    audioUrl={ayah.audio}
                                    isPlaying={playingAyah === index}
                                    onToggle={() => toggleAudio(index)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="text-muted-foreground hover:text-primary transition-colors p-1" title="Favorit">
                                    <Heart size={18} />
                                </button>
                                <button className="text-muted-foreground hover:text-primary transition-colors p-1" title="Salin">
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Arabic Text */}
                        <p className="text-right font-amiri text-2xl/loose mb-4 text-foreground wrap-break-word" dir="rtl">
                            {ayah.text}
                        </p>

                        {/* Translation */}
                        <p className="text-sm/relaxed text-muted-foreground">
                            {ayah.translation}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
