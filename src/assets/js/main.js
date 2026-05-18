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
// ==========================================
// FUNGSI SINKRONISASI SALDO (ANTI-CRASH)
// ==========================================
async function syncSaldo() {
  try {
    const response = await fetch(
      `${SPREADSHEET_CSV_URL}&t=${new Date().getTime()}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    if (!response.ok) throw new Error("Gagal menarik data dari Google Sheets");

    const csvText = await response.text();
    console.log("Raw CSV Data dari Sheets:", csvText); // Intip isi data di konsol

    // REGEX: Bersihkan semua teks, ambil hanya deretan angka murni yang tersisa di dokumen
    const cleanNumbers = csvText.replace(/\D/g, "");

    if (!cleanNumbers) {
      throw new Error(
        "Tidak ditemukan angka nominal sama sekali di Google Sheets Anda!",
      );
    }

    const rawSaldo = parseInt(cleanNumbers, 10);

    // Format menjadi Rupiah secara presisi
    const formattedSaldo = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(rawSaldo);

    // Suntikkan ke layar UI TV
    const saldoElement = document.getElementById("saldo-infaq");
    if (saldoElement) {
      saldoElement.textContent = formattedSaldo;
      console.log("Saldo Berhasil Diperbarui:", formattedSaldo);
    }
  } catch (error) {
    console.error("Sinkronisasi Saldo Gagal:", error);
    // Jaring Pengaman: Jika gagal, jangan biarkan layar bertuliskan "memuat data..." selamanya
    const saldoElement = document.getElementById("saldo-infaq");
    if (saldoElement && saldoElement.textContent === "memuat data...") {
      saldoElement.textContent = "Rp 0";
    }
  }
}

// ==========================================
// ORKESTRASI UTAMA (Berjalan saat HTML selesai dimuat)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inisialisasi Jadwal Sholat dari EQuran
  const dailyTimings = await initSchedule();
  if (dailyTimings) {
    startCountdownEngine(dailyTimings);
  }

  // 2. Tarik Saldo Infaq untuk pertama kali
  syncSaldo();

  // 3. Tarik data saldo baru setiap 5 Menit (300.000 ms) - OPTIMIZED
  setInterval(syncSaldo, 5 * 60 * 1000);

  // 4. Protokol Pembersihan Harian (Refresh paksa jam 01:00 Dini Hari)
  setInterval(() => {
    const now = new Date();
    if (
      now.getHours() === 1 &&
      now.getMinutes() === 0 &&
      now.getSeconds() === 0
    ) {
      console.log("Pergantian hari terdeteksi. Memuat ulang sistem...");
      window.location.reload(true);
    }
  }, 1000);
});
