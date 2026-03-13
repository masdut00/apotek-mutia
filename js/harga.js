document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${API_URL}?action=getDashboardData`);
        const data = await response.json();
        
        let htmlHarga = '';

        data.master.forEach(obat => {
            const logHarga = data.harga.filter(h => h.Nama_Obat === obat.Nama_Obat);
            
            let hargaApotek = logHarga.filter(h => h.Supplier.toLowerCase() === 'apotek').pop()?.Harga || 0;
            let hargaPBF = logHarga.filter(h => h.Supplier.toLowerCase() === 'pbf').pop()?.Harga || 0;
            
            let termurah = "-";
            if (hargaApotek > 0 && hargaPBF > 0) {
                if (hargaApotek < hargaPBF) termurah = "Apotek";
                else if (hargaPBF < hargaApotek) termurah = "PBF";
                else termurah = "Sama Murah";
            } else if (hargaApotek > 0) {
                termurah = "Apotek";
            } else if (hargaPBF > 0) {
                termurah = "PBF";
            }

            const formatRp = (angka) => angka === 0 ? "-" : `Rp ${angka.toLocaleString('id-ID')}`;

            htmlHarga += `
                <tr class="baris-obat">
                    <td class="nama-obat">${obat.Nama_Obat}</td>
                    <td>${formatRp(hargaApotek)}</td>
                    <td>${formatRp(hargaPBF)}</td>
                    <td style="font-weight:bold; color: #27ae60;">${termurah}</td>
                </tr>
            `;
        });

        document.querySelector('#table-harga tbody').innerHTML = htmlHarga;

        // ==========================================
        // FITUR LIVE SEARCH (PENCARIAN OBAT)
        // ==========================================
        const searchInput = document.getElementById('search-obat');
        searchInput.addEventListener('keyup', function() {
            const keyword = this.value.toLowerCase(); // Ambil huruf yang diketik & ubah ke huruf kecil
            const rows = document.querySelectorAll('.baris-obat'); // Ambil semua baris di tabel

            rows.forEach(row => {
                // Ambil teks dari kolom pertama (Nama Obat)
                const namaObat = row.querySelector('.nama-obat').textContent.toLowerCase();
                
                // Jika nama obat mengandung kata kunci, tampilkan. Jika tidak, sembunyikan.
                if (namaObat.includes(keyword)) {
                    row.style.display = ''; 
                } else {
                    row.style.display = 'none'; 
                }
            });
        });

    } catch (error) {
        document.querySelector('#table-harga tbody').innerHTML = `<tr><td colspan="4">Gagal memuat data.</td></tr>`;
        console.error("Error:", error);
    }
});