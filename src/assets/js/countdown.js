export function startCountdownEngine(timings) {
  const clockDisplay = document.getElementById("clock-display");
  const dateDisplay = document.getElementById("date-display");
  const countdownDisplay = document.getElementById("countdown-display");
  const nextPrayerLabel = document.getElementById("next-prayer-label");
  const countdownContainer = document.getElementById("countdown-container");

  // Fungsi helper mengubah "14:56" menjadi Date Object hari ini
  function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":");
    const now = new Date();
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now;
  }

  // Bangun Array Prioritas
  const schedule = [
    { id: "subuh", name: "Subuh", target: parseTime(timings.Fajr) },
    { id: "dzuhur", name: "Dzuhur", target: parseTime(timings.Dhuhr) },
    { id: "ashar", name: "Ashar", target: parseTime(timings.Asr) },
    { id: "maghrib", name: "Maghrib", target: parseTime(timings.Maghrib) },
    { id: "isya", name: "Isya", target: parseTime(timings.Isha) },
  ];

  // Ambil referensi target Maghrib dan Subuh untuk batas malam hari
  const maghribTarget = schedule.find((p) => p.id === "maghrib").target;
  const subuhTarget = schedule.find((p) => p.id === "subuh").target;

  // Konstanta Durasi (dalam milidetik)
  const DURASI_IQOMAH = 15 * 60 * 1000; // 15 menit
  const DURASI_SHOLAT = 15 * 60 * 1000; // 15 menit setelah iqomah selesai

  setInterval(() => {
    const now = new Date();
    now.setHours(now.getHours()); // Normalisasi ke detik penuh
    const nowMs = now.getTime();

    if (
      now.getHours() === 0 &&
      now.getMinutes() === 1 &&
      now.getSeconds() === 0
    ) {
      window.location.reload(true);
    }

    // 1. RENDER JAM RAKSASA UTAMA (Tetap Utuh)
    clockDisplay.textContent = now
      .toLocaleTimeString("id-ID", { hour12: false })
      .replace(/\./g, ":");

    // 2. RENDER TANGGAL MASEHI (Tetap Utuh)
    const optionsMasehi = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const masehiDate = now.toLocaleDateString("id-ID", optionsMasehi);

    // ==========================================================
    // 3. RENDER TANGGAL HIJRIAH (ALGORITMA MATEMATIKA MANDIRI - ANTI BUG TV)
    // ==========================================================
    function hitungHijriahManual(date) {
      const namaBulanHijriah = [
        "Muharram",
        "Safar",
        "Rabi'ul Awwal",
        "Rabi'ul Akhir",
        "Jumadil Awwal",
        "Jumadil Akhir",
        "Rajab",
        "Sya'ban",
        "Ramadhan",
        "Syawwal",
        "Dzulqa'dah",
        "Dzulhijjah",
      ];

      let jd = Math.floor(date.getTime() / 86400000) + 2440588;

      // Koreksi manual jika penanggalan hilal meleset 1-2 hari di lapangan
      // Tambahkan nilai jika ingin memajukan hari, kurangi jika ingin memundurkan
      const KOREKSI_HARI = 0;
      jd += KOREKSI_HARI;

      const l = jd - 1948440 + 10632;
      const n = Math.floor((l - 1) / 10631);
      const l2 = l - 10631 * n + 354;
      const j =
        Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2 + 272) / 17652) +
        Math.floor(l2 / 2451) * Math.floor((30 * l2 - 425) / 10629);
      const l3 =
        l2 -
        Math.floor((10985 - j) / 5316) * Math.floor((50 * j + 272) / 17652) -
        Math.floor(j / 2451) * Math.floor((30 * j - 425) / 10629);

      const bulan = Math.floor((30 * l3 - 425) / 10629) + 1;
      const hari = l3 - Math.floor((10629 * (bulan - 1) + 425) / 30);
      const tahun = 30 * n + j - 30;

      return `${hari} ${namaBulanHijriah[bulan - 1]} ${tahun} H`;
    }

    // Eksekusi fungsi mandiri kebal WebView
    const hijriahDate = hitungHijriahManual(now);

    // Tembak langsung ke DOM secara presisi
    dateDisplay.textContent = `${masehiDate} | ${hijriahDate}`;

    // ==========================================
    // SENSOR DARK MODE OTOMATIS
    // ==========================================
    // Malam didefinisikan jika waktu saat ini sudah lewat Maghrib HARI INI,
    // ATAU sebelum Subuh HARI INI.
    if (now >= maghribTarget || now < subuhTarget) {
      document.documentElement.classList.add("dark"); // Suntik ke tag <html>
    } else {
      document.documentElement.classList.remove("dark");
    }

    // ==========================================
    // STATE MACHINE LOGIC (3 FASE)
    // ==========================================
    let currentPhase = "IDLE";
    let activePrayer = null;
    let timeDiff = 0;
    let labelText = "";

    for (let i = 0; i < schedule.length; i++) {
      const adzanTarget = schedule[i].target.getTime();
      const iqomahTarget = adzanTarget + DURASI_IQOMAH;
      const sholatEnd = iqomahTarget + DURASI_SHOLAT;

      if (nowMs < adzanTarget) {
        // FASE 1: MENUNGGU ADZAN
        currentPhase = "ADZAN";
        activePrayer = schedule[i];
        timeDiff = adzanTarget - nowMs;
        labelText = `MENUJU ${schedule[i].id.toUpperCase()}`;
        break;
      } else if (nowMs >= adzanTarget && nowMs < iqomahTarget) {
        // FASE 2: WAKTU IQOMAH (15 Menit)
        currentPhase = "IQOMAH";
        activePrayer = schedule[i];
        timeDiff = iqomahTarget - nowMs;
        labelText = "WAKTU IQOMAH";
        break;
      } else if (nowMs >= iqomahTarget && nowMs < sholatEnd) {
        // FASE 3: SHOLAT BERLANGSUNG (15 Menit Mode Statis)
        currentPhase = "SHOLAT";
        activePrayer = schedule[i];
        timeDiff = 0;
        labelText = "SHOLAT BERLANGSUNG";
        break;
      }
    }

    // ==========================================
    // EDGE CASE: SETELAH ISYA (MALAM HARI)
    // ==========================================
    if (!activePrayer) {
      activePrayer = schedule[0]; // Target Subuh
      currentPhase = "ADZAN"; // Kembalikan ke mode hitung mundur normal
      labelText = "MENUJU SUBUH";

      // Kalkulasi waktu Subuh untuk HARI ESOK (tambah 24 Jam)
      const besokSubuhMs = schedule[0].target.getTime() + 24 * 60 * 60 * 1000;
      timeDiff = besokSubuhMs - nowMs;
    }

    // ==========================================
    // RENDER VISUAL & HIGHLIGHT
    // ==========================================
    nextPrayerLabel.textContent = labelText;

    // Ambil elemen teks untuk manipulasi warna
    const countdownText = document.getElementById("countdown-display");

    if (currentPhase === "SHOLAT") {
      // Mode Sholat Berlangsung (Mode Statis Gelap)
      countdownText.textContent = "HARAP TENANG";
      countdownText.classList.add("text-4xl");
      countdownText.classList.remove(
        "tracking-widest",
        "tracking-wider",
        "tracking-wide",
      );
      countdownText.classList.add("tracking-normal"); // Paksa spasi dan huruf menjadi normal

      countdownContainer.classList.remove(
        "bg-white",
        "dark:bg-slate-900",
        "animate-pulse",
        "bg-red-600",
        "dark:bg-red-700",
        "bg-red-500",
        "dark:bg-red-800",
      );
      countdownContainer.classList.add("bg-slate-800");

      // ==========================================
      // INTERVENSI ABSOLUT: INLINE STYLE
      // ==========================================
      // Paksa warna putih murni (#ffffff) dan emas (#fbbf24)
      // mengabaikan semua class Tailwind yang tersangkut.
      countdownText.style.color = "#ffffff";
      countdownText.style.letterSpacing = "normal";
      nextPrayerLabel.style.color = "#fbbf24";
    } else {
      // Mode Countdown Aktif
      countdownText.classList.remove("text-4xl");
      countdownText.classList.remove("tracking-normal");
      countdownText.classList.add("tracking-widest"); // Sesuaikan dengan class awal jam di HTML-mu

      // Konversi waktu
      const h = Math.floor(timeDiff / (1000 * 60 * 60));
      const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((timeDiff % (1000 * 60)) / 1000);

      countdownText.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

      // Reset warna kontainer
      countdownContainer.classList.remove(
        "bg-white",
        "dark:bg-slate-900",
        "bg-slate-800",
        "bg-red-600",
        "dark:bg-red-700",
        "animate-pulse",
        "bg-red-500",
        "dark:bg-red-800",
      );

      // ==========================================
      // CABUT INLINE STYLE
      // ==========================================
      // Hapus string color agar sistem kembali menggunakan class Tailwind (text-masjid-gold, dll)
      countdownText.style.color = "";
      countdownText.style.letterSpacing = "";
      nextPrayerLabel.style.color = "";

      // Logika Urgensi (Warna Merah)
      if (currentPhase === "IQOMAH") {
        countdownContainer.classList.add(
          "bg-red-600",
          "dark:bg-red-700",
          "animate-pulse",
        );
        countdownText.classList.replace("text-masjid-gold", "text-white");
        nextPrayerLabel.classList.replace("text-slate-400", "text-white");
      } else if (currentPhase === "ADZAN" && timeDiff <= 300000) {
        // Sekarang bg-red-500 akan bekerja karena bg-white sudah dicabut
        countdownContainer.classList.add("bg-red-500", "dark:bg-red-800");
        countdownText.classList.replace("text-masjid-gold", "text-white");
        nextPrayerLabel.classList.replace("text-slate-400", "text-white");
      } else {
        // Kembalikan ke putih HANYA jika waktu masih aman (> 5 menit)
        countdownContainer.classList.add("bg-white", "dark:bg-slate-900");
      }
    }

    // Cukup kirim jadwal dan ID aktif ke fungsi UI kanan
    updateHighlightUI(schedule, activePrayer.id);
  }, 1000);
}

// Fungsi memindahkan warna emas ke jadwal yang relevan
// Fungsi ini HANYA memindahkan warna emas ke jadwal yang relevan di tabel kanan
function updateHighlightUI(schedule, activeId) {
  schedule.forEach((p) => {
    const row = document.getElementById(`row-${p.id}`);
    if (row) {
      row.classList.remove(
        "bg-masjid-gold",
        "text-white",
        "shadow-md",
        "scale-105",
      );
      row.classList.add("text-slate-800", "dark:text-slate-200");
    }
  });

  const activeRow = document.getElementById(`row-${activeId}`);
  if (activeRow) {
    activeRow.classList.remove("text-slate-800", "dark:text-slate-200");
    activeRow.classList.add(
      "bg-masjid-gold",
      "text-white",
      "shadow-md",
      "scale-105",
    );
  }
}
