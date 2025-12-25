document.addEventListener('DOMContentLoaded', () => {
    
    // ✅ YENİ LİNK
    const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec"; 

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
            const response = await fetch(`${API_URL}?type=posts`);
            const data = await response.json();
            const posts = data.posts || (data.ok ? data.posts : []);

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
        document.title = `${post.baslik} | Blog`;
        if (titleEl) titleEl.textContent = post.baslik;
        if (dateEl) dateEl.textContent = post.tarih || '';
        if (catEl) catEl.textContent = post.kategori || 'Genel';

        if (imgEl) {
            if (post.resim && post.resim.length > 5) {
                imgEl.src = post.resim;
                imgEl.style.display = 'block';
                document.querySelector('.cover-placeholder')?.style.setProperty('display', 'none');
            }
        }

        if (contentEl) contentEl.innerHTML = post.icerik; 
    }

    function show404() {
        if(titleEl) titleEl.textContent = "Yazı Bulunamadı";
        if(contentEl) contentEl.innerHTML = "<p style='text-align:center;'>İçerik silinmiş veya taşınmış olabilir.</p>";
    }

    fetchPostDetail();
});
