document.addEventListener('DOMContentLoaded', () => {
    
    // ✅ GÜNCEL API LİNKİ
    const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec"; 

    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    const titleEl = document.getElementById('detail-title');
    const dateEl = document.getElementById('detail-date');
    const catEl = document.getElementById('detail-category');
    const contentEl = document.getElementById('detail-content');
    const imgEl = document.getElementById('detail-img');

    // --- VERİ ÇEKME ---
    async function fetchPostDetail() {
        if (!targetId) { show404(); return; }
        
        if(titleEl) titleEl.textContent = "Yükleniyor...";

        try {
            // Tüm postları çekip ID eşleşmesi yapıyoruz
            const response = await fetch(`${API_URL}?type=posts`);
            const data = await response.json();
            const posts = data.posts || (data.ok ? data.posts : []);

            // ID'si eşleşen yazıyı bul
            const post = posts.find(p => String(p.id) === String(targetId));

            if (post) {
                renderPost(post);
            } else {
                show404();
            }
        } catch (error) {
            console.error("Detay hatası:", error);
            show404();
        }
    }

    // --- İÇERİĞİ DOLDURMA ---
    function renderPost(post) {
        // 1. Başlık ve Meta
        document.title = `${post.baslik} | Blog`;
        if (titleEl) titleEl.textContent = post.baslik;
        if (catEl) catEl.textContent = post.kategori || 'Genel';
        
        // 2. Tarih Formatlama (Türkçe)
        if (dateEl) {
            const rawDate = post.tarih;
            if (rawDate) {
                const dateObj = new Date(rawDate);
                dateEl.textContent = dateObj.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                dateEl.textContent = '';
            }
        }

        // 3. Kapak Görseli Yönetimi
        if (imgEl) {
            // Eğer resim alanı doluysa VE bir URL ise (http ile başlıyorsa) göster
            if (post.resim && post.resim.startsWith('http')) {
                imgEl.src = post.resim;
                imgEl.style.display = 'block';
                // Varsa placeholder'ı gizle
                document.querySelector('.cover-placeholder')?.style.setProperty('display', 'none');
            } else {
                // Resim yoksa veya ikon kodu girildiyse (fa-brands...) büyük resmi gizle
                imgEl.style.display = 'none';
            }
        }

        // 4. İçerik (HTML olarak bas)
        if (contentEl) contentEl.innerHTML = post.icerik; 
        
        // Code highlight varsa (Quill genelde pre/code kullanır)
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }
    }

    // --- HATA DURUMU ---
    function show404() {
        document.title = "Sayfa Bulunamadı";
        if(titleEl) titleEl.textContent = "Yazı Bulunamadı";
        if(dateEl) dateEl.textContent = "";
        if(catEl) catEl.textContent = "";
        if(imgEl) imgEl.style.display = 'none';
        
        if(contentEl) {
            contentEl.innerHTML = `
                <div style="text-align:center; padding:50px 0;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#ef4444; margin-bottom:20px;"></i>
                    <p>Aradığınız içerik silinmiş veya taşınmış olabilir.</p>
                    <a href="index.html" class="btn-read-modern" style="margin-top:20px; display:inline-block;">Ana Sayfaya Dön</a>
                </div>
            `;
        }
    }

    // Başlat
    fetchPostDetail();
});
