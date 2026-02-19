const API_BASE = "https://api.alquran.cloud/v1";

// Simple in-memory cache for development
const cache = new Map();

export async function getSurahs() {
    if (cache.has("surahs")) return cache.get("surahs");

    try {
        const res = await fetch(`${API_BASE}/surah`);
        const data = await res.json();
        if (data.code === 200) {
            cache.set("surahs", data.data);
            return data.data;
        }
    } catch (error) {
        console.error("Failed to fetch surahs:", error);
    }
    return [];
}

export async function getSurah(number) {
    const cacheKey = `surah-${number}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        // Fetch Arabic text, translation (Indonesian), and audio
        // Using editions: quran-uthmani, id.indonesian, ar.alafasy
        const res = await fetch(`${API_BASE}/surah/${number}/editions/quran-uthmani,id.indonesian,ar.alafasy`);
        const data = await res.json();

        if (data.code === 200) {
            const [arabic, translation, audio] = data.data;

            // Merge the data into a usable structure
            const combined = arabic.ayahs.map((ayah, index) => ({
                number: ayah.number,
                numberInSurah: ayah.numberInSurah,
                text: ayah.text,
                translation: translation.ayahs[index].text,
                audio: audio.ayahs[index].audio,
                juz: ayah.juz,
                page: ayah.page
            }));

            const result = {
                ...arabic, // metadata
                ayahs: combined
            };

            cache.set(cacheKey, result);
            return result;
        }
    } catch (error) {
        console.error(`Failed to fetch surah ${number}:`, error);
    }
    return null;
}
