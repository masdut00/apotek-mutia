let validObatList = [];
let dataRiwayatGlobal = []; // Menyimpan data untuk diolah jadi Excel

document.addEventListener("DOMContentLoaded", async () => {
    // Set default tanggal hari ini
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = todayStr;
    
    // Set default bulan untuk fitur Download Matriks (YYYY-MM)
    document.getElementById('filter-bulan').value = todayStr.substring(0, 7);

    await loadData();

    // Logika Custom Dropdown Obat
    const inputObat = document.getElementById('nama-obat');
    const listContainer = document.getElementById('list-nama-obat');
    const wrapper = document.getElementById('wrapper-nama-obat');

    inputObat.addEventListener('focus', () => { listContainer.classList.add('show'); filterList(''); });
    inputObat.addEventListener('input', (e) => { listContainer.classList.add('show'); filterList(e.target.value); });
    document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) listContainer.classList.remove('show'); });

    function filterList(keyword) {
        keyword = keyword.toLowerCase();
        listContainer.querySelectorAll('.custom-select-item').forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(keyword) ? 'block' : 'none';
        });
    }

    // ==========================================
    // LOGIKA SIMPAN DATA PENGELUARAN
    // ==========================================
    document.getElementById('form-obat-keluar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit');
        const inputNamaObat = document.getElementById('nama-obat').value;

        if (!validObatList.includes(inputNamaObat)) {
            alert("❌ Obat tidak valid!"); return;
        }

        btnSubmit.innerText = "Menyimpan...";
        btnSubmit.disabled = true;

        const payload = {
            action: 'catatObatKeluar',
            tanggal: document.getElementById('tanggal').value,
            nama_obat: inputNamaObat,
            jumlah: parseInt(document.getElementById('jumlah').value),
            kategori: document.getElementById('kategori').value,
            keterangan: document.getElementById('keterangan').value
        };

        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            await res.json();
            
            document.getElementById('nama-obat').value = "";
            document.getElementById('jumlah').value = "";
            document.getElementById('keterangan').value = "";
            
            alert("✅ Data berhasil dicatat!");
            await loadData(); // Refresh data

        } catch (error) {
            alert("Gagal menyimpan data.");
        } finally {
            btnSubmit.innerText = "Catat Pengeluaran";
            btnSubmit.disabled = false;
        }
    });

    // ==========================================
    // LOGIKA GENERATE MATRIKS EXCEL (1-31)
    // ==========================================
    document.getElementById('btn-download-matriks').addEventListener('click', () => {
        const filterBulan = document.getElementById('filter-bulan').value; // format: "YYYY-MM"
        const filterKategori = document.getElementById('filter-kategori').value; // "Umum" atau "BPJS"

        if (!filterBulan) return alert("Pilih bulan terlebih dahulu!");

        // 1. Filter data berdasarkan Bulan dan Kategori
        const dataBulanIni = dataRiwayatGlobal.filter(row => {
            if (!row.Tanggal) return false;
            let rowBulan = row.Tanggal;
            if (rowBulan.includes('T')) rowBulan = rowBulan.split('T')[0]; // Ambil YYYY-MM-DD
            
            return rowBulan.substring(0, 7) === filterBulan && row.Kategori === filterKategori;
        });

        if (dataBulanIni.length === 0) {
            return alert(`Tidak ada pengeluaran untuk Pasien ${filterKategori} di bulan ini.`);
        }

        // 2. Hitung jumlah hari di bulan tersebut (28/30/31)
        const [tahunStr, bulanStr] = filterBulan.split('-');
        const tahun = parseInt(tahunStr);
        const bulan = parseInt(bulanStr);
        const jumlahHari = new Date(tahun, bulan, 0).getDate();

        // 3. Ekstrak Daftar Obat Unik yang keluar bulan ini
        const obatUnik = new Set();
        dataBulanIni.forEach(r => obatUnik.add(r.Nama_Obat));
        const daftarObat = Array.from(obatUnik).sort();

        // 4. Siapkan Kerangka Matriks (Pivot)
        const matrix = {};
        daftarObat.forEach(obat => {
            matrix[obat] = Array(jumlahHari + 1).fill(0); // Index 1 sampai 31
        });

        // 5. Isi Matriks dengan Data
        dataBulanIni.forEach(row => {
            let tgl = row.Tanggal;
            if (tgl.includes('T')) tgl = tgl.split('T')[0];
            const hari = parseInt(tgl.split('-')[2]); // Ambil tanggalnya saja (1-31)
            
            matrix[row.Nama_Obat][hari] += parseInt(row.Jumlah) || 0;
        });

        // 6. Siapkan Laporan Excel (Array of Arrays)
        const namaBulanIndo = new Date(tahun, bulan - 1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const judulExcel = `PENGELUARAN OBAT BULAN ${namaBulanIndo.toUpperCase()} PASIEN ${filterKategori.toUpperCase()}`;
        
        const dataSheetExcel = [];
        dataSheetExcel.push([judulExcel]); // Baris 1: Judul
        dataSheetExcel.push([]); // Baris 2: Kosong

        // Baris Header Kolom (Nama Obat, 1, 2, 3 ... Total)
        const headerBaris = ["Nama Obat"];
        for (let i = 1; i <= jumlahHari; i++) headerBaris.push(i);
        headerBaris.push("TOTAL PENGELUARAN");
        dataSheetExcel.push(headerBaris);

        // Baris Data Per Obat
        const totalKolomHarian = Array(jumlahHari + 1).fill(0);
        daftarObat.forEach(obat => {
            const barisObat = [obat];
            let totalObatIni = 0;
            
            for (let i = 1; i <= jumlahHari; i++) {
                const nilai = matrix[obat][i];
                barisObat.push(nilai > 0 ? nilai : ""); // Kosongkan sel jika 0 (Biar rapi kaya di foto)
                totalObatIni += nilai;
                totalKolomHarian[i] += nilai;
            }
            barisObat.push(totalObatIni);
            dataSheetExcel.push(barisObat);
        });

        // Baris Paling Bawah: Total Harian
        const barisTotalBawah = ["TOTAL HARIAN"];
        let grandTotal = 0;
        for (let i = 1; i <= jumlahHari; i++) {
            barisTotalBawah.push(totalKolomHarian[i] > 0 ? totalKolomHarian[i] : "");
            grandTotal += totalKolomHarian[i];
        }
        barisTotalBawah.push(grandTotal);
        dataSheetExcel.push(barisTotalBawah);

        // 7. Ekspor ke Excel
        const worksheet = XLSX.utils.aoa_to_sheet(dataSheetExcel);
        worksheet["!merges"] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: jumlahHari + 1 } } ]; // Merge Judul

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${filterKategori}`);
        XLSX.writeFile(workbook, `Matriks_Pengeluaran_${filterKategori}_${filterBulan}.xlsx`);
    });
});

async function loadData() {
    try {
        // Ambil Data Master Obat
        const resObat = await fetch(`${API_URL}?action=getObat`);
        const dataObat = await resObat.json();
        
        const listContainer = document.getElementById('list-nama-obat');
        listContainer.innerHTML = ''; validObatList = []; 
        dataObat.forEach(obat => {
            validObatList.push(obat.Nama_Obat);
            const divItem = document.createElement('div');
            divItem.className = 'custom-select-item';
            divItem.textContent = obat.Nama_Obat;
            divItem.addEventListener('click', () => {
                document.getElementById('nama-obat').value = obat.Nama_Obat;
                listContainer.classList.remove('show');
            });
            listContainer.appendChild(divItem);
        });

        // Ambil Data Riwayat & Simpan Global
        const resRiwayat = await fetch(`${API_URL}?action=getObatKeluar`);
        dataRiwayatGlobal = await resRiwayat.json();
        
        const tbody = document.querySelector('#table-riwayat-keluar tbody');
        if (!dataRiwayatGlobal || dataRiwayatGlobal.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada riwayat.</td></tr>';
            return;
        }

        const riwayatTerbaru = [...dataRiwayatGlobal].reverse();
        let htmlRiwayat = '';
        
        riwayatTerbaru.forEach(row => {
            let dateStr = row.Tanggal;
            if (dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0]; 
            
            // Beri label warna untuk BPJS / Umum
            let badgeKategori = row.Kategori === "BPJS" ? 
                '<span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">BPJS</span>' : 
                '<span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">UMUM</span>';

            htmlRiwayat += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${badgeKategori}</td>
                    <td style="font-weight: 700;">${row.Nama_Obat}</td>
                    <td style="color: #e74c3c; font-weight: 800;">- ${row.Jumlah}</td>
                    <td>${row.Keterangan || '-'}</td>
                </tr>
            `;
        });
        tbody.innerHTML = htmlRiwayat;

    } catch (error) {
        console.error(error);
        document.querySelector('#table-riwayat-keluar tbody').innerHTML = '<tr><td colspan="5">Gagal menarik data.</td></tr>';
    }
}