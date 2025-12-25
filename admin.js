/* ============================================================
   ADMIN CORE - YÖNETİM PANELİ ÇEKİRDEK DOSYASI (V-FINAL)
   ============================================================ */

(function () {
    // ✅ GÜNCEL API LİNKİ (Diğer dosyalarla aynı olmalı)
    const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

    // ==========================================
    // 1. GÜVENLİK VE BAŞLANGIÇ
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        
        // A) Giriş Kontrolü
        // LocalStorage'da 'isAdmin' anahtarı yoksa Login'e atar
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            window.location.href = 'login.html';
            return;
        }

        // B) Kullanıcı Adı Gösterimi
        const adminName = localStorage.getItem('adminName') || 'Yönetici';
        const profileNameEl = document.querySelector('.user-info span');
        if(profileNameEl) profileNameEl.innerText = adminName;

        // C) Dashboard İstatistiklerini Yükle
        loadDashboardStats();

        // D) Menü Yönetimi (Varsayılan olarak Dashboard açılır)
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

        // Hedef sekmeyi bul ve göster
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            // Ufak bir animasyon efekti için
            setTimeout(() => targetSection.style.opacity = 1, 10);
        }

        // Menüyü aktif yap
        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            // onclick="showSection('posts')" gibi eşleşmeyi kontrol et
            const onClickAttr = item.getAttribute('onclick');
            if(onClickAttr && onClickAttr.includes(sectionId)) {
                item.classList.add('active');
            }
        });

        // İlgili sekme açıldığında verileri tazele (Refresh)
        if (sectionId === 'posts' && typeof fetchPosts === 'function') fetchPosts();
        if (sectionId === 'tools-manager' && typeof fetchTools === 'function') fetchTools();
        if (sectionId === 'pages-manager' && typeof fetchPages === 'function') fetchPages();
        if (sectionId === 'dashboard') loadDashboardStats();
    };

    // ==========================================
    // 3. DASHBOARD İSTATİSTİKLERİ (API TABANLI)
    // ==========================================
    async function loadDashboardStats() {
        const postCountEl = document.getElementById('total-posts-count');
        const catCountEl = document.getElementById('total-cats-count');

        // Elementler yoksa dur
        if(!postCountEl) return;

        postCountEl.innerText = "...";
        if(catCountEl) catCountEl.innerText = "...";
        
        try {
            // Sadece 'posts' verisini çekerek sayıları hesapla
            const res = await fetch(`${API_URL}?type=posts`);
            const data = await res.json();
            
            const posts = data.posts || [];

            if (posts) {
                // Toplam Yazı
                postCountEl.innerText = posts.length;
                
                // Benzersiz Kategorileri Say
                const categories = new Set();
                posts.forEach(p => { 
                    if(p.kategori) categories.add(p.kategori); 
                });
                if(catCountEl) catCountEl.innerText = categories.size;
            } else {
                postCountEl.innerText = "0";
            }
        } catch (error) {
            console.error("Dashboard Error:", error);
            postCountEl.innerText = "-";
            if(catCountEl) catCountEl.innerText = "-";
        }
    }

    // ==========================================
    // 4. ÇIKIŞ VE PROFİL MENÜSÜ
    // ==========================================
    window.toggleProfileMenu = () => {
        document.getElementById('profile-dropdown')?.classList.toggle('show');
    };

    // Menü dışına tıklanırsa kapat
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
    // 5. GLOBAL YARDIMCILAR
    // ==========================================
    // Şifre değiştirme fonksiyonu (Ayarlar sekmesi için)
    window.changePassword = () => {
        const oldUser = document.getElementById('cp-username').value;
        const oldPass = document.getElementById('cp-old').value;
        const newUser = document.getElementById('cp-new-user').value;
        const newPass = document.getElementById('cp-new').value;

        // Mevcut bilgileri kontrol et
        const storedUser = localStorage.getItem('adminUser') || 'admin';
        const storedPass = localStorage.getItem('adminPass') || '1234';

        if(oldUser !== storedUser || oldPass !== storedPass) {
            alert("Mevcut kullanıcı adı veya şifre hatalı!");
            return;
        }

        if(newPass.length < 4) {
            alert("Yeni şifre çok kısa.");
            return;
        }

        // Yeni bilgileri kaydet
        if(newUser) localStorage.setItem('adminUser', newUser);
        localStorage.setItem('adminPass', newPass);

        alert("Bilgiler güncellendi! Lütfen tekrar giriş yapın.");
        logout(); // Çıkış yaptır
    };

})();
