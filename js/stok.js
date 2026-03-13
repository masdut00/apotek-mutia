let validObatList = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Set Bulan otomatis
    const today = new Date();
    const bulanArr = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    document.getElementById('bulan').value = `${bulanArr[today.getMonth()]} ${today.getFullYear()}`;

    await loadDataObat();

    // Logika Custom Dropdown
    const inputObat = document.getElementById('nama-obat');
    const listContainer = document.getElementById('list-nama-obat');
    const wrapper = document.getElementById('wrapper-nama-obat');

    inputObat.addEventListener('focus', () => { listContainer.classList.add('show'); filterList(''); });
    inputObat.addEventListener('input', (e) => { listContainer.classList.add('show'); filterList(e.target.value); });
    document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) listContainer.classList.remove('show'); });

    function filterList(keyword) {
        const items = listContainer.querySelectorAll('.custom-select-item');
        items.forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(keyword.toLowerCase()) ? 'block' : 'none';
        });
    }

    // ==========================================
    // AUTO KALKULASI JUMLAH AKHIR & TOTAL NILAI
    // ==========================================
    const elAwal = document.getElementById('jumlah-awal');
    const elMasuk = document.getElementById('obat-masuk');
    const elKeluar = document.getElementById('obat-keluar');
    const elAkhir = document.getElementById('jumlah-akhir');
    const elHargaBeli = document.getElementById('harga-beli');
    const elTotalNilai = document.getElementById('total-nilai');

    function hitungOtomatis() {
        const awal = parseInt(elAwal.value) || 0;
        const masuk = parseInt(elMasuk.value) || 0;
        const keluar = parseInt(elKeluar.value) || 0;
        const hargaBeli = parseInt(elHargaBeli.value) || 0;

        // Rumus Mutasi Stok
        const akhir = awal + masuk - keluar;
        elAkhir.value = akhir;

        // Rumus Valuasi
        const total = akhir * hargaBeli;
        // Format ke Rupiah
        elTotalNilai.value = "Rp " + total.toLocaleString('id-ID');
    }

    // Jalankan hitungOtomatis setiap kali user mengetik angka
    [elAwal, elMasuk, elKeluar, elHargaBeli].forEach(el => {
        el.addEventListener('input', hitungOtomatis);
    });

    // ==========================================
    // SUBMIT FORM
    // ==========================================
    document.getElementById('form-stok').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit');
        const inputNamaObat = document.getElementById('nama-obat').value;

        if (!validObatList.includes(inputNamaObat)) {
            alert("❌ Obat tidak valid! Silakan pilih dari daftar.");
            return;
        }

        btnSubmit.innerText = "Menyimpan...";
        btnSubmit.disabled = true;

        const payload = {
            action: 'tambahStokBulanan',
            bulan: document.getElementById('bulan').value,
            lokasi: document.getElementById('lokasi').value, // <-- BARIS BARU INI
            nama_obat: inputNamaObat,
            jumlah_awal: parseInt(elAwal.value) || 0,
            obat_masuk: parseInt(elMasuk.value) || 0,
            obat_keluar: parseInt(elKeluar.value) || 0,
            jumlah_akhir: parseInt(elAkhir.value) || 0,
            harga_beli: parseInt(elHargaBeli.value) || 0,
            total_nilai: (parseInt(elAkhir.value) || 0) * (parseInt(elHargaBeli.value) || 0),
            expire_date: document.getElementById('expire-date').value,
            batch: document.getElementById('batch').value
        };

        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            
            // Reset form
            document.getElementById('form-stok').reset();
            document.getElementById('bulan').value = `${bulanArr[today.getMonth()]} ${today.getFullYear()}`;
            elAkhir.value = "";
            elTotalNilai.value = "";
            
            alert("✅ " + (result.message || "Stok Opname berhasil disimpan!"));
        } catch (error) {
            alert("Gagal menyimpan data.");
        } finally {
            btnSubmit.innerText = "Simpan Stok Opname";
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
        
        dataObat.forEach(obat => {
            validObatList.push(obat.Nama_Obat);
            const divItem = document.createElement('div');
            divItem.className = 'custom-select-item';
            divItem.textContent = obat.Nama_Obat;
            divItem.addEventListener('click', () => {
                inputObat.value = obat.Nama_Obat;
                listContainer.classList.remove('show');
            });
            listContainer.appendChild(divItem);
        });
    } catch (error) {}
}