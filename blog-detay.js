document.addEventListener('DOMContentLoaded', () => {
    
    // YENİ API LİNKİ
const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";


    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    const titleEl = document.getElementById('detail-title');
    const dateEl = document.getElementById('detail-date');
    const catEl = document.getElementById('detail-category');
    const contentEl = document.getElementById('detail-content');
    const imgEl = document.getElementById('detail-img');

    async function fetchPostDetail() {
        if (!targetId) { show404(); return; }
        if(titleEl) titleEl.textContent = "Yükleniyor...";

        try {
            // ?type=posts ile sadece yazıları çekiyoruz
            const response = await fetch(`${API_URL}?type=posts`);
            const data = await response.json();
            
            const posts = Array.isArray(data) ? data : (data.posts || []);

            // ID'si eşleşen yazıyı bul
            const post = posts.find(p => String(p.id) === String(targetId));

            if (post) {
                renderPost(post);
            } else {
                show404();
            }
        } catch (error) {
            console.error(error);
            show404();
        }
    }

    function renderPost(post) {
        document.title = `${post.baslik} | A. Cihan`;
        if (titleEl) titleEl.textContent = post.baslik;
        if (dateEl) dateEl.textContent = post.tarih || '';
        if (catEl) catEl.textContent = post.kategori || 'Genel';

        if (imgEl) {
            if (post.resim && post.resim.startsWith('http')) {
                imgEl.src = post.resim;
                imgEl.style.display = 'block';
                // İkonu gizle
                const iconPlace = document.querySelector('.cover-placeholder');
                if(iconPlace) iconPlace.style.display = 'none';
            } else {
                imgEl.style.display = 'none';
            }
        }

        if (contentEl) contentEl.innerHTML = post.icerik; 
    }

    function show404() {
        if(titleEl) titleEl.textContent = "Yazı Bulunamadı";
        if(contentEl) contentEl.innerHTML = "<p style='text-align:center;'>Aradığınız içerik mevcut değil veya silinmiş.</p>";
    }

    fetchPostDetail();
});




