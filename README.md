# 🌙 Amal.in: Ramadan Tracker

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-emerald.svg?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue.svg?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Supported-gold.svg?style=flat&logo=progressive-web-apps)](https://web.dev/explore/progressive-web-apps)

**Amal.in Ramadan Tracker** adalah aplikasi web progresif (PWA) modern yang dirancang sebagai asisten spiritual pribadi Anda selama bulan suci Ramadan. Dengan antarmuka premium berbasis *glassmorphism* dan estetika yang terinspirasi oleh identitas Nahdlatul Ulama (kombinasi warna hijau tua, hijau zamrud, putih, dan aksen emas), Amal.in membantu umat Muslim melacak, meningkatkan, dan menjaga konsistensi ibadah harian mereka dengan cara yang interaktif dan menyenangkan.

---

## ❓ The Problem (Masalah yang Dihadapi)

Menjaga konsistensi ibadah di bulan Ramadan seringkali menjadi tantangan tersendiri bagi banyak Muslim akibat kesibukan aktivitas sehari-hari, pekerjaan, maupun studi. Beberapa masalah umum yang sering dihadapi antara lain:
1. **Kehilangan Motivasi & Lupa Mencatat**: Pengguna seringkali lupa mencatat progres ibadah harian mereka. Ketika ibadah terputus (*broken streak*), motivasi untuk melanjutkan ibadah secara maksimal cenderung menurun drastis karena merasa sudah terlanjur "bolong".
2. **Aplikasi Spiritual yang Terfragmentasi**: Pengguna harus membuka banyak aplikasi yang berbeda untuk kebutuhan ibadah yang berbeda pula—seperti aplikasi jadwal shalat, kompas kiblat, Al-Quran digital, tasbih harian, hingga kumpulan doa dan hadits. Hal ini meningkatkan risiko gangguan (*distraction*) akibat notifikasi media sosial atau iklan komersial saat berpindah aplikasi.
3. **Kurangnya Representasi Visual Konsistensi**: Daftar tugas (*to-do list*) biasa terasa membosankan dan kurang memberikan gambaran visual jangka panjang tentang seberapa konsisten ibadah mereka selama sebulan penuh.
4. **Isu Privasi Data**: Banyak aplikasi keagamaan di app store mewajibkan pendaftaran akun dengan data pribadi, melacak lokasi pengguna di latar belakang secara terus-menerus, atau menyisipkan iklan komersial yang mengganggu kekhusyukan ibadah.

---

## 💡 The Solution (Solusi yang Ditawarkan)

**Amal.in** hadir sebagai **All-in-One Spiritual Companion** yang menggabungkan seluruh kebutuhan ibadah Ramadan ke dalam satu platform asisten pribadi yang indah, responsif, dan menghormati privasi pengguna. Solusi yang ditawarkan meliputi:
1. **Dashboard Ibadah Terpadu**: Menyediakan waktu shalat real-time berdasarkan lokasi pengguna, hitung mundur ke waktu shalat berikutnya, dan pengingat Adzan otomatis (suara adzan dan notifikasi browser) yang dapat disesuaikan.
2. **Daily Tracker Fleksibel & Historis**: Memungkinkan pengguna melacak kemajuan ibadah harian mereka seperti shalat wajib 5 waktu, tarawih, tadarus, dan puasa dengan sistem poin terstruktur. Pengguna juga dapat melacak kembali (*back-track*) progres hari sebelumnya jika lupa mencatat tanpa merusak motivasi streak mereka.
3. **Penyatuan Utilitas Ibadah**: Mengintegrasikan Al-Quran digital dengan audio murattal per-ayat, navigasi doa berdasarkan kategori kehidupan, mesin pencari hadits shahih paginasi, kompas kiblat berbasis sensor perangkat, hingga tasbih digital interaktif dengan efek suara dan getaran haptik.
4. **Desain Imersif & Bebas Iklan**: Menyajikan desain estetika *glassmorphic* premium yang menenangkan mata, tanpa iklan komersial, dan mendukung pemasangan aplikasi langsung di layar utama (PWA) agar dapat diakses kapan saja secara offline.

---

## ⭐ Uniqueness (Keunikan Utama)

Amal.in memiliki beberapa keunikan yang membedakannya dari aplikasi pelacak ibadah lainnya:
1. **GitHub-Style Consistency Heatmap**: Menggunakan visualisasi grid konsistensi 30 hari terakhir (seperti grafik kontribusi GitHub). Warna kotak grid akan berubah secara real-time dari abu-abu menjadi hijau zamrud pekat (5 tingkatan intensitas) berdasarkan persentase pencapaian poin ibadah harian pengguna tanpa perlu memuat ulang halaman (*instant state event sync*).
2. **Sistem Poin Gamifikasi & Streak Badges**: Setiap tugas ibadah bernilai poin tertentu (misal: Shalat wajib @10 poin, Tarawih 15 poin, Tadarus 15 poin, Puasa 20 poin). Mengumpulkan poin maksimal (100%) akan memberikan status khusus dan membuka badge streak yang memicu motivasi berkelanjutan.
3. **Navigasi Hari yang Fleksibel (Historical Logging)**: Pengguna dapat berpindah ke tanggal sebelumnya menggunakan tombol *Next/Prev* untuk melengkapi ibadah yang lupa dicentang kemarin. Sistem membatasi pengisian untuk hari esok guna mencegah manipulasi data sebelum hari tersebut dilewati.
4. **Privasi Penuh (Local-First Architecture)**: Seluruh data aktivitas ibadah, jurnal spiritual harian, pengaturan suara, dan daftar favorit disimpan secara eksklusif di dalam penyimpanan lokal browser (`localStorage`) pengguna. Tidak ada data yang dikirim ke server luar, tidak memerlukan *login*, dan 100% aman secara pribadi.
5. **Tasbih Digital Haptic & Audio**: Tasbih digital pada Amal.in dilengkapi suara klik nyata (`tashbih-click.mp3`), getaran haptik pada perangkat seluler, serta pilihan target dzikr (33, 99, atau tanpa batas) dengan pengubah bacaan dzikir yang dinamis.

---

## 🚀 Fitur Utama (Key Features)

### 1. Dashboard Utama & Jadwal Shalat
* Jadwal shalat 5 waktu otomatis berdasarkan koordinat wilayah pengguna.
* Penghitung waktu mundur (*countdown*) yang presisi menuju waktu ibadah berikutnya.
* Pengingat adzan otomatis dengan notifikasi push browser dan pemutaran audio adzan (`Adzan.mp3`).

### 2. Daily Ibadah Tracker
* Checklist ibadah harian meliputi:
  * Puasa Ramadan (20 poin)
  * Shalat 5 Waktu (masing-masing 10 poin)
  * Shalat Tarawih (15 poin)
  * Tadarus Al-Qur'an (15 poin)
* Penilaian persentase harian yang dinamis hingga mencapai target sempurna 100 poin.
* Kemudahan navigasi tanggal untuk melihat dan memperbarui catatan ibadah masa lalu.

### 3. Konsistensi Ramadan (Heatmap)
* Matriks visual 30 hari terakhir yang mendeteksi tingkat keaktifan beribadah secara langsung melalui sinkronisasi event kustom (`ramadan-tracker-update`).
* Dilengkapi tooltip interaktif yang menunjukkan tanggal dan persentase keberhasilan harian saat sel diarahkan kursor (*hover*).

### 4. Streak & Badge Pencapaian
* Perhitungan otomatis jumlah hari beruntun pengguna menjaga ibadah mereka tetap aktif.
* Penghargaan badge dinamis seperti **Fasting Streak** dan **Prayer Streak** dengan animasi menarik untuk mengapresiasi kedisiplinan pengguna.

### 5. Al-Quran Digital Terintegrasi
* Daftar 114 Surah lengkap dengan teks Arab yang indah, transliterasi Latin, dan terjemahan bahasa Indonesia.
* Pemutar audio per-ayat untuk mendengarkan pelafalan murattal yang merdu.
* Fitur penanda halaman (*bookmark*) "Terakhir Dibaca" untuk memudahkan kelanjutan tadarus.

### 6. Kumpulan Doa Pilihan
* Pustaka doa yang luas yang dikelompokkan ke dalam kategori populer seperti: *Ramadan, Harian, Keluarga, Cinta/Jodoh/Pernikahan, Lailatul Qadar, Wudhu, Tidur, Berpakaian, hingga Doa saat Sakit*.
* Fitur pencarian doa cepat dan tombol salin teks untuk dibagikan.

### 7. Pustaka Hadits
* Akses ribuan hadits shahih dengan fitur paginasi halaman yang ringan (terkoneksi API hadits).
* Kotak pencarian dinamis untuk menyaring hadits berdasarkan kata kunci atau perawi tertentu.
* Fitur favorit hadits dan penyalinan teks instan.

### 8. Kompas Kiblat Pintar (Smart Qibla Compass)
* Penunjuk arah kiblat presisi yang memanfaatkan integrasi GPS lokasi dan API orientasi sensor perangkat mobile pengguna.
* Desain kompas visual emas yang elegan dengan panduan sudut derajat real-time menuju Ka'bah di Makkah.

### 9. Tasbih Digital Interaktif
* Counter dzikir digital dengan suara ketukan mekanis dan haptic vibration saat diklik di perangkat mobile.
* Fitur pengaturan target dzikir (33 kali atau 99 kali) yang akan memberikan bunyi alarm khusus saat target tercapai.
* Pilihan bacaan dzikir (Subhanallah, Alhamdulillah, Allahu Akbar, Astaghfirullah, dll.) yang dapat berganti secara otomatis.

### 10. Jurnal Harian & Berbagi Progress
* Jurnal teks rahasia untuk menuangkan refleksi rohani, resolusi, dan doa harian pengguna.
* Fitur ekspor pencapaian hari ini menjadi gambar kartu beresolusi tinggi (PNG) yang siap dibagikan ke media sosial seperti WhatsApp, Instagram, atau Twitter dengan satu ketukan.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

Aplikasi Amal.in Ramadan Tracker dibangun menggunakan teknologi modern berikut:

* **Framework Utama:** [Next.js 16.1 (App Router)](https://nextjs.org/) & [React 19.2](https://react.dev/)
* **Gaya & Desain:** [Tailwind CSS v4](https://tailwindcss.com/) dengan pendekatan kustom Glassmorphism
* **PWA Engine:** `@ducanh2912/next-pwa` untuk instalasi offline dan optimasi aplikasi progresif
* **Animasi:** `framer-motion` untuk transisi halaman dan interaksi modal yang mulus
* **Manajemen Tanggal:** `date-fns` untuk manipulasi kalender dan perhitungan selisih hari konsistensi
* **Ikonografi:** `lucide-react` sebagai penyedia ikon vektor modern yang konsisten
* **Audio Engine:** `use-sound` dan HTML5 Audio API untuk memutar suara tasbih dan audio adzan
* **Generasi Gambar:** `html-to-image` untuk memproses tangkapan layar kartu progres ke format PNG
* **Sumber Data API:**
  * Al-Quran & Doa: [equran.id](https://equran.id) API
  * Hadits: [hadith-api-go](https://hadith-api-go.vercel.app) API
  * Waktu Shalat: Aladhan API / Kemenag Integration

---

## 📦 Struktur Proyek (Folder Structure)

Berikut adalah ringkasan folder utama dari proyek Amal.in:

```text
ramadan-tracker/
├── public/                 # Aset statis (Audio Adzan, Audio Tasbih, Logo, Icon PWA)
├── src/
│   ├── app/                # Next.js App Router (Halaman & API Routes)
│   │   ├── api/            # Endpoint internal API
│   │   ├── doa/            # Halaman Kumpulan Doa
│   │   ├── hadits/         # Halaman Kumpulan Hadits
│   │   ├── qibla/          # Halaman Kompas Kiblat
│   │   ├── quran/          # Halaman Al-Quran Digital
│   │   ├── tasbih/         # Halaman Tasbih Digital
│   │   ├── layout.js       # Layout dasar aplikasi & meta tag SEO
│   │   ├── page.js         # Dashboard utama (Home)
│   │   └── globals.css     # CSS Global & Desain Token Glassmorphism
│   ├── components/         # Komponen React Reusable
│   │   ├── ui/             # Komponen UI Dasar (Radix Switch, dll)
│   │   ├── DailyTracker.jsx# Komponen pelacak aktivitas harian
│   │   ├── ConsistencyCard.jsx # Heatmap 30 hari konsistensi
│   │   ├── PrayerTimes.jsx # Komponen jadwal shalat & hitung mundur
│   │   ├── AdzanNotification.jsx # Pengaturan adzan & pemutar audio
│   │   ├── TasbihView.jsx  # Tampilan interaktif Tasbih
│   │   ├── ShareProgress.jsx # Fitur generate gambar kartu progress
│   │   └── ...             # Komponen pendukung lainnya
│   ├── data/               # Data statis lokal (opsional)
│   └── lib/                # Fungsi utilitas (cn helper, dll)
├── package.json            # Konfigurasi dependensi npm
└── next.config.mjs         # Konfigurasi Next.js & PWA
```

---

## ⚙️ Cara Memulai & Instalasi (Getting Started)

Untuk menjalankan proyek Amal.in secara lokal di komputer Anda, ikuti langkah-langkah di bawah ini:

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js (versi 18 ke atas)** di komputer Anda.

### 2. Kloning Repositori
```bash
git clone https://github.com/username/ramadan-tracker.git
cd ramadan-tracker
```

### 3. Instalasi Dependensi
Instal paket dependensi yang dibutuhkan menggunakan pengelola paket pilihan Anda:
```bash
npm install
# atau
yarn install
# atau
pnpm install
# atau
bun install
```

### 4. Menjalankan Server Pengembangan
Jalankan perintah berikut untuk mengaktifkan server lokal:
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

Buka browser Anda dan akses halaman [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

### 5. Build untuk Produksi
Untuk melakukan build aplikasi siap produksi:
```bash
npm run build
npm run start
```

---

## 🔒 Privasi Data & Keamanan (Local-First Policy)

Aplikasi Amal.in dibangun dengan prinsip menghormati privasi penuh pengguna. 
* **Tidak Ada Database Eksternal**: Kami tidak menyimpan data ibadah Anda di server cloud kami.
* **Keamanan Lokal**: Seluruh data yang dimasukkan (misalnya centang doa, target tasbih, isi jurnal rohani) disimpan langsung di memori browser Anda (`localStorage`).
* **Offline-Ready**: Aplikasi dapat dimuat dan digunakan sepenuhnya tanpa jaringan internet begitu aset awal telah ter-cache oleh Service Worker PWA.
* **Menghapus Data**: Jika Anda ingin menghapus seluruh riwayat pelacakan, Anda hanya perlu menghapus cache/data situs Amal.in dari setelan browser Anda.

---

*Semoga Amal.in dapat menjadi wasilah untuk meningkatkan keistiqomahan ibadah kita semua di bulan suci Ramadan. Selamat menjalankan ibadah puasa!* 🌙✨
