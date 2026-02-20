"use client";

import { Home, BookOpen, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "quran", label: "Quran", icon: BookOpen, path: "/quran" },
    { id: "qibla", label: "Qibla", icon: Compass, path: "/qibla" }, // Placeholder for now
];

export default function BottomNav() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pb-6 px-4 pointer-events-none">
            <AnimatePresence>
                {isScrolled && (
                    <motion.nav
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className={cn(
                            "w-full max-w-sm bg-white pointer-events-auto",
                            "rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 flex justify-around items-center h-16 px-2"
                        )}
                    >
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.path;

                            // Use Link for navigation
                            if (item.path) {
                                return (
                                    <Link
                                        href={item.path}
                                        key={item.id}
                                        className={cn(
                                            "flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-1 rounded-xl",
                                            isActive ? "text-primary bg-primary/10 px-4 py-1 rounded-full" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <item.icon
                                            size={24}
                                            className={cn("transition-transform", isActive && "scale-110 stroke-[2.5]")}
                                        />
                                        <span className="text-[10px] font-medium tracking-wide">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }

                            // Fallback to button if no path (though all current items have paths)
                            return (
                                <button
                                    key={item.id}
                                    className={cn(
                                        "flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-1 rounded-xl",
                                        isActive ? "text-primary bg-primary/10 px-3 py-2 rounded-full" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon
                                        size={24}
                                        className={cn("transition-transform", isActive && "scale-110 stroke-[2.5]")}
                                    />
                                    <span className="text-[10px] font-medium tracking-wide">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.nav>
                )}
            </AnimatePresence>
        </div>
    );
}
