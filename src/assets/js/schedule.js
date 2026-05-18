// File: src/js/schedule.js

export async function initSchedule() {
    try {
        // 1. Bangun Format Tanggal "YYYY-MM-DD" untuk filter data EQuran
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        // 2. Fetch API EQuran.id (Wajib POST, bukan GET)
        const response = await fetch('https://equran.id/api/v2/shalat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provinsi: "Jawa Tengah",
                kabkota: "Kota Surakarta"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 3. Validasi & Ekstraksi Data
        if (result.code === 200) {
            const jadwalBulanan = result.data.jadwal;
            
            // Cari jadwal yang persis dengan hari ini
            const jadwalHariIni = jadwalBulanan.find(j => j.tanggal_lengkap === todayString);

            if (!jadwalHariIni) {
                throw new Error("Jadwal untuk hari ini tidak ditemukan di database EQuran.");
            }

            // 4. PEMETAAN DATA (Adapter Pattern)
            // Terjemahkan key bahasa Indonesia dari EQuran ke bahasa Inggris 
            // agar logika countdown.js milikmu tidak hancur berkeping-keping.
            const timings = {
                Fajr: jadwalHariIni.subuh,
                Dhuhr: jadwalHariIni.dzuhur,
                Asr: jadwalHariIni.ashar,
                Maghrib: jadwalHariIni.maghrib,
                Isha: jadwalHariIni.isya
            };

            // 5. Lempar data untuk merender UI sebelah kanan
            updateScheduleUI(timings);

            // 6. Kembalikan objek untuk dipakai oleh mesin hitung mundur
            return timings;
            
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Gagal menarik data jadwal sholat:", error);
        
        // Render UI Darurat jika Kiosk menyala tapi WiFi masjid mati
        document.getElementById('time-subuh').textContent = "--:--";
        document.getElementById('time-dzuhur').textContent = "--:--";
        document.getElementById('time-ashar').textContent = "--:--";
        document.getElementById('time-maghrib').textContent = "--:--";
        document.getElementById('time-isya').textContent = "--:--";
        
        return null; // Kembalikan null agar main.js tahu harus mencoba lagi
    }
}

function updateScheduleUI(timings) {
    document.getElementById('time-subuh').textContent = timings.Fajr;
    document.getElementById('time-dzuhur').textContent = timings.Dhuhr;
    document.getElementById('time-ashar').textContent = timings.Asr;
    document.getElementById('time-maghrib').textContent = timings.Maghrib;
    document.getElementById('time-isya').textContent = timings.Isha;

    console.log("Data Kemenag (EQuran.id) Berhasil Dirender:", timings);
}