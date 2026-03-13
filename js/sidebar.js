function loadNavigation() {
    let currentPage = window.location.pathname.split('/').pop();
    if (currentPage === '') currentPage = 'index.html';

    // Cek menu mana yang sedang aktif agar ikon kategori di bawah ikut menyala
    const isHarian = ['obat-keluar.html'].includes(currentPage);
    const isBulanan = ['stok.html', 'daftar-stok.html'].includes(currentPage);
    const isDatabase = ['master-obat.html', 'harga.html'].includes(currentPage);

    const navHTML = `
        <header class="mobile-header">
            <h2>Mutia<span>Care</span> 🌸</h2>
        </header>

        <nav class="app-nav desktop-sidebar">
            <div class="nav-brand">
                <h2>Mutia<span>Care</span> 🌸</h2>
            </div>
            <div class="nav-links">
                <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">
                    <span class="icon">🏠</span><span class="text">Dashboard</span>
                </a>

                <div class="nav-label">Harian</div>
                <a href="obat-keluar.html" class="${currentPage === 'obat-keluar.html' ? 'active' : ''}">
                    <span class="icon">💊</span><span class="text">Obat Keluar</span>
                </a>

                <div class="nav-label">Bulanan</div>
                <a href="stok.html" class="${currentPage === 'stok.html' ? 'active' : ''}">
                    <span class="icon">📦</span><span class="text">Input Opname</span>
                </a>
                <a href="daftar-stok.html" class="${currentPage === 'daftar-stok.html' ? 'active' : ''}">
                    <span class="icon">📋</span><span class="text">Laporan Stok</span>
                </a>

                <div class="nav-label">Database</div>
                <a href="master-obat.html" class="${currentPage === 'master-obat.html' ? 'active' : ''}">
                    <span class="icon">🗄️</span><span class="text">Master Obat</span>
                </a>
                <a href="harga.html" class="${currentPage === 'harga.html' ? 'active' : ''}">
                    <span class="icon">🏷️</span><span class="text">Harga & Update</span>
                </a>
            </div>
        </nav>

        <nav class="mobile-bottom-nav">
            <a href="index.html" class="nav-item ${currentPage === 'index.html' ? 'active' : ''}">
                <span class="icon">🏠</span><span class="text">Home</span>
            </a>
            <div class="nav-item ${isHarian ? 'active' : ''}" onclick="toggleMobilePopup('popup-harian')">
                <span class="icon">📝</span><span class="text">Harian</span>
            </div>
            <div class="nav-item ${isBulanan ? 'active' : ''}" onclick="toggleMobilePopup('popup-bulanan')">
                <span class="icon">📅</span><span class="text">Bulanan</span>
            </div>
            <div class="nav-item ${isDatabase ? 'active' : ''}" onclick="toggleMobilePopup('popup-database')">
                <span class="icon">🗄️</span><span class="text">Database</span>
            </div>
        </nav>

        <div class="mobile-popup-overlay" id="popup-overlay" onclick="closeAllPopups()"></div>
        
        <div class="mobile-popup" id="popup-harian">
            <h3>Menu Harian</h3>
            <a href="obat-keluar.html"><span class="icon">💊</span> Catat Obat Keluar</a>
        </div>
        
        <div class="mobile-popup" id="popup-bulanan">
            <h3>Menu Bulanan</h3>
            <a href="stok.html"><span class="icon">📦</span> Input Stok Opname</a>
            <a href="daftar-stok.html"><span class="icon">📋</span> Laporan Stok Akhir</a>
        </div>
        
        <div class="mobile-popup" id="popup-database">
            <h3>Database Sistem</h3>
            <a href="master-obat.html"><span class="icon">🗄️</span> Master Obat</a>
            <a href="harga.html"><span class="icon">🏷️</span> Harga & Update</a>
        </div>
    `;

    document.getElementById('layout-container').innerHTML = navHTML;
}

// Fungsi untuk animasi buka/tutup Pop-up
window.toggleMobilePopup = function(id) {
    closeAllPopups(); // Tutup yang lain dulu
    document.getElementById('popup-overlay').classList.add('show');
    document.getElementById(id).classList.add('show');
}

window.closeAllPopups = function() {
    document.getElementById('popup-overlay').classList.remove('show');
    document.querySelectorAll('.mobile-popup').forEach(popup => {
        popup.classList.remove('show');
    });
}

document.addEventListener("DOMContentLoaded", loadNavigation);