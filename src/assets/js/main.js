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
// ORKESTRASI UTAMA (Tahan Banting & Paralel)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistem Kiosk Dimulai...");

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

  // 2. JALUR SALDO INFAQ (Jalan Mandiri, Tidak Menunggu Jadwal)
  syncSaldo();
  setInterval(syncSaldo, 5 * 60 * 1000);

  // 3. JALUR PROTOKOL PEMBERSIHAN HARIAN
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 1 && now.getMinutes() === 0 && now.getSeconds() === 0) {
      window.location.reload(true);
    }
  }, 1000);
});