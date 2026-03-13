let daftarObatAda = [];
let modeEdit = false;
let namaObatYangDiedit = "";

document.addEventListener("DOMContentLoaded", async () => {
    await loadMasterData();

    // LOGIKA SIMPAN / UPDATE OBAT
    document.getElementById('form-master-obat').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inputNama = document.getElementById('nama-obat-baru').value.trim();
        const inputSatuan = document.getElementById('satuan-obat').value;
        const inputMinimal = parseInt(document.getElementById('stok-minimal').value);

        // Validasi Duplikat (Hanya jalan saat Mode Tambah Baru, bukan Edit)
        if (!modeEdit) {
            const isDuplicate = daftarObatAda.some(nama => nama.toLowerCase() === inputNama.toLowerCase());
            if (isDuplicate) return alert(`❌ Obat "${inputNama}" sudah ada di sistem!`);
        }

        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.innerText = "Memproses..."; btnSubmit.disabled = true;

        const payload = {
            action: modeEdit ? 'editMasterObat' : 'tambahMasterObat',
            nama_obat_lama: namaObatYangDiedit,
            nama_obat: inputNama,
            satuan: inputSatuan,
            stok_minimal: inputMinimal
        };

        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            
            // Reset Form & Mode
            document.getElementById('form-master-obat').reset();
            modeEdit = false;
            namaObatYangDiedit = "";
            btnSubmit.innerText = "Simpan ke Database";
            
            alert("✅ " + result.message);
            await loadMasterData();

        } catch (error) {
            alert("Gagal memproses. Periksa koneksi internet.");
        } finally {
            btnSubmit.disabled = false;
        }
    });

    // FITUR LIVE SEARCH
    document.getElementById('search-master').addEventListener('keyup', function() {
        const keyword = this.value.toLowerCase();
        document.querySelectorAll('.baris-master').forEach(row => {
            const namaObat = row.querySelector('.nama-obat').textContent.toLowerCase();
            row.style.display = namaObat.includes(keyword) ? '' : 'none';
        });
    });
});

async function loadMasterData() {
    try {
        const res = await fetch(`${API_URL}?action=getObat`);
        const data = await res.json();
        
        const tbody = document.querySelector('#table-master tbody');
        daftarObatAda = [];
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Database kosong.</td></tr>';
            return;
        }

        let html = '';
        data.forEach(obat => {
            daftarObatAda.push(obat.Nama_Obat);
            
            // Parameter fungsi onClick untuk tombol Edit & Delete
            const obatParams = `'${obat.Nama_Obat}', '${obat.Satuan}', ${obat.Stok_Minimal}`;
            
            html += `
                <tr class="baris-master">
                    <td style="color: #888;">#${obat.ID_Obat}</td>
                    <td class="nama-obat" style="font-weight: 700;">${obat.Nama_Obat}</td>
                    <td><span style="background: #f8faff; color: #3b82f6; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 8px; font-size: 12px;">${obat.Satuan}</span></td>
                    <td><span style="font-weight: bold; color: #e74c3c;">${obat.Stok_Minimal}</span></td>
                    <td>
                        <button class="btn-aksi btn-edit" onclick="siapkanEdit(${obatParams})">✏️ Edit</button>
                        <button class="btn-aksi btn-delete" onclick="hapusObat('${obat.Nama_Obat}')">🗑️ Hapus</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        document.querySelector('#table-master tbody').innerHTML = '<tr><td colspan="5">Gagal memuat data.</td></tr>';
    }
}

// Fungsi Tarik Data ke Form Atas (Edit)
window.siapkanEdit = function(nama, satuan, minimal) {
    modeEdit = true;
    namaObatYangDiedit = nama;
    
    document.getElementById('nama-obat-baru').value = nama;
    document.getElementById('satuan-obat').value = satuan;
    document.getElementById('stok-minimal').value = minimal;
    
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.innerText = "🔄 Update Data Obat";
    
    // Scroll layar ke atas agar Kak Mutia langsung melihat formnya
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fungsi Hapus Obat
window.hapusObat = async function(nama) {
    if (!confirm(`⚠️ YAKIN INGIN MENGHAPUS "${nama}" DARI DATABASE?\nSemua histori terkait obat ini mungkin akan terpengaruh.`)) return;

    try {
        const payload = { action: 'hapusMasterObat', nama_obat: nama };
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        alert("✅ " + result.message);
        await loadMasterData();
    } catch (error) {
        alert("Gagal menghapus obat.");
    }
}