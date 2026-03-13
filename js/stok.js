let validObatList = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Bonus Fitur: Otomatis isi kolom Bulan & Tahun sesuai waktu saat ini
    const today = new Date();
    const bulanArr = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const bulanSekarang = `${bulanArr[today.getMonth()]} ${today.getFullYear()}`;
    document.getElementById('bulan').value = bulanSekarang;

    // Ambil data obat dari API
    await loadDataObat();

    // ==========================================
    // LOGIKA CUSTOM SEARCHABLE DROPDOWN
    // ==========================================
    const inputObat = document.getElementById('nama-obat');
    const listContainer = document.getElementById('list-nama-obat');
    const wrapper = document.getElementById('wrapper-nama-obat');

    inputObat.addEventListener('focus', () => {
        listContainer.classList.add('show');
        filterList('');
    });

    inputObat.addEventListener('input', (e) => {
        listContainer.classList.add('show');
        filterList(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            listContainer.classList.remove('show');
        }
    });

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
    document.getElementById('form-stok').addEventListener('submit', async (e) => {
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

        const bulan = document.getElementById('bulan').value;
        const stok_awal = parseInt(document.getElementById('stok-awal').value);
        const stok_akhir = parseInt(document.getElementById('stok-akhir').value);
        const terjual = stok_awal - stok_akhir;

        const payload = {
            action: 'tambahStokBulanan',
            bulan: bulan,
            nama_obat: inputNamaObat,
            stok_awal: stok_awal,
            stok_akhir: stok_akhir,
            terjual: terjual
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            // Kosongkan form setelah sukses (kecuali bulan)
            document.getElementById('nama-obat').value = "";
            document.getElementById('stok-awal').value = "";
            document.getElementById('stok-akhir').value = "";
            
            alert("✅ " + (result.message || "Stok berhasil disimpan!"));

        } catch (error) {
            alert("Gagal menyimpan data. Periksa koneksi internet.");
            console.error(error);
        } finally {
            btnSubmit.innerText = "Simpan Stok";
            btnSubmit.disabled = false;
        }
    });
});

async function loadDataObat() {
    try {
        const resObat = await fetch(`${API_URL}?action=getObat`);
        const dataObat = await resObat.json();
        
        const listContainer = document.getElementById('list-nama-obat');
        const inputObat = document.getElementById('nama-obat');
        
        listContainer.innerHTML = ''; 
        validObatList = []; 

        dataObat.forEach(obat => {
            validObatList.push(obat.Nama_Obat);
            
            const divItem = document.createElement('div');
            divItem.className = 'custom-select-item';
            divItem.textContent = obat.Nama_Obat;
            
            // Event ketika item obat diklik
            divItem.addEventListener('click', () => {
                inputObat.value = obat.Nama_Obat;
                listContainer.classList.remove('show');
            });
            
            listContainer.appendChild(divItem);
        });
    } catch (error) {
        console.error("Gagal memuat daftar obat:", error);
    }
}