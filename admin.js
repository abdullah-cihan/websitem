/* ============================================================
   ADMIN CORE - YÖNETİM PANELİ ÇEKİRDEK DOSYASI (V-FINAL)
   ============================================================ */

(function () {
    // ✅ YENİ API LİNKİ
    const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec";

    // ==========================================
    // 1. GÜVENLİK VE BAŞLANGIÇ
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        
        // A) Giriş Kontrolü
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            window.location.href = 'login.html';
            return;
        }

        // B) Kullanıcı Adı
        const adminName = localStorage.getItem('adminName') || 'Yönetici';
        const profileNameEl = document.querySelector('.user-info span');
        if(profileNameEl) profileNameEl.innerText = adminName;

        // C) Dashboard İstatistikleri
        loadDashboardStats();

        // D) Menü Yönetimi (Varsayılan Dashboard)
        if (!window.location.hash) {
            showSection('dashboard');
        }
    });

    // ==========================================
    // 2. NAVİGASYON (SEKME GEÇİŞLERİ)
    // ==========================================
    window.showSection = (sectionId) => {
        // Tüm sekmeleri gizle
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none'; 
        });

        // Menüdeki aktifliği temizle
        document.querySelectorAll('.admin-menu li').forEach(item => {
            item.classList.remove('active');
        });

        // Hedef sekmeyi göster
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            setTimeout(() => targetSection.style.opacity = 1, 10);
        }

        // Menüyü aktif yap
        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            const onClickAttr = item.getAttribute('onclick');
            if(onClickAttr && onClickAttr.includes(sectionId)) {
                item.classList.add('active');
            }
        });

        // Verileri Tazele (Diğer dosyalardaki fonksiyonları tetikle)
        if (sectionId === 'posts' && typeof fetchPosts === 'function') fetchPosts();
        if (sectionId === 'tools-manager' && typeof fetchTools === 'function') fetchTools();
        if (sectionId === 'pages-manager' && typeof fetchPages === 'function') fetchPages();
        if (sectionId === 'dashboard') loadDashboardStats();
    };

    // ==========================================
    // 3. DASHBOARD İSTATİSTİKLERİ
    // ==========================================
    async function loadDashboardStats() {
        const postCountEl = document.getElementById('total-posts-count');
        const catCountEl = document.getElementById('total-cats-count');

        if(!postCountEl) return;

        postCountEl.innerText = "...";
        if(catCountEl) catCountEl.innerText = "...";
        
        try {
            const res = await fetch(`${API_URL}?type=posts`);
            const data = await res.json();
            
            const posts = data.posts || (data.ok ? data.posts : []);

            if (posts) {
                postCountEl.innerText = posts.length;
                const categories = new Set();
                posts.forEach(p => { if(p.kategori) categories.add(p.kategori); });
                if(catCountEl) catCountEl.innerText = categories.size;
            } else {
                postCountEl.innerText = "0";
            }
        } catch (error) {
            console.error("Dashboard Error:", error);
            postCountEl.innerText = "-";
        }
    }

    // ==========================================
    // 4. ÇIKIŞ VE PROFİL
    // ==========================================
    window.toggleProfileMenu = () => {
        document.getElementById('profile-dropdown')?.classList.toggle('show');
    };

    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        if (trigger && dropdown && !trigger.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    window.logout = () => {
        if(confirm("Çıkış yapmak istiyor musunuz?")) {
            localStorage.removeItem('isAdmin');
            window.location.href = 'login.html';
        }
    };

    // ==========================================
    // 5. GLOBAL HELPER (CORE)
    // ==========================================
    window.AdminCore = {
        readArrayLS: (k) => { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch(e){ return []; } },
        writeLS: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    };

})();
