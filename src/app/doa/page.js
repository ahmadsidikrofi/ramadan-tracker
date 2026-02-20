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
    { id: "Pernikahan", label: "Pernikahan" },
    { id: "Wudhu", label: "Wudhu" },
    { id: "Masuk Kamar Mandi", label: "Kamar Mandi" },
    { id: "Tidur", label: "Tidur" },
    { id: "Berpakaian", label: "Berpakaian" },
    { id: "Doa ketika Sakit", label: "Sakit" },
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
                const res = await fetch("https://equran.id/api/doa");
                const result = await res.json();

                if (result && result.data) {
                    const mapped = result.data.map((item) => {
                        let category = "Lainnya";
                        const title = (item.nama || "").toLowerCase();
                        const grup = (item.grup || "").toLowerCase();
                        const tags = (item.tag || []).map(t => t.toLowerCase());

                        // Better Classification Logic for equran.id API structure
                        if (title.includes("lailatul qadar") || title.includes("lailatul")) {
                            category = "Lailatul Qadar";
                        } else if (title.includes("bulan ramadhan") || title.includes("ramadan") || title.includes("puasa") || title.includes("buka puasa") || title.includes("sahur") || title.includes("tarawih") || title.includes("zakat fitrah")) {
                            category = "Ramadan";
                        } else if (grup.includes("wudhu") || tags.includes("wudhu")) {
                            category = "Wudhu";
                        } else if (grup.includes("kamar mandi") || tags.includes("kamar mandi") || title.includes("toilet") || title.includes("buang hajat")) {
                            category = "Masuk Kamar Mandi";
                        } else if (grup.includes("tidur") || tags.includes("tidur")) {
                            category = "Tidur";
                        } else if (grup.includes("pakaian") || tags.includes("pakaian") || grup.includes("berpakaian")) {
                            category = "Berpakaian";
                        } else if (grup.includes("sakit") || tags.includes("sakit") || grup.includes("penyakit") || title.includes("sakit")) {
                            category = "Doa ketika Sakit";
                        } else if (grup.includes("pernikahan") || title.includes("pengantin") || title.includes("bersetubuh") || title.includes("pengantin")) {
                            category = "Pernikahan";
                        } else if (grup.includes("orang tua") || grup.includes("keluarga") || title.includes("ayah") || title.includes("ibu") || title.includes("anak") || title.includes("keturunan")) {
                            category = "Keluarga";
                        } else if (grup.includes("perjalanan") || title.includes("kendaraan") || title.includes("bepergian") || grup.includes("harian") || title.includes("makan") || title.includes("masjid") || title.includes("rumah") || title.includes("keluar") || title.includes("masuk")) {
                            category = "Harian";
                        }

                        return {
                            id: item.id,
                            title: item.nama,
                            arabic: item.ar,
                            transliteration: item.tr,
                            translation: item.idn,
                            source: item.tentang,
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
