import QiblaCompass from "@/components/QiblaCompass";

export const metadata = {
    title: "Qibla Compass - Ramadan Tracker",
    description: "Cari arah kiblat dari lokasimu",
};

export default function QiblaPage() {
    return (
        <main className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-emerald-100 text-emerald-950 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-200">
            <QiblaCompass />
        </main>
    );
}
