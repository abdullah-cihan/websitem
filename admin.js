const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

// Giriş Kontrolü
if (localStorage.getItem('isAdmin') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
    loadStats();
});

// Sekme Değiştirme
window.showSection = (id) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-menu li').forEach(l => l.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    // Verileri tazele
    if(id === 'posts') fetchPosts();
    if(id === 'pages-manager') fetchPages();
    if(id === 'tools-manager') fetchTools();
};

// İstatistikleri Yükle
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        if(data.posts) {
            document.getElementById('total-posts-count').innerText = data.posts.length;
        }
    } catch(e) { console.error("Stats error"); }
}

window.logout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};
