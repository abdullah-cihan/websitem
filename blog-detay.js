document.addEventListener('DOMContentLoaded', async () => {
    // ============================
    // 1. AYARLAR VE SABİTLER
    // ============================
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 
    
    // DOM Elementleri
    const elements = {
        title: document.getElementById('detail-title'),
        date: document.getElementById('detail-date'),
        category: document.getElementById('detail-category'),
        content: document.getElementById('detail-content'),
        image: document.getElementById('detail-img'),
        coverLoader: document.getElementById('cover-loader'), // Resim yüklenirken dönen/skeleton kısım
        headerSkeleton: document.getElementById('header-skeleton'), // Başlık yükleniyor efekti
        headerContent: document.getElementById('header-content'), // Gerçek başlık alanı
        skeletonContent: document.querySelector('.skeleton-content'), // İçerik yükleniyor efekti
        tagsContainer: document.getElementById('article-tags'),
        readingTime: document.getElementById('reading-time'),
        relatedContainer: document.getElementById('related-posts-container'),
        progressBar: document.getElementById('progress-bar')
    };

    // ============================
    // 2. YARDIMCI FONKSİYONLAR
    // ============================

    // HTML Temizleme (Güvenlik)
    function sanitizeHtml(dirtyHtml) {
        const html = String(dirtyHtml || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const badTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form'];
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

    // Okuma Süresi Hesaplama
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; // Ortalama okuma hızı
        const textLength = text.split(/\s+/).length; 
        const minutes = Math.ceil(textLength / wordsPerMinute);
        return minutes;
    }

    // Meta Etiketlerini Güncelle (SEO ve Paylaşım İçin)
    function updateMetaTags(post) {
        document.title = `${post.baslik} | Abdullah Cihan`;
        
        // Helper: Meta tag bul veya oluştur
        const setMeta = (property, content) => {
            let element = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        const pageUrl = window.location.href;
        const imageUrl = post.resim && post.resim.startsWith('http') ? post.resim : 'assets/default-cover.jpg'; // Varsayılan resim yolu
        const summary = post.ozet || post.icerik.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...';

        // Open Graph (Facebook, LinkedIn, WhatsApp)
        setMeta('og:title', post.baslik);
        setMeta('og:description', summary);
        setMeta('og:image', imageUrl);
        setMeta('og:url', pageUrl);
        setMeta('og:type', 'article');

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', post.baslik);
        setMeta('twitter:description', summary);
        setMeta('twitter:image', imageUrl);
    }

    // Kategori Rengi Ayarla
    function setCategoryColor(category) {
        if (!elements.category) return;
        elements.category.textContent = category;
        // CSS dosyasındaki sınıflara göre renk ata
        // Örnek CSS classları: .cat-blue, .cat-purple...
        let colorClass = 'cat-default';
        const catLower = String(category).toLowerCase();
        
        if (['python', 'yazılım', 'kodlama'].some(k => catLower.includes(k))) colorClass = 'cat-blue';
        else if (['tasarım', 'sanat'].some(k => catLower.includes(k))) colorClass = 'cat-purple';
        else if (['teknoloji', 'yapay zeka'].some(k => catLower.includes(k))) colorClass = 'cat-green';
        else if (['video', 'youtube'].some(k => catLower.includes(k))) colorClass = 'cat-red';
        
        elements.category.className = `category ${colorClass}`;
    }

    // ============================
    // 3. SCROLL PROGRESS BAR
    // ============================
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        if (elements.progressBar) elements.progressBar.style.width = scrolled + "%";
    });

    // ============================
    // 4. PAYLAŞIM BUTONLARI
    // ============================
    function setupShareButtons(post) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(post.baslik);
        
        // Linkleri güncelle
        const links = {
            x: `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
            whatsapp: `https://api.whatsapp.com/send?text=${pageTitle}%20-%20${pageUrl}`
        };

        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');
        const copyBtn = document.getElementById('share-copy');

        if (xBtn) xBtn.href = links.x;
        if (liBtn) liBtn.href = links.linkedin;
        if (waBtn) waBtn.href = links.whatsapp;

        // Kopyala Butonu
        if (copyBtn) {
            const newBtn = copyBtn.cloneNode(true);
            copyBtn.parentNode.replaceChild(newBtn, copyBtn);
            newBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Bağlantı kopyalandı! 🎉');
                } catch (err) {
                    showToast('Kopyalama başarısız oldu.');
                }
            });
        }
    }

    function showToast(message) {
        const toast = document.getElementById('share-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ============================
    // 5. ANA İŞLEMLER (FETCH & RENDER)
    // ============================
    
    // URL'den ID al
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
            renderError("Yazı Bulunamadı", "Aradığınız içerik silinmiş veya adresi değişmiş olabilir.");
            return;
        }

        // --- A. İÇERİĞİ DOLDUR ---
        
        // 1. Meta ve Başlık
        updateMetaTags(post); // Share preview için meta tagları güncelle
        elements.title.textContent = post.baslik;

        // 2. UI Değişimi (Skeletonları gizle, içeriği aç)
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.headerContent) elements.headerContent.style.display = 'block';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        // 3. Tarih ve Kategori
        if(elements.date) elements.date.textContent = new Date(post.tarih).toLocaleDateString('tr-TR', {year:'numeric', month:'long', day:'numeric'});
        setCategoryColor(post.kategori);

        // 4. Okuma Süresi
        const sanitizedContent = sanitizeHtml(post.icerik);
        if(elements.readingTime) {
            // HTML taglarını temizleyip sadece metin uzunluğunu al
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedContent;
            const pureText = tempDiv.textContent || tempDiv.innerText || "";
            const minutes = calculateReadingTime(pureText);
            elements.readingTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${minutes} dk okuma`;
        }

        // 5. İçeriği Yaz
        if(elements.content) elements.content.innerHTML = sanitizedContent;

        // 6. Görsel Yönetimi
        if (post.resim && post.resim.startsWith('http')) {
            elements.image.src = post.resim;
            // Resim yüklendiğinde loader'ı gizle
            elements.image.onload = () => {
                elements.image.style.display = 'block';
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
            // Resim hataya düşerse
            elements.image.onerror = () => {
                elements.image.style.display = 'none';
                if(elements.coverLoader) elements.coverLoader.innerHTML = '<i class="fa-solid fa-image" style="font-size:3rem; opacity:0.5;"></i>';
            };
        } else {
            // Resim yoksa komple gizle veya ikon göster
            if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            if(elements.image) elements.image.style.display = 'none';
        }

        // 7. Kod Bloklarını Renklendir (Highlight.js varsa)
        if(window.hljs) hljs.highlightAll();

        // 8. Etiketler (Opsiyonel - Eğer sheets'de 'etiketler' kolonu varsa)
        if(post.etiketler && elements.tagsContainer) {
            const tags = post.etiketler.split(',').map(t => t.trim());
            elements.tagsContainer.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        }

        // --- B. DİĞER FONKSİYONLARI ÇALIŞTIR ---
        setupShareButtons(post);
        renderRelatedPosts(posts, post.id, post.kategori);

    } catch (e) {
        console.error(e);
        renderError("Bağlantı Hatası", "Veriler yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.");
    }

    // ============================
    // 6. BENZER YAZILAR (RELATED POSTS)
    // ============================
    function renderRelatedPosts(allPosts, currentId, currentCategory) {
        if(!elements.relatedContainer) return;

        // Mevcut yazıyı çıkar
        let filtered = allPosts.filter(p => String(p.id) !== String(currentId));
        
        // Aynı kategoridekileri öne al, yoksa karışık getir
        let related = filtered.filter(p => p.kategori === currentCategory);
        
        // Eğer aynı kategoride yeterince yazı yoksa, diğerlerinden tamamla
        if(related.length < 3) {
            const others = filtered.filter(p => p.kategori !== currentCategory);
            related = related.concat(others);
        }

        // İlk 3 tanesini al
        const finalPosts = related.slice(0, 3);

        if(finalPosts.length === 0) {
            document.querySelector('.related-posts-section').style.display = 'none';
            return;
        }

        // HTML oluştur
        elements.relatedContainer.innerHTML = finalPosts.map(p => `
            <a href="blog-detay.html?id=${p.id}" class="related-card glass">
                <div class="related-content">
                    <span class="related-cat">${p.kategori}</span>
                    <h4 class="related-title">${p.baslik}</h4>
                    <span class="related-date">${new Date(p.tarih).toLocaleDateString('tr-TR')}</span>
                </div>
            </a>
        `).join('');
    }

    // ============================
    // 7. HATA EKRANI
    // ============================
    function renderError(title, message) {
        document.title = "Hata | Abdullah Cihan";
        // Skeletonları ve loaderları temizle
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        const container = document.querySelector('.detail-layout');
        if(container) {
            container.innerHTML = `
                <div class="error-container glass">
                    <i class="fa-solid fa-triangle-exclamation error-icon"></i>
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <a href="index.html" class="btn-error">Ana Sayfaya Dön</a>
                </div>
            `;
        }
    }
});
