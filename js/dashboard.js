document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${API_URL}?action=getDashboardData`);
        const data = await response.json();
        
        document.getElementById('total-obat').innerText = data.master.length;
        
        let htmlRekomendasi = '';
        let countMenipis = 0;

        // Mencari stok akhir terbaru dari tiap obat
        data.master.forEach(obat => {
            // Filter stok bulanan untuk obat ini, ambil yang terakhir (asumsi tersortir atau ambil log terakhir)
            const logStok = data.stok.filter(s => s.Nama_Obat === obat.Nama_Obat);
            const stokTerakhir = logStok.length > 0 ? logStok[logStok.length - 1].Stok_Akhir : 0;
            
            if (stokTerakhir < obat.Stok_Minimal) {
                countMenipis++;
                
                // Cari Harga Termurah dari 2 Supplier
                const logHarga = data.harga.filter(h => h.Nama_Obat === obat.Nama_Obat);
                let hargaApotek = logHarga.filter(h => h.Supplier.toLowerCase() === 'apotek').pop()?.Harga || Infinity;
                let hargaPBF = logHarga.filter(h => h.Supplier.toLowerCase() === 'pbf').pop()?.Harga || Infinity;
                
                let supplierTermurah = '-';
                let hargaTermurah = 0;

                if (hargaApotek < hargaPBF) { supplierTermurah = 'Apotek'; hargaTermurah = hargaApotek; }
                else if (hargaPBF < hargaApotek) { supplierTermurah = 'PBF'; hargaTermurah = hargaPBF; }
                else if (hargaPBF === hargaApotek && hargaPBF !== Infinity) { supplierTermurah = 'Sama'; hargaTermurah = hargaPBF; }

                htmlRekomendasi += `
                    <tr class="row-danger">
                        <td>${obat.Nama_Obat}</td>
                        <td>${stokTerakhir} (Min: ${obat.Stok_Minimal})</td>
                        <td>${supplierTermurah}</td>
                        <td>Rp ${hargaTermurah === Infinity ? '-' : hargaTermurah.toLocaleString('id-ID')}</td>
                    </tr>
                `;
            }
        });

        document.getElementById('obat-menipis').innerText = countMenipis;
        document.getElementById('table-rekomendasi').querySelector('tbody').innerHTML = htmlRekomendasi || '<tr><td colspan="4">Semua stok aman.</td></tr>';

    } catch (error) {
        console.error("Gagal memuat data:", error);
    }
});