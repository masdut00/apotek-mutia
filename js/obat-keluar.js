let validObatList = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Set tanggal hari ini
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = today;

    // Panggil data awal
    await loadData();

    // ==========================================
    // LOGIKA CUSTOM SEARCHABLE DROPDOWN
    // ==========================================
    const inputObat = document.getElementById('nama-obat');
    const listContainer = document.getElementById('list-nama-obat');
    const wrapper = document.getElementById('wrapper-nama-obat');

    // Munculkan list saat input diklik/difokuskan
    inputObat.addEventListener('focus', () => {
        listContainer.classList.add('show');
        filterList(''); // Tampilkan semua list awal
    });

    // Filter list saat mengetik
    inputObat.addEventListener('input', (e) => {
        listContainer.classList.add('show');
        filterList(e.target.value);
    });

    // Sembunyikan list saat klik di luar area dropdown
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            listContainer.classList.remove('show');
        }
    });

    // Fungsi untuk menyaring item di dalam list kustom
    function filterList(keyword) {
        keyword = keyword.toLowerCase();
        const items = listContainer.querySelectorAll('.custom-select-item');
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(keyword)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // ==========================================
    // LOGIKA SUBMIT FORM
    // ==========================================
    document.getElementById('form-obat-keluar').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = document.getElementById('btn-submit');
        const inputNamaObat = document.getElementById('nama-obat').value;

        // Validasi Typo
        if (!validObatList.includes(inputNamaObat)) {
            alert("❌ Obat tidak valid! Silakan pilih obat dari daftar yang muncul.");
            return;
        }

        btnSubmit.innerText = "Menyimpan...";
        btnSubmit.disabled = true;

        const payload = {
            action: 'catatObatKeluar',
            tanggal: document.getElementById('tanggal').value,
            nama_obat: inputNamaObat,
            jumlah: parseInt(document.getElementById('jumlah').value),
            keterangan: document.getElementById('keterangan').value
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            // Kosongkan form
            document.getElementById('nama-obat').value = "";
            document.getElementById('jumlah').value = "";
            document.getElementById('keterangan').value = "";
            
            alert("✅ " + (result.message || "Data berhasil dicatat!"));
            await loadData(); // Refresh tabel bawah

        } catch (error) {
            alert("Gagal menyimpan data. Periksa koneksi internet.");
            console.error(error);
        } finally {
            btnSubmit.innerText = "Catat Pengeluaran";
            btnSubmit.disabled = false;
        }
    });
});

async function loadData() {
    try {
        // 1. Ambil data Master Obat dan buat Custom List
        const resObat = await fetch(`${API_URL}?action=getObat`);
        const dataObat = await resObat.json();
        
        const listContainer = document.getElementById('list-nama-obat');
        const inputObat = document.getElementById('nama-obat');
        
        listContainer.innerHTML = ''; 
        validObatList = []; 

        dataObat.forEach(obat => {
            validObatList.push(obat.Nama_Obat);
            
            // Buat elemen item untuk dropdown
            const divItem = document.createElement('div');
            divItem.className = 'custom-select-item';
            divItem.textContent = obat.Nama_Obat;
            
            // Saat item diklik, masukkan nilainya ke input, lalu tutup list
            divItem.addEventListener('click', () => {
                inputObat.value = obat.Nama_Obat;
                listContainer.classList.remove('show');
            });
            
            listContainer.appendChild(divItem);
        });

        // 2. Ambil data Riwayat Obat Keluar
        const resRiwayat = await fetch(`${API_URL}?action=getObatKeluar`);
        const dataRiwayat = await resRiwayat.json();
        
        const tbody = document.querySelector('#table-riwayat-keluar tbody');
        
        if (!dataRiwayat || dataRiwayat.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada riwayat obat keluar.</td></tr>';
            return;
        }

        const riwayatTerbaru = dataRiwayat.reverse();
        let htmlRiwayat = '';
        
        riwayatTerbaru.forEach(row => {
            let dateStr = row.Tanggal;
            if (dateStr && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0]; 
            }

            htmlRiwayat += `
                <tr>
                    <td>${dateStr}</td>
                    <td style="font-weight: 700;">${row.Nama_Obat}</td>
                    <td style="color: #e74c3c; font-weight: 800;">- ${row.Jumlah}</td>
                    <td>${row.Keterangan || '-'}</td>
                </tr>
            `;
        });

        tbody.innerHTML = htmlRiwayat;

    } catch (error) {
        console.error("Gagal memuat data:", error);
        document.querySelector('#table-riwayat-keluar tbody').innerHTML = '<tr><td colspan="4" style="text-align:center;">Gagal menarik data riwayat.</td></tr>';
    }
}