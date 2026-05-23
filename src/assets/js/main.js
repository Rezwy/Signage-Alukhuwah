// File: src/assets/js/main.js

import { initSchedule } from "./schedule.js";
import { startCountdownEngine } from "./countdown.js";

// ==========================================
// KONSTANTA GLOBAL
// ==========================================
const SPREADSHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk2uSgP7O8r4bkc3tU93XodUZw26kSSFnsAST5lR0aRgr3dO-Ds_VJGjxPxeU-QA3NOD0JqPbUUvdp/pub?gid=0&single=true&output=csv";

// ==========================================
// FUNGSI SINKRONISASI SALDO
// ==========================================
async function syncSaldo() {
  try {
    const response = await fetch(
      `${SPREADSHEET_CSV_URL}&t=${new Date().getTime()}`,
    );
    if (!response.ok) throw new Error("Gagal menarik data dari Google Sheets");

    const csvText = await response.text();
    const rows = csvText.split("\n");
    const saldoRow = rows[0].split(",");

    const rawSaldo = parseInt(saldoRow[1].replace(/\D/g, ""), 10);
    if (isNaN(rawSaldo)) throw new Error("Format angka di Google Sheets salah");

    const formattedSaldo = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(rawSaldo);

    // [MODIFIKASI]: Targetkan kedua elemen saldo sekaligus
    const saldoUtama = document.getElementById("saldo-infaq");
    const saldoKlon = document.getElementById("saldo-infaq-clone");

    if (saldoUtama) saldoUtama.textContent = formattedSaldo;
    if (saldoKlon) saldoKlon.textContent = formattedSaldo;

    console.log("Saldo disinkronkan:", formattedSaldo);
  } catch (error) {
    console.error("Sinkronisasi Saldo Gagal:", error);
  }
}

// ==========================================
// ORKESTRASI UTAMA (Tahan Banting & Paralel)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistem Kiosk Dimulai...");

  // ==========================================
  // LOGIKA PEMAKSAAN TEMA (BYPASS KERNEL ANDROID)
  // ==========================================
  function paksakanTemaSesuaiWaktu() {
    const now = new Date();
    const hours = now.getHours();

    // Tentukan batasan jam siang (jam 06:00 pagi sampai 17:15 sore)
    const apakahSiangHari = hours >= 6 && hours < 17;

    const body = document.body;
    const teksSaldo = document.getElementById("saldo-infaq");

    if (apakahSiangHari) {
      // 1. PAKSA TEMA TERANG
      body.style.setProperty("background-color", "#f8fafc", "important"); // bg-slate-50
      body.style.setProperty("color", "#0f172a", "important"); // text-slate-900

      if (teksSaldo) {
        teksSaldo.style.setProperty("color", "#f59e0b", "important"); // Cokelat gelap kontras
      }

      body.classList.remove("dark");
    } else {
      // 2. PAKSA TEMA GELAP
      body.style.setProperty("background-color", "#020617", "important"); // bg-slate-950
      body.style.setProperty("color", "#f8fafc", "important"); // text-slate-50

      if (teksSaldo) {
        teksSaldo.style.setProperty("color", "#f59e0b", "important"); // Emas masjid
      }

      body.classList.add("dark");
    }
  }

  // EXEKUSI PEMAKSAAN TEMA SEKARANG (Saat pertama kali dimuat)
  paksakanTemaSesuaiWaktu();

  // 1. JALUR JADWAL SHOLAT (Isolasi Asinkronus)
  (async () => {
    try {
      const dailyTimings = await initSchedule();
      if (dailyTimings) {
        startCountdownEngine(dailyTimings);
      }
    } catch (error) {
      console.error("Gagal memuat mesin jadwal sholat:", error);
    }
  })();

  // 2. JALUR SALDO INFAQ (Jalan Mandiri)
  syncSaldo();
  setInterval(syncSaldo, 5 * 60 * 1000);

  // 3. JALUR ENGINE REAL-TIME (Pemeriksaan Waktu & Pembersihan Harian)
  setInterval(() => {
    const now = new Date();

    // Periksa dan paksakan tema setiap detik agar transisi mulus dan tepat waktu
    paksakanTemaSesuaiWaktu();

    // Protokol Pembersihan Harian (Refresh paksa jam 01:00 Dini Hari)
    if (
      now.getHours() === 1 &&
      now.getMinutes() === 0 &&
      now.getSeconds() === 0
    ) {
      window.location.reload(true);
    }
  }, 1000);
  // ==========================================
  // ROTASI KOTAK INFO BAWAH (10 Detik Slide Up)
  // ==========================================
  let isSaldoShowing = true;

  // ==========================================
  // ROTASI KOTAK INFO BAWAH (Infinite Scroll Ke Atas)
  // ==========================================
  const slider = document.getElementById("info-slider");

  if (slider) {
    const slideCount = slider.children.length; // Akan bernilai 5
    let currentSlide = 0;

    setInterval(() => {
      currentSlide++;

      // 1. Nyalakan transisi untuk pergerakan mulus ke atas
      slider.style.transition = "transform 1s ease-in-out";

      // 2. Kalkulasi pergeseran persentase
      const percentage = -(currentSlide * (100 / slideCount));
      slider.style.transform = `translateY(${percentage}%)`;

      // 3. Jika ini adalah slide terakhir (Kloningan Slide 1)
      if (currentSlide === slideCount - 1) {
        // Tunggu 1 detik sampai animasi bergeser selesai sepenuhnya
        setTimeout(() => {
          // Matikan animasi secara instan
          slider.style.transition = "none";

          // Reset indeks dan posisi secara gaib tanpa disadari mata
          currentSlide = 0;
          slider.style.transform = `translateY(0%)`;
        }, 1000); // 1000 ms harus sama dengan durasi transisi '1s' di atas
      }
    }, 6000); // Eksekusi setiap 3 Detik
  }
});
