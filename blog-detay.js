document.addEventListener('DOMContentLoaded', () => {
    
    // ============================
    // 0) AYARLAR (API LINKI)
    // ============================
    // Script.js'de kullandığınız aynı linki buraya yapıştırın:
    const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/exec"; 

    // ============================
    // 1) URL'den ID'yi Al
    // ============================
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    // DOM Elementleri
    const titleEl = document.getElementById('detail-title');
    const dateEl = document.getElementById('detail-date');
    const catEl = document.getElementById('detail-category');
    const contentEl = document.getElementById('detail-content');
    const imgEl = document.getElementById('detail-img');
    const containerEl = document.querySelector('.container'); // Yükleniyor/Hata göstermek için

    // ============================
    // 2) Veriyi Çek ve İşle
    // ============================
    async function fetchPostDetail() {
        if (!targetId) {
            show404();
            return;
        }

        // Yükleniyor efekti
        if(titleEl) titleEl.textContent = "Yükleniyor...";

        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            // ID'si eşleşen yazıyı bul (ID'ler string veya number olabilir, o yüzden toString yapıyoruz)
            const post = data.find(p => p.id.toString() === targetId.toString());

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

    // ============================
    // 3) Ekrana Yazdırma (Render)
    // ============================
    function renderPost(post) {
        // Başlık
        document.title = `${post.baslik} | Abdullah Cihan`;
        if (titleEl) titleEl.textContent = post.baslik;

        // Tarih
        if (dateEl) dateEl.textContent = post.tarih || '';

        // Kategori
        if (catEl) {
            catEl.textContent = post.kategori || 'Genel';
            // Renk ayarı
            const c = (post.kategori || '').toLowerCase();
            if (c.includes('python') || c.includes('yazılım')) catEl.className = 'category cat-blue';
            else if (c.includes('felsefe')) catEl.className = 'category cat-purple';
            else if (c.includes('teknoloji')) catEl.className = 'category cat-green';
            else catEl.className = 'category cat-red';
        }

        // Resim (Varsa göster, yoksa gizle)
        if (imgEl) {
            if (post.resim && post.resim.length > 10) {
                imgEl.src = post.resim;
                imgEl.style.display = 'block';
            } else {
                imgEl.style.display = 'none';
            }
        }

        // İçerik (HTML sanitize ederek)
        if (contentEl) {
            // Google Sheet'ten gelen içerik HTML formatındadır.
            // XSS riskine karşı basit bir temizleme veya direkt basma tercihi:
            // Quill editör güvenli HTML üretir ama yine de dikkatli olmak lazım.
            // Burada basitçe içeriği basıyoruz, eğer sanitizeHtml fonksiyonunu kullanmak isterseniz aşağıda helper var.
            contentEl.innerHTML = post.icerik; 
        }

        // Paylaşım Butonlarını Güncelle (Başlık yüklendikten sonra)
        updateShareLinks(post.baslik);
    }

    // ============================
    // 4) Hata / Bulunamadı Ekranı
    // ============================
    function show404() {
        document.title = "Yazı Bulunamadı";
        const articleBody = document.getElementById('article-body-section') || document.body;
        
        articleBody.innerHTML = `
        <div class="container" style="display:flex; justify-content:center; align-items:center; min-height:400px;">
          <div class="glass" style="text-align:center; padding:50px; border-radius:20px; max-width:600px; width:100%;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 5rem; color: #ef4444; margin-bottom: 25px;"></i>
            <h2 style="font-size: 2rem; margin-bottom: 15px; color: white; font-family: 'Space Grotesk';">
              Yazı Bulunamadı
            </h2>
            <p style="color: #94a3b8; margin-bottom: 30px; font-size: 1.1rem;">
              Aradığınız yazı mevcut değil, silinmiş veya ID hatalı olabilir.
            </p>
            <a href="index.html#blog" class="btn-read-more" style="display:inline-flex; justify-content:center; padding: 12px 30px; text-decoration:none; color:white; background:#3b82f6; border-radius:8px;">
              <i class="fa-solid fa-arrow-left" style="margin-right: 10px;"></i> Blog'a Dön
            </a>
          </div>
        </div>
        `;
    }

    // ============================
    // 5) Paylaşım Linkleri
    // ============================
    function updateShareLinks(title) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(title || document.title);

        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');

        if (xBtn) xBtn.href = `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`;
        if (liBtn) liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
        if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${pageTitle}%20-%20${pageUrl}`;
    }

    // Kopyala Butonu
    const copyBtn = document.getElementById('share-copy');
    const toast = document.getElementById('share-toast');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('✅ Link kopyalandı!');
            } catch {
                const ta = document.createElement('textarea');
                ta.value = window.location.href;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showToast('✅ Link kopyalandı!');
            }
        });
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // ============================
    // 6) Scroll Progress Bar
    // ============================
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = scrolled + "%";
    });

    // --- BAŞLAT ---
    fetchPostDetail();

});
