/* ============================================================
   ADMIN CORE - YÖNETİM PANELİ ÇEKİRDEK DOSYASI (GOOGLE SHEET UYUMLU)
   ============================================================ */

(function () {
    // 👇 GÜNCEL API LİNKİNİZ (Tüm dosyalarla aynı olmalı)
    const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

    // ==========================================
    // 1. GÜVENLİK VE BAŞLANGIÇ KONTROLLERİ
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        
        // A) Giriş Kontrolü (login.js ile uyumlu)
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            window.location.href = 'login.html'; // Yetki yoksa at
            return;
        }

        // B) Kullanıcı Adını Yaz
        const adminName = localStorage.getItem('adminName') || 'Yönetici';
        const profileNameEl = document.querySelector('.user-info span');
        if(profileNameEl) profileNameEl.innerText = adminName;

        // C) Dashboard İstatistiklerini Yükle
        loadDashboardStats();

        // D) Varsayılan olarak Dashboard'ı aç
        // (Eğer URL'de hash yoksa)
        if (!window.location.hash) {
            showSection('dashboard');
        }
    });

    // ==========================================
    // 2. NAVİGASYON YÖNETİMİ (Show Section)
    // ==========================================
    window.showSection = (sectionId) => {
        // 1. Tüm sectionları gizle
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none'; 
        });

        // 2. Menüdeki aktif sınıfını temizle
        document.querySelectorAll('.admin-menu li').forEach(item => {
            item.classList.remove('active');
        });

        // 3. Seçilen section'ı göster
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            
            // Fade-in efekti
            setTimeout(() => {
                targetSection.style.opacity = 1;
            }, 10);
        }

        // 4. İlgili menü öğesini aktif yap
        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            const onClickAttr = item.getAttribute('onclick');
            if(onClickAttr && onClickAttr.includes(sectionId)) {
                item.classList.add('active');
            }
        });

        // 5. VERİLERİ TAZELE (Diğer dosyalardaki fonksiyonları tetikle)
        // Bu sayede sekmeye her tıklandığında veriler güncellenir.
        
        if (sectionId === 'posts' && typeof fetchPosts === 'function') {
            fetchPosts(); // admin-posts.js
        }
        if (sectionId === 'tools-manager' && typeof fetchTools === 'function') {
            fetchTools(); // admin-tools.js
        }
        if (sectionId === 'pages-manager' && typeof fetchPages === 'function') {
            fetchPages(); // admin-pages.js
        }
        if (sectionId === 'dashboard') {
            loadDashboardStats(); // İstatistikleri yenile
        }
    };

    // ==========================================
    // 3. DASHBOARD İSTATİSTİKLERİ (CANLI)
    // ==========================================
    async function loadDashboardStats() {
        const postCountEl = document.getElementById('total-posts-count');
        const catCountEl = document.getElementById('total-cats-count');

        if(!postCountEl) return;

        // Yükleniyor efekti
        postCountEl.innerText = "...";
        if(catCountEl) catCountEl.innerText = "...";
        
        try {
            // Google Sheet'ten verileri çek
            const res = await fetch(`${API_URL}?type=posts`);
            const data = await res.json();
            
            // Backend yapımız: { posts: [...] } veya { ok: true, posts: [...] }
            const posts = data.posts || (data.ok ? data.posts : []);

            if (posts) {
                // Toplam Yazı Sayısı
                postCountEl.innerText = posts.length;

                // Kategorileri Say (Tekrarsız)
                const categories = new Set();
                posts.forEach(p => {
                    if(p.kategori) categories.add(p.kategori);
                });
                if(catCountEl) catCountEl.innerText = categories.size;
            } else {
                postCountEl.innerText = "0";
            }

        } catch (error) {
            console.error("Dashboard Stats Error:", error);
            postCountEl.innerText = "-";
        }
    }

    // ==========================================
    // 4. PROFİL MENÜSÜ VE ÇIKIŞ
    // ==========================================
    
    // Dropdown menüyü aç/kapa
    window.toggleProfileMenu = () => {
        const dropdown = document.getElementById('profile-dropdown');
        if(dropdown) {
            dropdown.classList.toggle('show');
        }
    };

    // Sayfanın herhangi bir yerine tıklayınca menüyü kapat
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        
        if (trigger && dropdown && !trigger.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Çıkış Yapma Fonksiyonu
    window.logout = () => {
        if(confirm("Yönetim panelinden çıkış yapmak istiyor musunuz?")) {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminName');
            window.location.href = 'login.html';
        }
    };

    // ==========================================
    // 5. YARDIMCI FONKSİYONLAR (CORE)
    // ==========================================
    window.AdminCore = {
        // LocalStorage işlemleri için güvenli sarmalayıcılar
        readLS: (key) => localStorage.getItem(key),
        writeLS: (key, value) => localStorage.setItem(key, value)
    };

})();
