document.addEventListener('DOMContentLoaded', async () => {
    // ======================================================
    // 1. AYARLAR VE ELEMENT SEÇİMLERİ
    // ======================================================
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 
    
    // HTML'deki elementleri seçiyoruz
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

    // ======================================================
    // 2. YARDIMCI FONKSİYONLAR
    // ======================================================

    /**
     * Güvenlik: HTML içeriğini temizler (XSS Koruması)
     */
    function sanitizeHtml(dirtyHtml) {
        const html = String(dirtyHtml || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Yasaklı etiketleri kaldır
        const badTags = ['script', 'style', 'iframe', 'object', 'embed', 'form'];
        badTags.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));
        
        // Tehlikeli attribute'leri temizle (onclick vb.)
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

    /**
     * Okuma süresini hesaplar (Dakika cinsinden)
     */
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; 
        const textLength = text.split(/\s+/).length; 
        const minutes = Math.ceil(textLength / wordsPerMinute);
        return minutes;
    }

    /**
     * Kategoriye göre renk sınıfı atar
     */
    function setCategoryColor(category) {
        if (!elements.category) return;
        elements.category.textContent = category;
        
        const catLower = String(category).toLowerCase();
        let colorClass = 'cat-default'; // Varsayılan (CSS'te tanımlı değilse standart renk alır)
        
        // CSS dosyanızdaki renklere göre eşleştirme
        if (['python', 'yazılım', 'kodlama'].some(k => catLower.includes(k))) colorClass = 'cat-blue';
        else if (['tasarım', 'sanat', 'felsefe'].some(k => catLower.includes(k))) colorClass = 'cat-purple';
        else if (['teknoloji', 'yapay zeka', 'kariyer'].some(k => catLower.includes(k))) colorClass = 'cat-green';
        else if (['video', 'youtube'].some(k => catLower.includes(k))) colorClass = 'cat-red';
        
        // Eski sınıfları temizle ve yenisini ekle
        elements.category.className = `category ${colorClass}`;
    }

    /**
     * Toast Bildirimi Gösterir (Link Kopyalandı vs.)
     */
    function showToast(message) {
        const toast = document.getElementById('share-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ======================================================
    // 3. META VE PAYLAŞIM AYARLARI
    // ======================================================

    /**
     * Meta Etiketlerini Günceller (Social Media Preview İçin)
     */
    function updateMetaTags(post) {
        document.title = `${post.baslik} | Abdullah Cihan`;
        
        const pageUrl = window.location.href;
        // Eğer görsel URL'i http ile başlamıyorsa varsayılan bir görsel koy
        const imageUrl = (post.resim && post.resim.startsWith('http')) 
                         ? post.resim 
                         : 'assets/default-cover.jpg'; // Varsayılan görsel yolunuz
        
        // HTML etiketlerini temizleyip kısa özet oluştur
        const summary = post.ozet || post.icerik.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

        // Helper: Meta tag yoksa oluştur, varsa güncelle
        const setMeta = (attrName, attrValue, content) => {
            let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attrName, attrValue);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Open Graph (Facebook, LinkedIn, WhatsApp)
        setMeta('property', 'og:title', post.baslik);
        setMeta('property', 'og:description', summary);
        setMeta('property', 'og:image', imageUrl);
        setMeta('property', 'og:url', pageUrl);
        setMeta('property', 'og:type', 'article');

        // Twitter Card
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', post.baslik);
        setMeta('name', 'twitter:description', summary);
        setMeta('name', 'twitter:image', imageUrl);
    }

    /**
     * Paylaşım Butonlarına Linkleri Atar
     */
    function setupShareButtons(post) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(post.baslik);
        
        const links = {
            x: `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
            whatsapp: `https://api.whatsapp.com/send?text=${pageTitle}%0A%0A${pageUrl}`, // Başlık + Link
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`
        };

        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');
        const fbBtn = document.getElementById('share-facebook');
        const copyBtn = document.getElementById('share-copy');

        if (xBtn) xBtn.href = links.x;
        if (liBtn) liBtn.href = links.linkedin;
        if (waBtn) waBtn.href = links.whatsapp;
        if (fbBtn) fbBtn.href = links.facebook;

        // Kopyala Butonu Mantığı
        if (copyBtn) {
            // Eski event listener'ları temizlemek için butonu klonlayıp değiştiriyoruz
            const newBtn = copyBtn.cloneNode(true);
            copyBtn.parentNode.replaceChild(newBtn, copyBtn);
            
            newBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('✅ Link kopyalandı!');
                } catch (err) {
                    // Fallback (Eski tarayıcılar için)
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
    // 4. MAIN VERİ ÇEKME İŞLEMİ
    // ======================================================

    // URL'den ID parametresini al (?id=123)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // ID yoksa hata ver
    if (!id) { 
        renderError("Parametre Hatası", "Geçerli bir yazı ID'si bulunamadı.");
        return; 
    }

    try {
        // API'den veriyi çek
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        // ID'si eşleşen yazıyı bul
        const post = posts.find(p => String(p.id) === String(id));

        if (!post) {
            renderError("Yazı Bulunamadı", "Aradığınız içerik silinmiş veya adresi değişmiş olabilir.");
            return;
        }

        // --- İÇERİĞİ DOLDURMA BAŞLIYOR ---

        // 1. Meta Tagları ve Başlık
        updateMetaTags(post);
        elements.title.textContent = post.baslik;

        // 2. Başlık İskeletini Gizle -> Gerçek İçeriği Göster
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.headerContent) elements.headerContent.style.display = 'block';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        // 3. Tarih ve Kategori
        if(elements.date) {
            elements.date.textContent = new Date(post.tarih).toLocaleDateString('tr-TR', {
                year:'numeric', month:'long', day:'numeric'
            });
        }
        setCategoryColor(post.kategori);

        // 4. İçerik ve Okuma Süresi
        const sanitizedContent = sanitizeHtml(post.icerik);
        if(elements.readingTime) {
            // HTML taglarını temizleyip sadece metin uzunluğuna bakıyoruz
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedContent;
            const pureText = tempDiv.textContent || tempDiv.innerText || "";
            const minutes = calculateReadingTime(pureText);
            elements.readingTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${minutes} dk okuma`;
        }
        if(elements.content) elements.content.innerHTML = sanitizedContent;

        // 5. Kapak Görseli Yönetimi
        if (post.resim && post.resim.startsWith('http')) {
            elements.image.src = post.resim;
            // Resim tamamen yüklendiğinde
            elements.image.onload = () => {
                elements.image.style.display = 'block';
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
            // Resim yüklenemezse (kırık link)
            elements.image.onerror = () => {
                elements.image.style.display = 'none';
                if(elements.coverLoader) elements.coverLoader.innerHTML = '<i class="fa-solid fa-image" style="font-size:3rem; opacity:0.5;"></i>';
            };
        } else {
            // Hiç resim yoksa
            if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            if(elements.image) elements.image.style.display = 'none';
        }

        // 6. Kod Bloklarını Renklendir (Highlight.js kütüphanesi sayfada varsa)
        if(window.hljs) hljs.highlightAll();

        // 7. Etiketler (Tags)
        if(post.etiketler && elements.tagsContainer) {
            // Veri tabanında "python, yazılım, kod" şeklinde virgülle ayrılmışsa
            const tags = post.etiketler.split(',').map(t => t.trim());
            elements.tagsContainer.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        }

        // 8. Paylaşım Butonlarını ve Benzer Yazıları Kur
        setupShareButtons(post);
        renderRelatedPosts(posts, post.id, post.kategori);

    } catch (e) {
        console.error(e);
        renderError("Bağlantı Hatası", "Veriler yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.");
    }

    // ======================================================
    // 5. SCROLL PROGRESS BAR (OKUMA ÇUBUĞU)
    // ======================================================
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        if (elements.progressBar) elements.progressBar.style.width = scrolled + "%";
    });

    // ======================================================
    // 6. BENZER YAZILAR FONKSİYONU
    // ======================================================
    function renderRelatedPosts(allPosts, currentId, currentCategory) {
        if(!elements.relatedContainer) return;

        // 1. Mevcut yazıyı listeden çıkar
        let filtered = allPosts.filter(p => String(p.id) !== String(currentId));
        
        // 2. Aynı kategoridekileri bul
        let related = filtered.filter(p => p.kategori === currentCategory);
        
        // 3. Eğer 3'ten azsa, kategorisi farklı olanlardan ekleme yap (Doldurmak için)
        if(related.length < 3) {
            const others = filtered.filter(p => p.kategori !== currentCategory);
            related = related.concat(others);
        }

        // 4. İlk 3 tanesini al
        const finalPosts = related.slice(0, 3);

        // 5. Hiç yazı yoksa bölümü gizle
        if(finalPosts.length === 0) {
            document.querySelector('.related-posts-section').style.display = 'none';
            return;
        }

        // 6. HTML Oluştur
        elements.relatedContainer.innerHTML = finalPosts.map(p => `
            <a href="blog-detay.html?id=${p.id}" class="related-card glass">
                <span class="related-cat">${p.kategori || 'Genel'}</span>
                <h4 class="related-title">${p.baslik}</h4>
                <span class="related-date">${new Date(p.tarih).toLocaleDateString('tr-TR')}</span>
            </a>
        `).join('');
    }

    // ======================================================
    // 7. HATA EKRANI OLUŞTURUCU
    // ======================================================
    function renderError(title, message) {
        document.title = "Hata | Abdullah Cihan";
        
        // Yükleme efektlerini temizle
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        // Layout kapsayıcısını bul ve hata mesajını bas
        const container = document.querySelector('.detail-layout');
        if(container) {
            container.innerHTML = `
                <div class="error-container glass">
                    <i class="fa-solid fa-triangle-exclamation error-icon"></i>
                    <h2 style="color:#fff; margin-bottom:15px;">${title}</h2>
                    <p style="color:#ccc; margin-bottom:25px;">${message}</p>
                    <a href="index.html" class="btn-error">Ana Sayfaya Dön</a>
                </div>
            `;
            // Hata ekranı tek sütun olsun
            container.style.display = 'block';
        }
    }
});
