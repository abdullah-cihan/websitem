document.addEventListener('DOMContentLoaded', async () => {
    // ======================================================
    // 1. AYARLAR VE ELEMENT SEÇİMLERİ
    // ======================================================
    // NOT: Bu URL'in Google Apps Script tarafında "Web App" olarak dağıtıldığından
    // ve "Who has access" (Erişim kimde) ayarının "Anyone" (Herkes) olduğundan emin olun.
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 
    
    const elements = {
        // Hero / Header Alanı
        title: document.getElementById('detail-title'),
        date: document.getElementById('detail-date'),
        category: document.getElementById('detail-category'),
        image: document.getElementById('detail-img'),
        coverLoader: document.getElementById('cover-loader'),
        
        // İskelet Yapılar (Loading)
        headerSkeleton: document.getElementById('header-skeleton'),
        headerContent: document.getElementById('header-content'),
        skeletonContent: document.querySelector('.skeleton-content'),
        
        // İçerik Alanları
        content: document.getElementById('detail-content'),
        tagsContainer: document.getElementById('article-tags'),
        readingTime: document.getElementById('reading-time'),
        
        // Alt Alanlar
        shareContainer: document.getElementById('share-area-bottom'),
        relatedContainer: document.getElementById('related-posts-container'),
        progressBar: document.getElementById('progress-bar')
    };

    // ======================================================
    // 2. YARDIMCI MODERN FONKSİYONLAR
    // ======================================================

    /** HTML Temizleme (XSS Koruması) */
    function sanitizeHtml(dirtyHtml) {
        const doc = new DOMParser().parseFromString(dirtyHtml || '', 'text/html');
        const badTags = ['script', 'style', 'iframe', 'form', 'object', 'embed'];
        badTags.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));
        
        // Güvenlik: Event handler'ları ve javascript: linklerini temizle
        doc.querySelectorAll('*').forEach(el => {
            [...el.attributes].forEach(attr => {
                if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
                if ((attr.name === 'href' || attr.name === 'src') && 
                   (attr.value.toLowerCase().includes('javascript:') || attr.value.toLowerCase().includes('data:'))) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        return doc.body.innerHTML;
    }

    /** Okuma Süresi Hesaplama */
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; 
        const textLength = text.split(/\s+/).length; 
        return Math.ceil(textLength / wordsPerMinute);
    }

    /** Array Karıştırma */
    function shuffleArray(array) {
        const newArr = [...array]; // Orijinal diziyi bozmamak için kopya al
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    }

    /** Meta Etiketlerini Güncelle */
    function updateMetaTags(post) {
        const summary = post.ozet || post.icerik.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
        const imageUrl = post.resim || 'assets/default-cover.jpg';
        const pageUrl = window.location.href;

        document.title = `${post.baslik} | Abdullah Cihan`;

        const setMeta = (keyType, keyName, content) => {
            let element = document.querySelector(`meta[${keyType}="${keyName}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(keyType, keyName);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        setMeta('property', 'og:title', post.baslik);
        setMeta('property', 'og:description', summary);
        setMeta('property', 'og:image', imageUrl);
        setMeta('property', 'og:url', pageUrl);
        setMeta('property', 'og:type', 'article');
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', post.baslik);
        setMeta('name', 'twitter:description', summary);
        setMeta('name', 'twitter:image', imageUrl);
    }

    /** Toast Bildirimi */
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.custom-toast');
        if(existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        Object.assign(toast.style, {
            position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(25, 25, 35, 0.95)', color: '#fff', padding: '12px 24px',
            borderRadius: '50px', backdropFilter: 'blur(10px)', zIndex: '9999',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
            opacity: '0', transition: 'all 0.3s ease', marginTop: '20px'
        });

        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.marginTop = '0';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ======================================================
    // 3. İÇERİK YÖNETİMİ VE RENDER (Fetch Güncellendi)
    // ======================================================

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) { 
        renderError("Parametre Eksik", "Görüntülenecek yazı bulunamadı. Lütfen ana sayfadan bir yazı seçin.");
        return; 
    }

    try {
        // Fetch İşlemi (GÜNCELLENMİŞ VE SAĞLAMLAŞTIRILMIŞ KISIM)
        const res = await fetch(`${API_URL}?type=posts`, {
            method: 'GET',
            mode: 'cors', // Açıkça CORS belirtiyoruz
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // HTTP Hatası kontrolü
        if(!res.ok) throw new Error(`Sunucu Hatası: ${res.status} ${res.statusText}`);
        
        // Önce text olarak alıyoruz (Google Script bazen HTML hata sayfası döner)
        const responseText = await res.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error("JSON Parse Hatası:", jsonError);
            console.error("Sunucudan gelen ham veri:", responseText);
            throw new Error("Sunucudan geçersiz veri formatı geldi (Muhtemelen Google Script izin hatası).");
        }

        const posts = data.posts || [];
        // String dönüşümü yaparak ID karşılaştırması yapıyoruz
        const post = posts.find(p => String(p.id).trim() === String(id).trim());

        if (!post) {
            renderError("İçerik Bulunamadı", "Bu yazı yayından kaldırılmış veya taşınmış olabilir.");
            return;
        }

        fillPageContent(post);
        renderBottomShareArea(post);
        renderRelatedPosts(posts, post.id, post.kategori);
        initScrollAnimations();
        initImageZoom();

    } catch (e) {
        console.error("Detay sayfası hatası:", e);
        renderError("Bağlantı Sorunu", `Veriler yüklenirken bir hata oluştu: ${e.message}`);
    }

    // ======================================================
    // 4. SAYFA DOLDURMA MANTIĞI
    // ======================================================
    
    function fillPageContent(post) {
        updateMetaTags(post);
        
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.headerContent) elements.headerContent.style.display = 'block';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';

        if(elements.title) elements.title.textContent = post.baslik;
        if(elements.date) elements.date.innerHTML = `<i class="fa-regular fa-calendar"></i> ${new Date(post.tarih).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'})}`;
        
        if(elements.category) {
            elements.category.textContent = post.kategori;
            elements.category.className = `category-badge ${getCategoryColor(post.kategori)}`;
        }

        if (post.resim && post.resim.startsWith('http')) {
            elements.image.src = post.resim;
            elements.image.onload = () => {
                elements.image.parentElement.classList.add('loaded');
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
            elements.image.onerror = () => {
                // Resim yüklenemezse varsayılan göster veya gizle
                elements.image.style.display = 'none';
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
        } else {
            if(elements.image) elements.image.style.display = 'none';
            if(elements.coverLoader) elements.coverLoader.style.display = 'none';
        }

        const cleanContent = sanitizeHtml(post.icerik);
        if(elements.content) elements.content.innerHTML = cleanContent;
        
        if(elements.readingTime) {
            const pureText = elements.content.textContent || "";
            elements.readingTime.innerHTML = `<i class="fa-solid fa-stopwatch"></i> ${calculateReadingTime(pureText)} dk okuma`;
        }

        if(window.hljs) hljs.highlightAll();

        if(post.etiketler && elements.tagsContainer) {
            const tags = String(post.etiketler).split(',').map(t => t.trim());
            elements.tagsContainer.innerHTML = tags.map(tag => `
                <a href="index.html?tag=${tag}" class="modern-tag">#${tag}</a>
            `).join('');
        }
    }

    function getCategoryColor(category) {
        const cat = String(category || '').toLowerCase();
        if (cat.includes('yazılım') || cat.includes('kod')) return 'blue';
        if (cat.includes('tasarım') || cat.includes('sanat')) return 'purple';
        if (cat.includes('video') || cat.includes('youtube')) return 'red';
        if (cat.includes('teknoloji') || cat.includes('ai')) return 'green';
        return 'gray';
    }

    // ======================================================
    // 5. MODERN PAYLAŞIM ALANI
    // ======================================================
    
    function renderBottomShareArea(post) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(post.baslik);
        
        let targetContainer = elements.shareContainer;
        if (!targetContainer) {
            targetContainer = document.createElement('div');
            targetContainer.id = 'share-area-bottom';
            if(elements.content && elements.content.parentNode) {
                elements.content.parentNode.insertBefore(targetContainer, elements.relatedContainer);
            }
        }

        targetContainer.innerHTML = `
            <div class="share-wrapper glass">
                <p class="share-title">Bu yazıyı beğendin mi? Arkadaşlarınla paylaş!</p>
                <div class="share-buttons-row">
                    <a href="https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}" target="_blank" class="share-btn x" aria-label="X'te Paylaş">
                        <i class="fa-brands fa-x-twitter"></i>
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}" target="_blank" class="share-btn linkedin" aria-label="LinkedIn'de Paylaş">
                        <i class="fa-brands fa-linkedin-in"></i>
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${pageTitle}%0A%0A${pageUrl}" target="_blank" class="share-btn whatsapp" aria-label="WhatsApp'ta Paylaş">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <button id="btn-copy-link" class="share-btn copy" aria-label="Linki Kopyala">
                        <i class="fa-regular fa-clone"></i>
                    </button>
                </div>
            </div>
        `;

        const copyBtn = document.getElementById('btn-copy-link');
        if(copyBtn) {
            copyBtn.addEventListener('click', async function() {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    this.innerHTML = '<i class="fa-solid fa-check"></i>';
                    this.classList.add('copied');
                    showToast('Link panoya kopyalandı!');
                    setTimeout(() => {
                        this.innerHTML = '<i class="fa-regular fa-clone"></i>';
                        this.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    showToast('Kopyalama başarısız', 'error');
                }
            });
        }
    }

    // ======================================================
    // 6. BENZER YAZILAR
    // ======================================================
    
    function renderRelatedPosts(allPosts, currentId, currentCategory) {
        if(!elements.relatedContainer) return;

        let filtered = allPosts.filter(p => String(p.id) !== String(currentId));
        let related = filtered.filter(p => p.kategori === currentCategory);
        
        related = shuffleArray(related);

        if(related.length < 3) {
            let others = filtered.filter(p => p.kategori !== currentCategory);
            others = shuffleArray(others);
            related = related.concat(others);
        }

        const finalPosts = related.slice(0, 3);

        if(finalPosts.length === 0) {
            const section = document.querySelector('.related-section');
            if(section) section.style.display = 'none';
            return;
        }

        if (!document.getElementById('related-posts-title')) {
            const titleEl = document.createElement('h3');
            titleEl.id = 'related-posts-title';
            titleEl.textContent = 'İlginizi Çekebilir';
            titleEl.className = 'related-title';
            
            Object.assign(titleEl.style, {
                marginTop: '50px',
                marginBottom: '20px',
                fontSize: '1.4rem',
                fontWeight: '600',
                color: 'var(--text-primary, #fff)',
                borderLeft: '4px solid var(--accent-color, #4facfe)',
                paddingLeft: '15px'
            });
            
            elements.relatedContainer.parentNode.insertBefore(titleEl, elements.relatedContainer);
        }

        elements.relatedContainer.innerHTML = finalPosts.map(p => `
            <a href="blog-detay.html?id=${p.id}" class="related-card glass-hover">
                <div class="related-img-box">
                    <img src="${p.resim || 'assets/default.jpg'}" alt="${p.baslik}" loading="lazy">
                </div>
                <div class="related-info">
                    <span class="mini-cat">${p.kategori}</span>
                    <h4>${p.baslik}</h4>
                    <span class="mini-date">${new Date(p.tarih).toLocaleDateString('tr-TR')}</span>
                </div>
            </a>
        `).join('');
    }

    // ======================================================
    // 7. UI ETKİLEŞİMLERİ
    // ======================================================

    window.addEventListener('scroll', () => {
        if (!elements.progressBar) return;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        elements.progressBar.style.width = scrolled + "%";
    });

    function initImageZoom() {
        const contentImages = document.querySelectorAll('#detail-content img');
        contentImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                const overlay = document.createElement('div');
                overlay.className = 'lightbox-overlay';
                overlay.innerHTML = `<img src="${img.src}" class="lightbox-img">`;
                
                Object.assign(overlay.style, {
                    position:'fixed', top:0, left:0, width:'100%', height:'100%',
                    background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex',
                    alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.3s'
                });

                document.body.appendChild(overlay);
                requestAnimationFrame(() => overlay.style.opacity = 1);
                
                overlay.addEventListener('click', () => {
                    overlay.style.opacity = 0;
                    setTimeout(() => overlay.remove(), 300);
                });
            });
        });
    }

    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const animatedElements = document.querySelectorAll('#detail-content p, #detail-content h2, #detail-content img, .share-wrapper, .related-card, #related-posts-title');
        animatedElements.forEach(el => {
            el.classList.add('scroll-hidden'); 
            observer.observe(el);
        });
    }

    // ======================================================
    // 8. HATA EKRANI
    // ======================================================
    function renderError(title, message) {
        document.title = "Hata | Blog";
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';
        
        const container = document.querySelector('.detail-layout') || document.body;
        container.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-ghost"></i>
                <h2>${title}</h2>
                <p>${message}</p>
                <a href="index.html" class="btn-primary">Ana Sayfaya Dön</a>
            </div>
        `;
    }
});
