"use client";

import { BookOpen, Compass, Heart, MessageSquareQuote, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const menuItems = [
    { label: "Quran", icon: BookOpen, color: "bg-emerald-100 text-emerald-600", path: "/quran" },
    { label: "Doa", icon: MessageSquareQuote, color: "bg-blue-100 text-blue-600", path: "/doa" },
    { label: "Tasbih", icon: Heart, color: "bg-rose-100 text-rose-600", path: "/tasbih" },
    { label: "Qibla", icon: Compass, color: "bg-amber-100 text-amber-600", path: "/qibla" },
    { label: "Hadits", icon: Scroll, color: "bg-indigo-100 text-indigo-600", path: "/hadits" },
];

export default function MenuGrid() {
    return (
        <div className="grid grid-cols-5 gap-2 mb-6">
            {menuItems.map((item) => (
                <Link key={item.label} href={item.path} className="flex justify-center">
                    <button
                        className="flex flex-col items-center gap-2 group transition-transform hover:-translate-y-1"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm glass transition-colors",
                            "group-hover:bg-white/80 group-active:scale-95",
                            item.color.replace('bg-', 'bg-opacity-50 ') // Adjust opacity for glass feel
                        )}>
                            <item.icon size={22} className="stroke-[1.5]" />
                        </div>
                        <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                            {item.label}
                        </span>
                    </button>
                </Link>
            ))}
        </div>
    );
}
