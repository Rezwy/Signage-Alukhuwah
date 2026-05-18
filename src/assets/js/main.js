// File: src/assets/js/main.js

import { initSchedule } from "./schedule.js";
import { startCountdownEngine } from "./countdown.js";

// ==========================================
// KONSTANTA GLOBAL
// ==========================================
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk2uSgP7O8r4bkc3tU93XodUZw26kSSFnsAST5lR0aRgr3dO-Ds_VJGjxPxeU-QA3NOD0JqPbUUvdp/pub?gid=0&single=true&output=csv";

// ==========================================
// FUNGSI SINKRONISASI SALDO
// ==========================================
async function syncSaldo() {
  try {
    const response = await fetch(`${SPREADSHEET_CSV_URL}&t=${new Date().getTime()}`);
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

    document.getElementById("saldo-infaq").textContent = formattedSaldo;
    console.log("Saldo disinkronkan:", formattedSaldo);
  } catch (error) {
    console.error("Sinkronisasi Saldo Gagal:", error);
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

  // 3. Tarik data saldo baru setiap 15 Menit (900.000 ms)
  setInterval(syncSaldo, 5 * 60 * 1000);

  // 4. Protokol Pembersihan Harian (Refresh paksa jam 01:00 Dini Hari)
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 1 && now.getMinutes() === 0 && now.getSeconds() === 0) {
      console.log("Pergantian hari terdeteksi. Memuat ulang sistem...");
      window.location.reload(true);
    }
  }, 1000);
});