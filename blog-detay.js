document.addEventListener('DOMContentLoaded', async () => {

    // ============================
    // 1. AYARLAR VE HELPERS
    // ============================
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 

    // HTML Temizleme (Güvenlik - XSS Azaltma)
    function sanitizeHtml(dirtyHtml) {
        const html = String(dirtyHtml || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // Tehlikeli tagları sil
        const badTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
        badTags.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));

        // Tehlikeli attributeleri temizle (onclick vb.)
        doc.querySelectorAll('*').forEach(el => {
            [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = String(attr.value || '').toLowerCase();
                if (name.startsWith('on')) el.removeAttribute(attr.name);
                if ((name === 'href' || name === 'src') && (value.startsWith('javascript:') || value.startsWith('data:'))) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        return doc.body.innerHTML;
    }

    // Kategori Renklendirme Yardımcısı (GÜNCELLENDİ: Dinamik Renk Seçimi)
    function setCategoryBadge(category, catEl) {
        if (!catEl) return;
        const c = String(category || 'Genel');
        catEl.textContent = c;
        
        // Sabit tanımlar (Mevcut renkleri korumak için)
        const fixedColors = {
            'Python': 'cat-blue', 'Yazılım': 'cat-blue', 'OOP': 'cat-blue',
            'Felsefe': 'cat-purple',
            'Teknoloji': 'cat-green', 'Kariyer': 'cat-green',
            'Video': 'cat-red'
        };

        if (fixedColors[c]) {
            catEl.className = `category ${fixedColors[c]}`;
        } else {
            // Bilinmeyen kategori gelirse: İsme göre hash üretip mevcut 4 renkten birini ata.
            // Böylece "YeniKategori" her zaman aynı rengi alır ama admin panelinden eklenince kod değiştirmek gerekmez.
            const colors = ['cat-blue', 'cat-purple', 'cat-green', 'cat-red'];
            let hash = 0;
            for (let i = 0; i < c.length; i++) {
                hash += c.charCodeAt(i);
            }
            const colorIndex = hash % colors.length;
            catEl.className = `category ${colors[colorIndex]}`;
        }
    }

    // Okuma Süresi Hesaplama Yardımcısı (YENİ)
    function calculateReadingTime(htmlContent) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // Ortalama 200 kelime/dk
        return readingTime > 0 ? readingTime : 1;
    }

    // Toast Bildirim Göstericisi (Paylaşım için)
    const showShareToast = (msg) => {
        const toast = document.getElementById('share-toast');
        if (!toast) return;
        
        toast.textContent = msg;
        toast.classList.add('show');
        
        clearTimeout(window.__share_toast_t);
        window.__share_toast_t = setTimeout(() => toast.classList.remove('show'), 1600);
    };

    // ============================
    // 2. SCROLL PROGRESS BAR
    // ============================
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = scrolled + "%";
    });

    // ============================
    // 3. VERİ ÇEKME VE İŞLEME
    // ============================
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const titleEl = document.getElementById('detail-title');
    // Hata mesajı için kapsayıcı olarak detail-content'in ebeveynini veya body'i al
    const articleBodySection = document.getElementById('detail-content')?.parentElement || document.body;

    // Yükleniyor durumu
    if(titleEl) titleEl.textContent = "Yükleniyor...";

    // Eğer ID hiç yoksa direkt hata göster
    if (!id) { 
        renderNotFound("Yazı Bulunamadı", "Geçersiz parametre.");
        return; 
    }

    try {
        // --- GOOGLE SHEETS VERİ TABANI BAĞLANTISI ---
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        // ID eşleşmesi (Hem number hem string uyumu için String() kullanıldı)
        const post = posts.find(p => String(p.id) === String(id));

        if (!post) {
            renderNotFound("Yazı Bulunamadı", "Aradığınız içerik silinmiş veya yayından kaldırılmış olabilir.");
            return;
        }

        // --- VERİYİ DOLDUR (RENDER) ---
        
        // 1. Başlık ve Meta
        document.title = post.baslik;
        if(titleEl) titleEl.textContent = post.baslik;
        
        // 2. Kategori (Renkli Badge ile - Dinamik)
        const catEl = document.getElementById('detail-category');
        setCategoryBadge(post.kategori, catEl);

        // 3. Tarih
        const dateEl = document.getElementById('detail-date');
        if(dateEl) {
            dateEl.textContent = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR', {year:'numeric', month:'long', day:'numeric'}) : '';
        }

        // 3.1. Okuma Süresi (YENİ: Otomatik Hesaplama ve Ekleme)
        const metaContainer = document.querySelector('.article-meta');
        if (metaContainer && post.icerik) {
            const readingTime = calculateReadingTime(post.icerik);
            
            // Mevcut tarih elementinin yanına ekle
            const timeSpan = document.createElement('span');
            timeSpan.className = 'date'; // Mevcut tarih stilini kullan (uyumlu görünmesi için)
            timeSpan.innerHTML = `<i class="fa-regular fa-clock"></i> ${readingTime} dk okuma`;
            timeSpan.style.marginLeft = '15px'; // Tarih ile arasına boşluk
            
            metaContainer.appendChild(timeSpan);
        }

        // 4. İçerik (XSS Korumalı)
        const contentEl = document.getElementById('detail-content');
        if(contentEl) {
            contentEl.innerHTML = sanitizeHtml(post.icerik);
        }

        // 5. Görsel Yönetimi (URL ise resim, değilse ikon)
        const imgEl = document.getElementById('detail-img');
        const iconContainer = document.querySelector('.cover-placeholder');
        
        if (post.resim && post.resim.startsWith('http')) {
            // Resim varsa
            if(imgEl) {
                imgEl.src = post.resim;
                imgEl.style.display = 'block';
            }
            if(iconContainer) iconContainer.style.display = 'none';
        } else {
            // Resim yoksa ikon göster
            if(imgEl) imgEl.style.display = 'none';
            if(iconContainer) {
                iconContainer.style.display = 'flex';
                // Google sheets'den gelen ikon sınıfı veya varsayılan
                const iconClass = post.resim || 'fa-solid fa-pen';
                iconContainer.innerHTML = `<i class="${iconClass}" style="font-size:4rem; color:#3b82f6;"></i>`;
            }
        }
        
        // 6. Code Highlight (Eğer varsa - opsiyonel kütüphane)
        if(window.hljs) hljs.highlightAll();

        // 7. Paylaşım Butonlarını Güncelle (Veri geldikten sonra başlık değiştiği için)
        setupShareButtons(post.baslik);

    } catch (e) {
        console.error(e);
        renderNotFound("Hata Oluştu", "Veriler yüklenirken bir sorun oluştu. Lütfen bağlantınızı kontrol edin.");
    }

    // ============================
    // 4. FONKSİYONLAR (UI)
    // ============================

    // Paylaşım butonlarını ayarlayan fonksiyon
    function setupShareButtons(title) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(title || document.title);

        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');
        const copyBtn = document.getElementById('share-copy');

        if (xBtn) xBtn.href = `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`;
        if (liBtn) liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
        if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${pageTitle}%20-%20${pageUrl}`;

        if (copyBtn) {
            // Olası eski event listener'ları temizlemek için clone
            const newCopyBtn = copyBtn.cloneNode(true);
            copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
            
            newCopyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showShareToast('✅ Link kopyalandı!');
                } catch {
                    // Fallback (eski tarayıcılar için)
                    const ta = document.createElement('textarea');
                    ta.value = window.location.href;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                    showShareToast('✅ Link kopyalandı!');
                }
            });
        }
    }

    // Gelişmiş 404 Ekranı
    function renderNotFound(title, message) {
        document.title = "Yazı Bulunamadı";
        
        // Başlık elementlerini gizle
        if(titleEl) titleEl.style.display = 'none';
        
        const dateEl = document.getElementById('detail-date');
        const catEl = document.getElementById('detail-category');
        if(dateEl) dateEl.style.display = 'none';
        if(catEl) catEl.style.display = 'none';
        
        // Hata kartını bas
        // detail-content varsa onun parent'ına (article-content), yoksa body'e bas
        const container = document.getElementById('detail-content') ? document.getElementById('detail-content').parentElement : document.body;
        
        container.innerHTML = `
            <div class="container" style="display:flex; justify-content:center; align-items:center; min-height:400px; padding:20px;">
              <div class="glass" style="text-align:center; padding:50px; border-radius:20px; max-width:600px; width:100%; background:rgba(255,255,255,0.05); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 5rem; color: #ef4444; margin-bottom: 25px;"></i>
                <h2 style="font-size: 2rem; margin-bottom: 15px; color: #fff; font-family: 'Space Grotesk', sans-serif;">
                  ${title}
                </h2>
                <p style="color: #ccc; margin-bottom: 30px; font-size: 1.1rem;">
                  ${message}
                </p>
                <a href="index.html" class="btn-read-modern" style="display:inline-flex; align-items:center; justify-content:center; padding: 12px 30px; text-decoration:none; background:#3b82f6; color:white; border-radius:8px;">
                  <i class="fa-solid fa-arrow-left" style="margin-right: 10px;"></i> Ana Sayfaya Dön
                </a>
              </div>
            </div>
        `;
    }
});
