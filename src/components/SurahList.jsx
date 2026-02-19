"use client";

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SurahList() {
    const [surahs, setSurahs] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            // Direct call or internal API route. For simplicity in Next.js CSR, we can fetch directly.
            // But CORS might be an issue if not proxying. AlQuran.cloud has CORS enabled.
            try {
                const res = await fetch("https://api.alquran.cloud/v1/surah");
                const data = await res.json();
                setSurahs(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    const filteredSurahs = surahs.filter(s =>
        s.englishName.toLowerCase().includes(search.toLowerCase()) ||
        s.name.includes(search) || // Arabic name
        s.englishNameTranslation.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse flex items-center gap-2 justify-center"><Loader2 className="size-4 text-primary animate-spin" /> Memuat daftar surah...</div>;

    return (
        <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Cari Surah..."
                    className="w-full glass rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid gap-3 pb-24">
                {filteredSurahs.map((surah) => (
                    <Link href={`/quran/${surah.number}`} key={surah.number}>
                        <div className="glass rounded-xl p-6 flex items-center justify-between group hover:bg-white/60 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    {/* Geometric Star/Number Container */}
                                    <div className="absolute inset-0 bg-primary/10 rotate-45 rounded-sm group-hover:rotate-0 group-hover:bg-primary transition-transform duration-500"></div>
                                    <span className="relative z-10 font-bold text-sm text-primary group-hover:text-white transition-colors duration-500">{surah.number}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-primary">{surah.englishName}</h3>
                                    <p className="text-xs text-muted-foreground">{surah.englishNameTranslation} • {surah.numberOfAyahs} Ayat</p>
                                </div>
                            </div>
                            <span className="font-amiri text-xl text-primary font-bold ">{surah.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
