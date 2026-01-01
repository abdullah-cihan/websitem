document.addEventListener('DOMContentLoaded', async () => {
    // ======================================================
    // 1. AYARLAR VE ELEMENT SEÇİMLERİ
    // ======================================================
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 
    
    // HTML'deki ID'lerle birebir eşleşen elementler
    const elements = {
        title: document.getElementById('detail-title'),           // Başlık
        date: document.getElementById('detail-date'),             // Tarih
        category: document.getElementById('detail-category'),     // Kategori Etiketi
        content: document.getElementById('detail-content'),       // Yazı İçeriği
        image: document.getElementById('detail-img'),             // Kapak Resmi
        coverLoader: document.getElementById('cover-loader'),     // Resim Yükleniyor İkonu
        headerSkeleton: document.getElementById('header-skeleton'), // Başlık Yükleniyor Efekti
        headerContent: document.getElementById('header-content'),   // Başlık Alanı
        skeletonContent: document.querySelector('.skeleton-content'), // İçerik Yükleniyor Efekti
        tagsContainer: document.getElementById('article-tags'),   // Etiketler Alanı
        readingTime: document.getElementById('reading-time'),     // Okuma Süresi
        relatedContainer: document.getElementById('related-posts-container'), // Benzer Yazılar Alanı (EN ALTTA)
        progressBar: document.getElementById('progress-bar')      // İlerleme Çubuğu
    };

    // ======================================================
    // 2. YARDIMCI FONKSİYONLAR
    // ======================================================

    /** Güvenlik: HTML içeriğini temizler (XSS Koruması) */
    function sanitizeHtml(dirtyHtml) {
        const html = String(dirtyHtml || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Yasaklı etiketleri ve tehlikeli nitelikleri temizle
        const badTags = ['script', 'style', 'iframe', 'object', 'embed', 'form'];
        badTags.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));
        
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

    /** Okuma süresini hesaplar */
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; 
        const textLength = text.split(/\s+/).length; 
        const minutes = Math.ceil(textLength / wordsPerMinute);
        return minutes;
    }

    /** Kategoriye göre renk sınıfı atar */
    function setCategoryColor(category) {
        if (!elements.category) return;
        elements.category.textContent = category;
        
        const catLower = String(category).toLowerCase();
        let colorClass = 'cat-default'; 
        
        if (['python', 'yazılım', 'kodlama'].some(k => catLower.includes(k))) colorClass = 'cat-blue';
        else if (['tasarım', 'sanat', 'felsefe'].some(k => catLower.includes(k))) colorClass = 'cat-purple';
        else if (['teknoloji', 'yapay zeka', 'kariyer'].some(k => catLower.includes(k))) colorClass = 'cat-green';
        else if (['video', 'youtube'].some(k => catLower.includes(k))) colorClass = 'cat-red';
        
        elements.category.className = `category ${colorClass}`;
    }

    /** Toast Bildirimi (Kopyalandı mesajı) */
    function showToast(message) {
        const toast = document.getElementById('share-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ======================================================
    // 3. META TAGLARI & PAYLAŞIM BUTONLARI (Alt Kısım)
    // ======================================================

    function updateMetaTags(post) {
        document.title = `${post.baslik} | Abdullah Cihan`;
        
        const pageUrl = window.location.href;
        const imageUrl = (post.resim && post.resim.startsWith('http')) ? post.resim : 'assets/default-cover.jpg';
        const summary = post.ozet || post.icerik.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

        // Helper: Meta tag oluştur/güncelle
        const setMeta = (attrName, attrValue, content) => {
            let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attrName, attrValue);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Open Graph & Twitter
        setMeta('property', 'og:title', post.baslik);
        setMeta('property', 'og:description', summary);
        setMeta('property', 'og:image', imageUrl);
        setMeta('property', 'og:url', pageUrl);
        setMeta('name', 'twitter:title', post.baslik);
        setMeta('name', 'twitter:image', imageUrl);
    }

    function setupShareButtons(post) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(post.baslik);
        
        // Linkleri Hazırla
        const links = {
            x: `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
            whatsapp: `https://api.whatsapp.com/send?text=${pageTitle}%0A%0A${pageUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`
        };

        // HTML'deki butonları seç
        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');
        const fbBtn = document.getElementById('share-facebook');
        const copyBtn = document.getElementById('share-copy');

        // Linkleri Ata
        if (xBtn) xBtn.href = links.x;
        if (liBtn) liBtn.href = links.linkedin;
        if (waBtn) waBtn.href = links.whatsapp;
        if (fbBtn) fbBtn.href = links.facebook;

        // Kopyala Butonu Olayı
        if (copyBtn) {
            const newBtn = copyBtn.cloneNode(true);
            copyBtn.parentNode.replaceChild(newBtn, copyBtn);
            
            newBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('✅ Link kopyalandı!');
                } catch (err) {
                    // Eski tarayıcı desteği
                    const ta = document.createElement('textarea');
                    ta.value = window.location.href;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    showToast('✅ Link kopyalandı!');
                }
            });
        }
    }

    // ======================================================
    // 4. VERİ ÇEKME & SAYFAYI DOLDURMA
    // ======================================================

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) { 
        renderError("Parametre Hatası", "Geçerli bir yazı ID'si bulunamadı.");
        return; 
    }

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        const post = posts.find(p => String(p.id) === String(id));

        if (!post) {
            renderError("Yazı Bulunamadı", "Aradığınız içerik silinmiş olabilir.");
            return;
        }

        // --- İÇERİĞİ YERLEŞTİR ---

        // 1. Meta ve Başlık
        updateMetaTags(post);
        elements.title.textContent = post.baslik;

        // 2. Yükleniyor Ekranlarını Kapat -> İçeriği Aç
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.headerContent) elements.headerContent.style.display = 'block';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        // 3. Tarih ve Kategori
        if(elements.date) elements.date.textContent = new Date(post.tarih).toLocaleDateString('tr-TR', {year:'numeric', month:'long', day:'numeric'});
        setCategoryColor(post.kategori);

        // 4. İçerik ve Okuma Süresi
        const sanitizedContent = sanitizeHtml(post.icerik);
        if(elements.readingTime) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedContent;
            const pureText = tempDiv.textContent || "";
            elements.readingTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${calculateReadingTime(pureText)} dk okuma`;
        }
        if(elements.content) elements.content.innerHTML = sanitizedContent;

        // 5. Kapak Resmi
        if (post.resim && post.resim.startsWith('http')) {
            elements.image.src = post.resim;
            elements.image.onload = () => {
                elements.image.style.display = 'block';
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
            elements.image.onerror = () => {
                elements.image.style.display = 'none'; // Resim kırıksa gizle
            };
        } else {
            if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            if(elements.image) elements.image.style.display = 'none';
        }

        // 6. Kod Blokları & Etiketler
        if(window.hljs) hljs.highlightAll();
        if(post.etiketler && elements.tagsContainer) {
            const tags = post.etiketler.split(',').map(t => t.trim());
            elements.tagsContainer.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        }

        // 7. Paylaşım Butonları & Benzer Yazılar (Sayfanın Altı)
        setupShareButtons(post);
        renderRelatedPosts(posts, post.id, post.kategori);

    } catch (e) {
        console.error(e);
        renderError("Bağlantı Hatası", "Veriler yüklenirken bir sorun oluştu.");
    }

    // ======================================================
    // 5. SCROLL BAR
    // ======================================================
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        if (elements.progressBar) elements.progressBar.style.width = scrolled + "%";
    });

    // ======================================================
    // 6. BENZER YAZILAR FONKSİYONU (En Alt Kısım)
    // ======================================================
    function renderRelatedPosts(allPosts, currentId, currentCategory) {
        if(!elements.relatedContainer) return;

        // Mevcut yazıyı hariç tut
        let filtered = allPosts.filter(p => String(p.id) !== String(currentId));
        
        // Önce aynı kategoriyi bul
        let related = filtered.filter(p => p.kategori === currentCategory);
        
        // Yetersizse diğerlerinden ekle
        if(related.length < 3) {
            const others = filtered.filter(p => p.kategori !== currentCategory);
            related = related.concat(others);
        }

        const finalPosts = related.slice(0, 3); // İlk 3 yazı

        if(finalPosts.length === 0) {
            document.querySelector('.related-posts-section').style.display = 'none';
            return;
        }

        // Kartları HTML'e Bas
        elements.relatedContainer.innerHTML = finalPosts.map(p => `
            <a href="blog-detay.html?id=${p.id}" class="related-card glass">
                <span class="related-cat">${p.kategori || 'Genel'}</span>
                <h4 class="related-title">${p.baslik}</h4>
                <span class="related-date">${new Date(p.tarih).toLocaleDateString('tr-TR')}</span>
            </a>
        `).join('');
    }

    // ======================================================
    // 7. HATA EKRANI
    // ======================================================
    function renderError(title, message) {
        document.title = "Hata | Abdullah Cihan";
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        const container = document.querySelector('.detail-layout');
        if(container) {
            container.innerHTML = `
                <div class="error-container glass">
                    <i class="fa-solid fa-triangle-exclamation error-icon"></i>
                    <h2 style="color:#fff;">${title}</h2>
                    <p style="color:#ccc;">${message}</p>
                    <a href="index.html" class="btn-error">Ana Sayfaya Dön</a>
                </div>
            `;
            container.style.display = 'block';
        }
    }
});
