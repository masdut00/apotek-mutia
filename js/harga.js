document.addEventListener("DOMContentLoaded", async () => {
    await loadDataHarga();

    // LIVE SEARCH
    document.getElementById('search-obat').addEventListener('keyup', function() {
        const keyword = this.value.toLowerCase();
        document.querySelectorAll('.baris-obat').forEach(row => {
            const namaObat = row.querySelector('.nama-obat').textContent.toLowerCase();
            row.style.display = namaObat.includes(keyword) ? '' : 'none';
        });
    });

    // IMPORT EXCEL HARGA (Tetap dipertahankan)
    document.getElementById('btn-upload').addEventListener('click', () => {
        const file = document.getElementById('file-excel').files[0];
        if (!file) return alert("Pilih file Excel terlebih dahulu!");

        const btnUpload = document.getElementById('btn-upload');
        btnUpload.innerText = "Mengunggah...";

        const reader = new FileReader();
        reader.onload = async function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonExcel = XLSX.utils.sheet_to_json(worksheet);
            
            try {
                const res = await fetch(API_URL, {
                    method: 'POST', body: JSON.stringify({ action: 'importHarga', items: jsonExcel })
                });
                const result = await res.json();
                alert("✅ " + result.message);
                await loadDataHarga();
            } catch (error) {
                alert("Gagal upload data.");
            } finally {
                btnUpload.innerText = "📥 Update Harga";
            }
        };
        reader.readAsArrayBuffer(file);
    });
});

async function loadDataHarga() {
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
                termurah = hargaApotek < hargaPBF ? "Apotek" : (hargaPBF < hargaApotek ? "PBF" : "Sama Murah");
            } else if (hargaApotek > 0) termurah = "Apotek";
            else if (hargaPBF > 0) termurah = "PBF";

            const formatRp = (angka) => angka === 0 ? "-" : `Rp ${angka.toLocaleString('id-ID')}`;

            htmlHarga += `
                <tr class="baris-obat">
                    <td class="nama-obat" style="font-weight:700;">${obat.Nama_Obat}</td>
                    <td>
                        ${formatRp(hargaApotek)} 
                        <button class="btn-aksi btn-edit" style="padding:2px 5px; margin-left:8px;" onclick="editHargaCepat('${obat.Nama_Obat}', 'Apotek', ${hargaApotek})">✏️</button>
                    </td>
                    <td>
                        ${formatRp(hargaPBF)} 
                        <button class="btn-aksi btn-edit" style="padding:2px 5px; margin-left:8px;" onclick="editHargaCepat('${obat.Nama_Obat}', 'PBF', ${hargaPBF})">✏️</button>
                    </td>
                    <td style="font-weight:bold; color: #27ae60;">${termurah}</td>
                    <td>
                        <button class="btn-aksi btn-delete" onclick="hapusHarga('${obat.Nama_Obat}')">🗑️ Reset</button>
                    </td>
                </tr>
            `;
        });

        document.querySelector('#table-harga tbody').innerHTML = htmlHarga;
    } catch (error) {
        document.querySelector('#table-harga tbody').innerHTML = `<tr><td colspan="5">Gagal memuat data.</td></tr>`;
    }
}

// Fungsi Edit Harga Cepat menggunakan Prompt Bawaan Browser
window.editHargaCepat = async function(namaObat, supplier, hargaLama) {
    const inputHarga = prompt(`Masukkan Harga ${supplier} Baru untuk "${namaObat}":`, hargaLama || 0);
    
    if (inputHarga === null || inputHarga === "") return; // Dibatalkan oleh user
    
    const hargaBaru = parseInt(inputHarga);
    if (isNaN(hargaBaru)) return alert("❌ Harga harus berupa angka!");

    try {
        const payload = { action: 'editHargaObat', nama_obat: namaObat, supplier: supplier, harga_baru: hargaBaru };
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        alert("✅ " + result.message);
        await loadDataHarga();
    } catch (error) {
        alert("Gagal mengupdate harga.");
    }
}

// Fungsi Hapus/Reset Seluruh Riwayat Harga Obat Tersebut
window.hapusHarga = async function(nama) {
    if (!confirm(`⚠️ Yakin ingin MERESET (Menghapus) data harga Apotek & PBF untuk "${nama}"?`)) return;

    try {
        const payload = { action: 'hapusHargaObat', nama_obat: nama };
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        alert("✅ " + result.message);
        await loadDataHarga();
    } catch (error) {
        alert("Gagal mereset harga.");
    }
}