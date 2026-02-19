"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AudioPlayer({ audioUrl, isPlaying, onToggle }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play().catch(e => console.error(e));
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying]);

    const handleEnded = () => {
        if (onToggle) onToggle(false);
    };

    return (
        <div className="flex items-center">
            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleEnded}
            />

            <button
                onClick={() => onToggle(!isPlaying)}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95",
                    isPlaying ? "bg-accent text-white shadow-md animate-pulse" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
        </div>
    );
}
