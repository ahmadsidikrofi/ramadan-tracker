"use client";

import SurahList from "@/components/SurahList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Quran() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground relative">
            <div className="fixed top-[-50px] left-[-50px] w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="fixed bottom-[100px] right-[-50px] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />

            <main className="px-6 pt-6 relative z-10 w-full max-w-md mx-auto mb-20">
                <div className="flex items-center gap-2 mb-6">
                    <span className="glass rounded-xl p-2 cursor-pointer hover:bg-white/60 transition-colors">
                        <Link href="/">
                            <ArrowLeft className="size-4 text-primary" />
                        </Link>
                    </span>
                    <h1 className="font-amiri text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
                        Al-Quran
                    </h1>
                </div>
                <SurahList />
            </main>

            {/* Reused BottomNav */}
            {/* Note: I should probably move BottomNav to layout or make it a persistent component */}
        </div>
    );
}
