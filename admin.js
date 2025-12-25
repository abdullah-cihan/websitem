/* ADMIN CORE */
const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";

(function () {
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

        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block';
            setTimeout(() => target.style.opacity = 1, 10);
        }

        const menuItems = document.querySelectorAll('.admin-menu li');
        menuItems.forEach(item => {
            if(item.getAttribute('onclick')?.includes(sectionId)) item.classList.add('active');
        });

        if (sectionId === 'posts' && typeof fetchPosts === 'function') fetchPosts();
        if (sectionId === 'tools-manager' && typeof fetchTools === 'function') fetchTools();
        if (sectionId === 'pages-manager' && typeof fetchPages === 'function') fetchPages();
        if (sectionId === 'dashboard') loadDashboardStats();
    };

    async function loadDashboardStats() {
        const pCount = document.getElementById('total-posts-count');
        const cCount = document.getElementById('total-cats-count');
        if(!pCount) return;
        pCount.innerText = "...";
        
        try {
            const res = await fetch(`${API_URL}?type=posts`);
            const data = await res.json();
            const posts = data.posts || [];
            
            pCount.innerText = posts.length;
            const cats = new Set(posts.map(p => p.kategori).filter(Boolean));
            if(cCount) cCount.innerText = cats.size;
        } catch(e) {
            pCount.innerText = "-";
        }
    }

    window.toggleProfileMenu = () => document.getElementById('profile-dropdown')?.classList.toggle('show');
    window.logout = () => { if(confirm("Çıkış?")) { localStorage.removeItem('isAdmin'); window.location.href='login.html'; } };
    
    // Şifre değiştirme (LocalStorage)
    window.changePassword = () => {
        const u = document.getElementById('cp-username').value;
        const p = document.getElementById('cp-old').value;
        const nu = document.getElementById('cp-new-user').value;
        const np = document.getElementById('cp-new').value;
        
        const realU = localStorage.getItem('adminUser') || 'admin';
        const realP = localStorage.getItem('adminPass') || '123456';
        
        if(u !== realU || p !== realP) { alert("Eski bilgiler yanlış"); return; }
        if(np.length < 4) { alert("Şifre çok kısa"); return; }
        
        localStorage.setItem('adminUser', nu || realU);
        localStorage.setItem('adminPass', np);
        alert("Değiştirildi. Giriş yapın.");
        logout();
    };
})();
