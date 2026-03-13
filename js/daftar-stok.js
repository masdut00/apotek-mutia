let dataLaporanExcel = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadDataGudang();

    // Live Search
    const searchInput = document.getElementById('search-stok');
    searchInput.addEventListener('keyup', function() {
        const keyword = this.value.toLowerCase();
        const rows = document.querySelectorAll('.baris-stok');
        rows.forEach(row => {
            const namaObat = row.querySelector('.nama-obat').textContent.toLowerCase();
            if (namaObat.includes(keyword)) row.style.display = '';
            else row.style.display = 'none';
        });
    });

    // Export Excel
    // ==========================================
    // EXPORT EXCEL (SESUAI TEMPLATE ATASAN)
    // ==========================================
    document.getElementById('btn-export').addEventListener('click', () => {
        if (dataLaporanExcel.length === 0) return alert("Data kosong!");

        // 1. Cek tab filter mana yang sedang aktif (Semua, Bawah, atau Atas)
        const btnAktif = document.querySelector('.btn-filter.active').innerText;
        let judulLokasi = "GABUNGAN";
        let filterLokasiExcel = "Semua";

        if (btnAktif.includes("Bawah")) {
            judulLokasi = "BAWAH";
            filterLokasiExcel = "Bawah";
        } else if (btnAktif.includes("Atas")) {
            judulLokasi = "ATAS";
            filterLokasiExcel = "Atas";
        }

        // 2. Tentukan Bulan dan Tahun saat ini untuk Judul Laporan
        const today = new Date();
        const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const bulanTahun = `${namaBulanArr[today.getMonth()]} ${today.getFullYear()}`; // Contoh: Maret 2026

        const teksJudul = `STOK OPNAME ${judulLokasi} ${bulanTahun}`.toUpperCase();

        // 3. Susun kerangka data Excel (Array of Arrays)
        const dataExcelSheet = [
            [teksJudul, "", "", "", "", "", "", "", "", ""], // Baris 1: Judul
            [""], // Baris 2: Kosong (Spasi)
            ["No", "Nama Barang", "JUMLAH AWAL", "OBAT MASUK", "OBAT KELUAR", "JUMLAH AKHIR", "Harga Beli", "Jumlah", "EXPIRE DATE", "BATCH"] // Baris 3: Header Tabel
        ];

        // 4. Masukkan baris data obat sesuai filter lokasi yang sedang dilihat
        let noUrut = 1;
        dataLaporanExcel.forEach(item => {
            // Jika filter diset ke Semua, masukkan semua. Jika Bawah/Atas, masukkan yang sesuai saja.
            if (filterLokasiExcel === "Semua" || item.Lokasi === filterLokasiExcel) {
                dataExcelSheet.push([
                    noUrut++,
                    item["Nama Barang"],
                    item["JUMLAH AWAL"],
                    item["OBAT MASUK"],
                    item["OBAT KELUAR"],
                    item["JUMLAH AKHIR"],
                    item["Harga Beli"],
                    item["Jumlah (Nilai)"],
                    item["EXPIRE DATE"],
                    item["BATCH"]
                ]);
            }
        });

        // 5. Buat Worksheet baru dari kerangka data tadi
        const worksheet = XLSX.utils.aoa_to_sheet(dataExcelSheet);

        // 6. Trik Rahasia: Merge Cell untuk Judul Laporan (Baris 1 dari Kolom A sampai J)
        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } } // r = row (0 is line 1), c = col (0 is A, 9 is J)
        ];

        // 7. Atur Lebar Kolom agar Excel-nya Rapi Saat Dibuka
        worksheet["!cols"] = [
            { wch: 5 },   // A: No
            { wch: 25 },  // B: Nama Barang
            { wch: 15 },  // C: JUMLAH AWAL
            { wch: 15 },  // D: OBAT MASUK
            { wch: 15 },  // E: OBAT KELUAR
            { wch: 15 },  // F: JUMLAH AKHIR
            { wch: 18 },  // G: Harga Beli
            { wch: 18 },  // H: Jumlah (Nilai Valuasi)
            { wch: 15 },  // I: EXPIRE DATE
            { wch: 15 }   // J: BATCH
        ];

        // 8. Generate dan Download File
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Opname ${judulLokasi}`);
        XLSX.writeFile(workbook, `Stok_Opname_${judulLokasi}_${bulanTahun.replace(" ", "_")}.xlsx`);
    });
});

async function loadDataGudang() {
    try {
        const response = await fetch(`${API_URL}?action=getDashboardData`);
        const data = await response.json();
        
        let htmlStok = '';
        dataLaporanExcel = [];
        let nomorUrut = 1;

        data.master.forEach(obat => {
            const logObat = data.stok.filter(s => s.Nama_Obat === obat.Nama_Obat);
            
            // Pisahkan log Atas dan Bawah
            const logAtas = logObat.filter(s => s.Lokasi === 'Atas');
            const logBawah = logObat.filter(s => s.Lokasi === 'Bawah');

            // Fungsi untuk merender baris
            const renderRow = (logArray, lokasiLabel) => {
                const dataTerakhir = logArray.length > 0 ? logArray[logArray.length - 1] : null;
                if (!dataTerakhir) return; // Jika belum ada input di lokasi ini, lewati

                const jumlahAkhir = dataTerakhir.Jumlah_Akhir || 0;
                let expireDate = dataTerakhir.Expire_Date || '-';
                if (expireDate.includes('T')) expireDate = expireDate.split('T')[0];
                
                let statusHTML = jumlahAkhir < obat.Stok_Minimal ? '<span style="color: #e74c3c; font-weight: bold; background: #fff5f5; padding: 4px 10px; border-radius: 8px;">Menipis</span>' : '<span style="color: #27ae60; font-weight: bold; background: #eafaf1; padding: 4px 10px; border-radius: 8px;">Aman</span>';
                let rowClass = jumlahAkhir < obat.Stok_Minimal ? 'row-danger' : '';

                // HTML
                htmlStok += `
                    <tr class="baris-stok ${rowClass}" data-lokasi="${lokasiLabel}">
                        <td class="nama-obat" style="font-weight: 700;">${obat.Nama_Obat}</td>
                        <td><span style="background:#eee; padding:3px 8px; border-radius:5px; font-size:12px;">${lokasiLabel}</span></td>
                        <td>${obat.Satuan}</td>
                        <td style="font-size: 16px; font-weight: 800; color: #4a4a4a;">${jumlahAkhir}</td>
                        <td><span style="color: #e67e22; font-size: 13px;">${expireDate}</span></td>
                        <td>${statusHTML}</td>
                    </tr>
                `;

                // Excel
                dataLaporanExcel.push({
                    "No": nomorUrut++,
                    "Lokasi": lokasiLabel,
                    "Nama Barang": obat.Nama_Obat,
                    "JUMLAH AWAL": dataTerakhir.Jumlah_Awal,
                    "OBAT MASUK": dataTerakhir.Obat_Masuk,
                    "OBAT KELUAR": dataTerakhir.Obat_Keluar,
                    "JUMLAH AKHIR": jumlahAkhir,
                    "Harga Beli": `Rp ${(dataTerakhir.Harga_Beli || 0).toLocaleString('id-ID')}`,
                    "Jumlah (Nilai)": `Rp ${(dataTerakhir.Total_Nilai || 0).toLocaleString('id-ID')}`,
                    "EXPIRE DATE": expireDate,
                    "BATCH": dataTerakhir.Batch || '-'
                });
            };

            renderRow(logBawah, 'Bawah');
            renderRow(logAtas, 'Atas');
        });

        document.querySelector('#table-daftar-stok tbody').innerHTML = htmlStok || '<tr><td colspan="6" style="text-align:center;">Belum ada data stok.</td></tr>';
    } catch (error) {
        document.querySelector('#table-daftar-stok tbody').innerHTML = `<tr><td colspan="6">Gagal memuat data.</td></tr>`;
    }
}

// Fungsi untuk Tab Filter Lokasi
window.filterLokasi = function(lokasiPilih, btnElement) {
    // 1. Hapus class 'active' dan reset warna dari semua tombol
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active'); // INI KODE YANG KURANG TADI
        btn.style.background = 'white';
        btn.style.color = '#ff758c';
    });
    
    // 2. Tambahkan class 'active' dan beri warna pada tombol yang sedang diklik
    btnElement.classList.add('active'); // INI KODE YANG KURANG TADI
    btnElement.style.background = '#ff758c';
    btnElement.style.color = 'white';

    // 3. Filter baris tabel di layar
    const rows = document.querySelectorAll('.baris-stok');
    rows.forEach(row => {
        const rowLokasi = row.getAttribute('data-lokasi');
        if (lokasiPilih === 'Semua' || rowLokasi === lokasiPilih) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};