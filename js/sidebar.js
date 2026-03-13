function loadNavigation() {
    let currentPage = window.location.pathname.split('/').pop();
    if (currentPage === '') currentPage = 'index.html';

    const navHTML = `
        <header class="mobile-header">
            <h2>Mutia<span>Care</span> 🌸</h2>
        </header>

        <nav class="app-nav">
            <div class="nav-brand">
                <h2>Mutia<span>Care</span> 🌸</h2>
            </div>
            <div class="nav-links">
                <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">
                    <span class="icon">🏠</span><span class="text">Dashboard</span>
                </a>
                <a href="daftar-stok.html" class="${currentPage === 'daftar-stok.html' ? 'active' : ''}">
                    <span class="icon">📋</span><span class="text">Daftar Stok</span>
                </a>
                <a href="obat-keluar.html" class="${currentPage === 'obat-keluar.html' ? 'active' : ''}">
                    <span class="icon">💊</span><span class="text">Obat Keluar</span>
                </a>
                <a href="stok.html" class="${currentPage === 'stok.html' ? 'active' : ''}">
                    <span class="icon">📦</span><span class="text">Input Stok</span>
                </a>
                <a href="harga.html" class="${currentPage === 'harga.html' ? 'active' : ''}">
                    <span class="icon">💊</span><span class="text">Harga Obat</span>
                </a>
                <a href="import.html" class="${currentPage === 'import.html' ? 'active' : ''}">
                    <span class="icon">📥</span><span class="text">Import Excel</span>
                </a>
            </div>
        </nav>
    `;

    document.getElementById('layout-container').innerHTML = navHTML;
}

document.addEventListener("DOMContentLoaded", loadNavigation);