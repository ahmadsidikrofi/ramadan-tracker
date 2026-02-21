"use client";

import { useState, useEffect } from "react";
import {
    Search, Heart, Copy, Share2,
    ChevronLeft, ChevronRight, BookOpen,
    User, ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "puasa", label: "Puasa", keywords: ["puasa", "shaum", "ramadhan", "buka", "sahur", "lapar", "haus"] },
    { id: "kebaikan", label: "Kebaikan", keywords: ["baik", "kebaikan", "amal", "sedekah", "pemberian", "menolong", "pahala", "senyum", "akhlak"] },
    { id: "sunnah", label: "Sunnah", keywords: ["sunnah", "rasul", "nabi", "mengikuti", "anjuran"] },
    // { id: "pernikahan", label: "Pernikahan", keywords: ["nikah", "istri", "suami", "menikah", "jodoh", "keluarga", "cerai"] }
];

export default function HadisPage() {
    const [hadiths, setHadiths] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [dailyHadith, setDailyHadith] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [copiedId, setCopiedId] = useState(null);

    // Fetch Data
    const fetchHadiths = async (page) => {
        setLoading(true);
        try {
            const res = await fetch(`https://hadith-api-go.vercel.app/api/v1/hadis?page=${page}`);
            const data = await res.json();

            if (data.status === "success" && data.data) {
                setHadiths(data.data);
                setPagination(data.pagination);

                // Set daily hadith randomly from page 1 if not set
                if (!dailyHadith || page === 1) {
                    const randomIndex = Math.floor(Math.random() * data.data.length);
                    setDailyHadith(data.data[randomIndex]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch hadiths:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHadiths(1);

        // Load favorites from local storage
        const savedFavorites = localStorage.getItem("ramadan-favorites-hadis");
        if (savedFavorites) {
            setFavorites(new Set(JSON.parse(savedFavorites)));
        }
    }, []);

    const toggleFavorite = (id) => {
        const newSet = new Set(favorites);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setFavorites(newSet);
        localStorage.setItem("ramadan-favorites-hadis", JSON.stringify([...newSet]));
    };

    const copyToClipboard = async (hadith) => {
        const text = `${hadith.arab}\n\n${hadith.id}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(hadith.number);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const extractNarrator = (text) => {
        // Find the last bracketed text [Nama] which usually indicates the direct narrator from Prophet
        const matches = [...text.matchAll(/\[([^\]]+)\]/g)];
        if (matches.length > 0) {
            return matches[matches.length - 1][1];
        }
        return "Sahabat Nabi";
    };

    // Filtering logic
    const filteredHadiths = hadiths.filter((hadith) => {
        const matchSearch =
            hadith.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hadith.arab.includes(searchQuery);

        let matchCategory = true;
        if (activeCategory !== "all") {
            const categoryData = CATEGORIES.find(c => c.id === activeCategory);
            if (categoryData && categoryData.keywords) {
                const translationLower = hadith.id.toLowerCase();
                matchCategory = categoryData.keywords.some(kw => translationLower.includes(kw));
            }
        }

        return matchSearch && matchCategory;
    });

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 relative">
            {/* Header Sticky */}
            <div className="sticky top-0 z-50 glass border-b border-border/40 px-4 py-4 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-foreground leading-tight">Hadits</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Kumpulan Hadits</p>
                    </div>
                </div>
            </div>

            <main className="px-4 pt-6 max-w-xl mx-auto flex flex-col gap-6">
                {/* Pagination */}
                {!loading && (
                    <section className="flex items-center justify-between py-6 mt-4 border-t border-border/50">
                        <button
                            onClick={() => fetchHadiths(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-medium shadow-sm hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
                        >
                            <ChevronLeft size={16} />
                            <span>Sebelumnya</span>
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-foreground">
                                Hal {pagination.current_page}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                dari {pagination.total_pages}
                            </span>
                        </div>

                        <button
                            onClick={() => fetchHadiths(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.total_pages}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-medium shadow-sm hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
                        >
                            <span>Selanjutnya</span>
                            <ChevronRight size={16} />
                        </button>
                    </section>
                )}
                {/* Hero Section: Hadits Hari Ini */}
                {dailyHadith && (
                    <section>
                        <div className="bg-gradient-to-br from-primary via-emerald-900 to-green-950 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            {/* Glassmorphism background elements */}
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[40px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[40px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                        Hadis Hari Ini
                                    </span>
                                    <button
                                        onClick={() => toggleFavorite(`daily-${dailyHadith.number}`)}
                                        className="text-white/70 hover:text-white transition-colors"
                                    >
                                        <Heart size={20} fill={favorites.has(`daily-${dailyHadith.number}`) ? "currentColor" : "none"} className={favorites.has(`daily-${dailyHadith.number}`) ? "text-red-400" : ""} />
                                    </button>
                                </div>

                                <div className="mt-2 text-right">
                                    <p className="font-amiri text-lg lg:text-md text-white leading-[2.2]" dir="rtl">
                                        {dailyHadith.arab}
                                    </p>
                                </div>

                                <div className="text-sm text-white/90 leading-relaxed font-sans">
                                    "{dailyHadith.id}"
                                </div>

                                <div className="mt-4 flex items-center gap-3 text-xs font-medium">
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white/90 backdrop-blur-sm border border-white/10">
                                        <BookOpen size={14} />
                                        <span>Kumpulan Hadits</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white/90 backdrop-blur-sm border border-white/10">
                                        <User size={14} />
                                        <span>{extractNarrator(dailyHadith.id)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Search & Filter */}
                <section className="flex flex-col gap-3 sticky top-[72px] z-40 bg-background/95 backdrop-blur-md py-2 -mx-4 px-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Cari topik atau perawi..."
                            className="w-full glass bg-white/50 border border-black/5 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={cn(
                                    "snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border",
                                    activeCategory === category.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-95"
                                        : "bg-white text-muted-foreground border-border hover:bg-black/5"
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Hadis List */}
                <section className="flex flex-col gap-5 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="size-8 text-primary animate-spin mb-4" />
                            <p className="animate-pulse text-sm">Memuat hadits...</p>
                        </div>
                    ) : filteredHadiths.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground glass border rounded-3xl">
                            <BookOpen className="size-12 mb-4 opacity-20" />
                            <p className="font-medium">Jazakallah khair.</p>
                            <p className="text-sm">Tidak ada hadits yang sesuai dengan pencarian atau filter di halaman ini.</p>
                        </div>
                    ) : (
                        filteredHadiths.map((hadith) => {
                            const isFav = favorites.has(hadith.number);
                            return (
                                <div className="px-2" key={hadith.number}>
                                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-border/60 hover:shadow-md transition-shadow group relative overflow-hidden">
                                        {/* Green Accent Line */}
                                        <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-primary to-accent rounded-r-full" />

                                        <div className="flex justify-between items-center mb-4 pl-3">
                                            <div className="text-xs font-bold tracking-widest text-primary uppercase">
                                                Hadits No. {hadith.number}
                                            </div>
                                            <button
                                                onClick={() => toggleFavorite(hadith.number)}
                                                className="p-2 -mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            >
                                                <Heart size={18} fill={isFav ? "currentColor" : "none"} className={cn(isFav && "text-red-500")} />
                                            </button>
                                        </div>

                                        <div className="pl-3 mb-5 text-right">
                                            <p className="font-amiri text-lg leading-[2.2] text-foreground" dir="rtl">
                                                {hadith.arab}
                                            </p>
                                        </div>

                                        <div className="pl-3 mb-6 text-sm leading-relaxed text-muted-foreground">
                                            "{hadith.id}"
                                        </div>

                                        <div className="pl-3 flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                <User size={14} className="opacity-70" />
                                                <span>{extractNarrator(hadith.id)}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => copyToClipboard(hadith)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-primary/5 hover:text-primary transition-colors"
                                                >
                                                    {copiedId === hadith.number ? (
                                                        <span className="text-green-600 font-bold">Tersalin!</span>
                                                    ) : (
                                                        <>
                                                            <Copy size={14} />
                                                            <span>Salin</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-primary/5 hover:text-primary transition-colors">
                                                    <Share2 size={14} />
                                                    <span className="hidden sm:inline">Bagikan</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>

                {/* Pagination */}
                {!loading && (
                    <section className="flex items-center justify-between py-6 mt-4 border-t border-border/50">
                        <button
                            onClick={() => fetchHadiths(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-medium shadow-sm hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
                        >
                            <ChevronLeft size={16} />
                            <span>Sebelumnya</span>
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-foreground">
                                Hal {pagination.current_page}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                dari {pagination.total_pages}
                            </span>
                        </div>

                        <button
                            onClick={() => fetchHadiths(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.total_pages}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-medium shadow-sm hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
                        >
                            <span>Selanjutnya</span>
                            <ChevronRight size={16} />
                        </button>
                    </section>
                )}
            </main>
        </div>
    );
}
