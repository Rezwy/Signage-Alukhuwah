export function initClock() {
    const clockDisplay = document.getElementById('clock-display');
    const dateDisplay = document.getElementById('date-display');

    setInterval(() => {
        const now = new Date();
        
        // Format Jam (HH:mm:ss atau HH:mm, sesuaikan dengan lebar layarmu)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        // Tugas tambahanmu: Tulis fungsi terpisah untuk merender tanggal lokal
        // Jangan biarkan format default bahasa Inggris muncul di sini.
    }, 1000);
}