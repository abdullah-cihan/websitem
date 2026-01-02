/* ============================================================
   ADMIN CORE - YÖNETİM PANELİ ÇEKİRDEK (MODERN & DARK)
   ============================================================ */
(function () {
    // API Ayarları
    window.API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
    window.API_KEY = "Sifre2025"; 

    // --- 1. YARDIMCI FONKSİYONLAR ---

    // Okuma Süresi Hesaplama
    window.calculateReadingTime = (htmlContent) => {
        if (!htmlContent) return 1;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);
        return readingTime > 0 ? readingTime : 1;
    };

    // Tarih Formatlama
    window.formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // --- 2. BAŞLANGIÇ İŞLEMLERİ ---
    document.addEventListener('DOMContentLoaded', () => {
        // Yetki Kontrolü
        if (localStorage.getItem('isAdmin') !== 'true') { 
            window.location.href = 'login.html'; 
            return; 
        }

        // KULLANICI ADI YÖNETİMİ (İstek üzerine)
        // Login sırasında kaydedilen ismi alıyoruz, yoksa 'Yönetici' varsayıyoruz.
        // localStorage'da tutarlılık sağlamak için hem 'adminName' hem 'adminUser' kontrol ediliyor.
        const adminName = localStorage.getItem('adminName') || localStorage.getItem('adminUser') || 'Yönetici';
        
        // Header'daki isim alanını güncelle
        const displayNameEl = document.getElementById('display-name');
        if(displayNameEl) displayNameEl.innerText = adminName;

        // Avatar'ı güncelle (Opsiyonel: Adının baş harflerine göre)
        const avatarEl = document.getElementById('user-avatar');
        if(avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=3b82f6&color=fff&bold=true`;
        }

        // İstatistikleri Yükle
        loadDashboardStats();

        // URL Hash kontrolü (Sayfa yenilendiğinde doğru sekme açılsın)
        const initialSection = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        showSection(initialSection);
    });

    // --- 3. SEKME YÖNETİMİ ---
    window.showSection = (sectionId) => {
        // Sekmeleri Gizle
        document.querySelectorAll('.admin-section').forEach(sec => { 
            sec.classList.remove('active'); 
        });
        
        // Menü Aktifliği
        document.querySelectorAll('.admin-menu li').forEach(item => { item.classList.remove('active'); });

        // Hedef Sekmeyi Göster
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            if(history.pushState) history.pushState(null, null, `#${sectionId}`);
        }
        
        // Menüde İlgili Butonu Aktif Yap
        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            const onClickAttr = item.getAttribute('onclick');
            if(onClickAttr && onClickAttr.includes(`'${sectionId}'`)) {
                item.classList.add('active');
            }
        });

        // Veri Yükleme Tetikleyicileri
        if (sectionId === 'posts' && typeof window.fetchPosts === 'function') window.fetchPosts();
        if (sectionId === 'tools-manager' && typeof window.fetchTools === 'function') window.fetchTools();
        if (sectionId === 'pages-manager' && typeof window.fetchPages === 'function') window.fetchPages();
        if (sectionId === 'dashboard') loadDashboardStats();
    };

    // --- 4. DASHBOARD VERİLERİ ---
    async function loadDashboardStats() {
        const postCountEl = document.getElementById('total-posts-count');
        const catCountEl = document.getElementById('total-cats-count');
        
        if(postCountEl) postCountEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:1rem"></i>';
        
        try {
            const res = await fetch(`${window.API_URL}?type=posts`);
            if (!res.ok) throw new Error("API Hatası");
            
            const data = await res.json();
            const posts = data.posts || [];
            
            if (postCountEl) postCountEl.innerText = posts.length;
            
            // Kategori Sayısı
            const categories = new Set();
            posts.forEach(p => { if(p.kategori) categories.add(p.kategori); });
            if(catCountEl) catCountEl.innerText = categories.size;

        } catch (error) {
            console.error("Dashboard Error:", error);
            if(postCountEl) postCountEl.innerText = "-";
        }
    }

    // --- 5. MENÜ VE ÇIKIŞ ---
    window.toggleProfileMenu = () => { 
        document.getElementById('profile-dropdown')?.classList.toggle('show'); 
    };

    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        if (trigger && dropdown && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    window.logout = () => { 
        if(confirm("Güvenli çıkış yapmak üzeresiniz?")) { 
            localStorage.removeItem('isAdmin'); 
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminUser');
            window.location.href = 'login.html'; 
        } 
    };

    // --- 6. KATEGORİ EKLEME ---
    window.addNewCategory = async () => {
        const catName = prompt("Yeni kategori adı:");
        if (!catName || catName.trim() === "") return;

        const btn = document.getElementById('add-cat-btn'); 
        const originalContent = btn ? btn.innerHTML : "";
        if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

        try {
            const response = await fetch(window.API_URL, {
                method: "POST",
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    auth: window.API_KEY,
                    action: "add_category",
                    category_name: catName.trim()
                })
            });

            const result = await response.json();
            if (result.success || result.status === 'success') {
                alert(`✅ "${catName}" kategorisi eklendi.`);
                loadDashboardStats();
            } else {
                alert("İşlem sunucuya iletildi.");
            }
        } catch (error) {
            alert("Hata: " + error.message);
        } finally {
            if(btn) { btn.disabled = false; btn.innerHTML = originalContent; }
        }
    };

    // --- 7. BİLGİ GÜNCELLEME ---
    window.updateAdminCredentials = async () => {
        const oldUser = document.getElementById('old-user').value;
        const oldPass = document.getElementById('old-pass').value;
        const newUser = document.getElementById('new-user').value;
        const newPass = document.getElementById('new-pass').value;
        
        const btn = document.querySelector('#settings-section .btn-primary');

        if(!oldUser || !oldPass || !newUser || !newPass) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        const originalText = btn ? btn.innerHTML : "Güncelle";
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
            btn.disabled = true;
        }

        try {
            const response = await fetch(window.API_URL, {
                method: "POST",
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    auth: window.API_KEY,
                    action: "update_admin",
                    old_user: oldUser,
                    old_pass: oldPass,
                    new_user: newUser,
                    new_pass: newPass
                })
            });

            if(!response.ok) throw new Error("Sunucu hatası");
            
            const result = await response.json();

            if (result.success || result.status === 'success') {
                alert("✅ Bilgiler başarıyla güncellendi! Lütfen yeni bilgilerle tekrar giriş yapın.");
                
                // Yeni kullanıcı adını kaydet (Gelecek loginler için)
                localStorage.setItem('adminName', newUser);
                
                // Formu temizle ve çıkış yap
                document.getElementById('old-user').value = "";
                logout();
            } else {
                throw new Error(result.message || "Eski bilgiler hatalı olabilir.");
            }

        } catch (error) {
            alert("İşlem Başarısız: " + error.message);
        } finally {
            if(btn) { btn.innerHTML = originalText; btn.disabled = false; }
        }
    };
})();
