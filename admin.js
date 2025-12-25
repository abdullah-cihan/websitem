/* ============================================================
   ADMIN CORE - YÖNETİM PANELİ ÇEKİRDEK DOSYASI (V-FINAL)
   ============================================================ */
(function () {
    // ✅ URL'İ BURADA GLOBAL OLARAK TANIMLIYORUZ
    // Diğer dosyalar buradan okuyacak.
    window.API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";

    document.addEventListener('DOMContentLoaded', () => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') { window.location.href = 'login.html'; return; }

        const adminName = localStorage.getItem('adminName') || 'Yönetici';
        const profileNameEl = document.querySelector('.user-info span');
        if(profileNameEl) profileNameEl.innerText = adminName;

        loadDashboardStats();
        if (!window.location.hash) showSection('dashboard');
    });

    window.showSection = (sectionId) => {
        document.querySelectorAll('.admin-section').forEach(sec => { sec.classList.remove('active'); sec.style.display = 'none'; });
        document.querySelectorAll('.admin-menu li').forEach(item => { item.classList.remove('active'); });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            setTimeout(() => targetSection.style.opacity = 1, 10);
        }
        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            const onClickAttr = item.getAttribute('onclick');
            if(onClickAttr && onClickAttr.includes(sectionId)) item.classList.add('active');
        });

        // Diğer dosyalardaki fonksiyonları tetikle
        if (sectionId === 'posts' && typeof fetchPosts === 'function') fetchPosts();
        if (sectionId === 'tools-manager' && typeof fetchTools === 'function') fetchTools();
        if (sectionId === 'pages-manager' && typeof fetchPages === 'function') fetchPages();
        if (sectionId === 'dashboard') loadDashboardStats();
    };

    async function loadDashboardStats() {
        const postCountEl = document.getElementById('total-posts-count');
        const catCountEl = document.getElementById('total-cats-count');
        if(!postCountEl) return;
        postCountEl.innerText = "...";
        if(catCountEl) catCountEl.innerText = "...";
        
        try {
            // window.API_URL kullanıyoruz
            const res = await fetch(`${window.API_URL}?type=posts`);
            const data = await res.json();
            const posts = data.posts || [];
            if (posts) {
                postCountEl.innerText = posts.length;
                const categories = new Set();
                posts.forEach(p => { if(p.kategori) categories.add(p.kategori); });
                if(catCountEl) catCountEl.innerText = categories.size;
            } else { postCountEl.innerText = "0"; }
        } catch (error) {
            console.error("Dashboard Error:", error);
            postCountEl.innerText = "-";
        }
    }

    window.toggleProfileMenu = () => { document.getElementById('profile-dropdown')?.classList.toggle('show'); };
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        if (trigger && dropdown && !trigger.contains(e.target)) dropdown.classList.remove('show');
    });
    window.logout = () => { if(confirm("Çıkış yapmak istiyor musunuz?")) { localStorage.removeItem('isAdmin'); window.location.href = 'login.html'; } };

    window.changePassword = () => {
        const oldUser = document.getElementById('cp-username').value;
        const oldPass = document.getElementById('cp-old').value;
        const newUser = document.getElementById('cp-new-user').value;
        const newPass = document.getElementById('cp-new').value;
        const storedUser = localStorage.getItem('adminUser') || 'admin';
        const storedPass = localStorage.getItem('adminPass') || '1234';

        if(oldUser !== storedUser || oldPass !== storedPass) { alert("Mevcut kullanıcı adı veya şifre hatalı!"); return; }
        if(newPass.length < 4) { alert("Yeni şifre çok kısa."); return; }
        if(newUser) localStorage.setItem('adminUser', newUser);
        localStorage.setItem('adminPass', newPass);
        alert("Bilgiler güncellendi! Lütfen tekrar giriş yapın.");
        logout();
    };
})();
