"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DoaCard from "@/components/DoaCard";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
    { id: "all", label: "Semua" },
    { id: "Ramadan", label: "Ramadan" },
    { id: "Harian", label: "Harian" },
    { id: "Keluarga", label: "Keluarga" },
    { id: "Lailatul Qadar", label: "Lailatul Qadar" },
    { id: "Lainnya", label: "Lainnya" }
];

export default function DoaPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [prayersList, setPrayersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrayers() {
            try {
                const res = await fetch("https://api.myquran.com/v1/doa/all");
                const data = await res.json();

                if (data && data.data) {
                    const mapped = data.data.map((item, index) => {
                        let category = "Lainnya";
                        const title = item.judul.toLowerCase();
                        const source = item.source.toLowerCase();

                        // Classification Logic
                        if (title.includes("lailatul qadar")) {
                            category = "Lailatul Qadar";
                        } else if (title.includes("ramadhan") || title.includes("ramadan") || title.includes("puasa") || title.includes("buka") || title.includes("sahur") || title.includes("tarawih") || title.includes("witir")) {
                            category = "Ramadan";
                        } else if (title.includes("orang tua") || title.includes("ayah") || title.includes("ibu") || title.includes("anak") || title.includes("keluarga") || title.includes("istri") || title.includes("suami") || title.includes("jodoh") || title.includes("nikah")) {
                            category = "Keluarga";
                        } else if (source === "harian" || title.includes("tidur") || title.includes("bangun") || title.includes("makan") || title.includes("masuk") || title.includes("keluar") || title.includes("pakaian") || title.includes("wc") || title.includes("cermin") || title.includes("kendaraan") || title.includes("bepergian") || title.includes("rumah") || title.includes("masjid") || title.includes("pasar")) {
                            category = "Harian";
                        }

                        return {
                            id: item.id || `api-${index}`,
                            title: item.judul,
                            arabic: item.doa,
                            transliteration: item.latin, // Often empty from API
                            translation: item.artinya,
                            source: item.source,
                            category: category
                        };
                    });
                    setPrayersList(mapped);
                }
            } catch (error) {
                console.error("Failed to fetch prayers", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPrayers();
    }, []);

    // Filter Logic
    const filteredPrayers = prayersList.filter((prayer) => {
        const matchesCategory = selectedCategory === "all" || prayer.category === selectedCategory;
        const matchesSearch =
            prayer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prayer.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (prayer.transliteration && prayer.transliteration.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 relative">
            {/* Header */}
            <div className="sticky top-0 z-50 glass border-b border-border/40 pb-4 pt-4 px-4 shadow-sm backdrop-blur-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Kumpulan Doa</h1>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari doa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/10 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/70"
                    />
                </div>

                {/* Categories Filter (Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all snap-center border",
                                selectedCategory === cat.id
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <main className="px-4 pt-6 max-w-md mx-auto flex flex-col gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                        <p>Memuat kumpulan doa...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredPrayers.length > 0 ? (
                            filteredPrayers.map((prayer) => (
                                <motion.div
                                    key={prayer.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <DoaCard prayer={prayer} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground"
                            >
                                <p>Tidak ada doa yang ditemukan.</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                                    className="mt-4 text-primary text-sm font-medium hover:underline"
                                >
                                    Reset Pencarian
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
