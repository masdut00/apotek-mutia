document.addEventListener("DOMContentLoaded", async () => {
    // Variabel global untuk menyimpan data bersih yang siap diexport ke Excel
    let dataLaporanExcel = [];

    try {
        const response = await fetch(`${API_URL}?action=getDashboardData`);
        const data = await response.json();
        
        let htmlStok = '';

        data.master.forEach(obat => {
            const logStok = data.stok.filter(s => s.Nama_Obat === obat.Nama_Obat);
            const stokTerakhir = logStok.length > 0 ? logStok[logStok.length - 1].Stok_Akhir : 0;
            
            let statusHTML = '';
            let rowClass = '';
            let statusText = ''; // Status teks bersih untuk Excel
            
            if (stokTerakhir < obat.Stok_Minimal) {
                statusHTML = '<span style="color: #e74c3c; font-weight: bold; background: #fff5f5; padding: 4px 10px; border-radius: 8px;">Menipis</span>';
                rowClass = 'row-danger';
                statusText = 'PERLU DIBELI (Menipis)';
            } else {
                statusHTML = '<span style="color: #27ae60; font-weight: bold; background: #eafaf1; padding: 4px 10px; border-radius: 8px;">Aman</span>';
                statusText = 'Aman';
            }

            // 1. Masukkan ke HTML untuk tampilan Web
            htmlStok += `
                <tr class="baris-stok ${rowClass}">
                    <td class="nama-obat" style="font-weight: 700;">${obat.Nama_Obat}</td>
                    <td>${obat.Satuan}</td>
                    <td style="font-size: 16px; font-weight: 800; color: #4a4a4a;">${stokTerakhir}</td>
                    <td>${obat.Stok_Minimal}</td>
                    <td>${statusHTML}</td>
                </tr>
            `;

            // 2. Masukkan ke Array untuk laporan Excel
            dataLaporanExcel.push({
                "Nama Obat": obat.Nama_Obat,
                "Satuan": obat.Satuan,
                "Stok Aktual": stokTerakhir,
                "Batas Minimal": obat.Stok_Minimal,
                "Status": statusText
            });
        });

        document.querySelector('#table-daftar-stok tbody').innerHTML = htmlStok;

        // ==========================================
        // FITUR LIVE SEARCH
        // ==========================================
        const searchInput = document.getElementById('search-stok');
        searchInput.addEventListener('keyup', function() {
            const keyword = this.value.toLowerCase();
            const rows = document.querySelectorAll('.baris-stok');

            rows.forEach(row => {
                const namaObat = row.querySelector('.nama-obat').textContent.toLowerCase();
                if (namaObat.includes(keyword)) {
                    row.style.display = ''; 
                } else {
                    row.style.display = 'none'; 
                }
            });
        });

    } catch (error) {
        document.querySelector('#table-daftar-stok tbody').innerHTML = `<tr><td colspan="5">Gagal memuat data.</td></tr>`;
        console.error("Error:", error);
    }

    // ==========================================
    // FITUR EXPORT / DOWNLOAD KE EXCEL
    // ==========================================
    document.getElementById('btn-export').addEventListener('click', () => {
        if (dataLaporanExcel.length === 0) {
            alert("Data stok masih kosong atau sedang dimuat!");
            return;
        }

        // Konversi data array JSON tadi menjadi format Worksheet Excel
        const worksheet = XLSX.utils.json_to_sheet(dataLaporanExcel);
        
        // Buat Workbook (File Excel) baru dan tempelkan Worksheet-nya
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok");

        // Buat nama file otomatis sesuai tanggal hari ini (contoh: Laporan_Stok_MutiaCare_13-03-2026.xlsx)
        const today = new Date();
        const dateString = ("0" + today.getDate()).slice(-2) + "-" + 
                           ("0" + (today.getMonth() + 1)).slice(-2) + "-" + 
                           today.getFullYear();
                           
        const fileName = `Laporan_Stok_MutiaCare_${dateString}.xlsx`;

        // Perintah download
        XLSX.writeFile(workbook, fileName);
    });
});