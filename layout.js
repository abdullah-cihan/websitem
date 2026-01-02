document.addEventListener("DOMContentLoaded", () => {
    renderLayout();
    initLayoutEvents();
});

function renderLayout() {
    // Görseldeki tasarımı birebir yansıtan HTML yapısı
    const headerHTML = `
    <header class="header">
        <div class="container nav-container">
            <a href="index.html" class="logo">A. Cihan<span class="dot">.</span></a>
            
            <div class="center-icon-wrapper" style="position: absolute; left: 50%; transform: translateX(-50%);">
                <button id="theme-toggle" class="theme-btn" aria-label="Ayarlar">
                    <i class="fa-solid fa-gear"></i> </button>
            </div>
            
            <div class="nav-right-side" style="display: flex; align-items: center; gap: 20px;">
                <nav>
                    <ul class="nav-links">
                        <li><a href="index.html">Ana Sayfa</a></li>
                        <li><a href="index.html#blog">Blog</a></li>
                        <li><a href="https://www.youtube.com/@teknolojikcozumvideo" target="_blank">YouTube</a></li>
                        <li><a href="#iletisim" class="btn-cta">İletişim</a></li>
                    </ul>
                </nav>

                <button class="hamburger" aria-label="Menüyü Aç">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>
        </div>
    </header>
    `;

    // Header'ı sayfanın en başına ekle (Eğer zaten ekli değilse)
    if (!document.querySelector('header.header')) {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }
}

function initLayoutEvents() {
    // 1. Tema / Ayar Butonu İşlevi
    const themeBtn = document.getElementById('theme-toggle');
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode'); // Mevcut CSS yapınıza göre toggle
            // İkonu döndürme efekti
            themeBtn.style.transform = 'rotate(90deg)';
            setTimeout(() => { themeBtn.style.transform = 'rotate(0deg)'; }, 300);
        });
    }

    // 2. Mobil Menü (Hamburger) İşlevi
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // 3. Aktif Sayfa İşaretleme (Opsiyonel: Hangi sayfadaysan onun linkini parlatır)
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.nav-links a');
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
            link.style.color = 'var(--primary)';
        }
    });
}
