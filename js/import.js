document.getElementById('btn-upload').addEventListener('click', () => {
    const file = document.getElementById('file-excel').files[0];
    if (!file) return alert("Pilih file Excel terlebih dahulu!");

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Konversi excel ke JSON
        const jsonExcel = XLSX.utils.sheet_to_json(worksheet);
        
        // Kirim ke API Apps Script
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'importHarga', items: jsonExcel })
            });
            const result = await res.json();
            alert(result.message);
        } catch (error) {
            alert("Gagal upload data: " + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
});     