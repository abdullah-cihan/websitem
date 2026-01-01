document.addEventListener('DOMContentLoaded', async () => {
    // ======================================================
    // 1. AYARLAR VE ELEMENT SEÇİMLERİ
    // ======================================================
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
        shareContainer: document.getElementById('share-area-bottom'), // YENİ: Paylaşım butonları buraya gelecek
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

    /** Array Karıştırma (Benzer yazılar hep aynı gelmesin diye) */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /** Toast Bildirimi (Modern Stil) */
    function showToast(message, type = 'success') {
        // Varsa eskisin sil
        const existingToast = document.querySelector('.custom-toast');
        if(existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // CSS ile stil verilmeli (.custom-toast)
        Object.assign(toast.style, {
            position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(25, 25, 35, 0.95)', color: '#fff', padding: '12px 24px',
            borderRadius: '50px', backdropFilter: 'blur(10px)', zIndex: '9999',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
            opacity: '0', transition: 'all 0.3s ease', marginTop: '20px'
        });

        document.body.appendChild(toast);
        
        // Animasyon
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
    // 3. İÇERİK YÖNETİMİ VE RENDER
    // ======================================================

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) { 
        renderError("Parametre Eksik", "Görüntülenecek yazı bulunamadı.");
        return; 
    }

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        if(!res.ok) throw new Error("API Hatası");
        
        const data = await res.json();
        const posts = data.posts || [];
        const post = posts.find(p => String(p.id) === String(id));

        if (!post) {
            renderError("İçerik Bulunamadı", "Bu yazı yayından kaldırılmış veya taşınmış olabilir.");
            return;
        }

        // --- Sayfayı Doldur ---
        fillPageContent(post);
        
        // --- Modern Paylaşım Alanını Oluştur ---
        renderBottomShareArea(post);
        
        // --- Benzer Yazıları Getir ---
        renderRelatedPosts(posts, post.id, post.kategori);

        // --- Modern Efektleri Başlat ---
        initScrollAnimations();
        initImageZoom();

    } catch (e) {
        console.error(e);
        renderError("Bağlantı Sorunu", "Veriler sunucudan çekilemedi. Lütfen internet bağlantınızı kontrol edin.");
    }

    // ======================================================
    // 4. SAYFA DOLDURMA MANTIĞI
    // ======================================================
    
    function fillPageContent(post) {
        // Meta SEO
        document.title = `${post.baslik} | Abdullah Cihan`;
        
        // Skeletonları gizle, içeriği aç
        if(elements.headerSkeleton) elements.headerSkeleton.style.display = 'none';
        if(elements.headerContent) elements.headerContent.style.display = 'block';
        if(elements.skeletonContent) elements.skeletonContent.style.display = 'none';

        // Başlık & Info
        elements.title.textContent = post.baslik;
        elements.date.innerHTML = `<i class="fa-regular fa-calendar"></i> ${new Date(post.tarih).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'})}`;
        
        // Kategori Renklendirme
        elements.category.textContent = post.kategori;
        elements.category.className = `category-badge ${getCategoryColor(post.kategori)}`;

        // Kapak Resmi
        if (post.resim && post.resim.startsWith('http')) {
            elements.image.src = post.resim;
            elements.image.onload = () => {
                elements.image.parentElement.classList.add('loaded'); // CSS Fade-in için
                if(elements.coverLoader) elements.coverLoader.style.display = 'none';
            };
        } else {
            if(elements.image) elements.image.style.display = 'none';
            if(elements.coverLoader) elements.coverLoader.style.display = 'none';
        }

        // İçerik İşleme
        const cleanContent = sanitizeHtml(post.icerik);
        elements.content.innerHTML = cleanContent;
        
        // Okuma Süresi
        if(elements.readingTime) {
            const pureText = elements.content.textContent || "";
            elements.readingTime.innerHTML = `<i class="fa-solid fa-stopwatch"></i> ${calculateReadingTime(pureText)} dk okuma`;
        }

        // Kod Bloklarını Renklendir (Highlight.js)
        if(window.hljs) hljs.highlightAll();

        // Etiketler
        if(post.etiketler && elements.tagsContainer) {
            const tags = post.etiketler.split(',').map(t => t.trim());
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
    // 5. YENİ: MODERN PAYLAŞIM ALANI (EN ALTTA)
    // ======================================================
    
    function renderBottomShareArea(post) {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(post.baslik);
        
        // Eğer HTML'de özel bir container yoksa, içeriğin hemen sonuna ekle
        let targetContainer = elements.shareContainer;
        if (!targetContainer) {
            targetContainer = document.createElement('div');
            targetContainer.id = 'share-area-bottom';
            elements.content.parentNode.insertBefore(targetContainer, elements.relatedContainer); // Benzer yazılardan önce
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

        // Kopyala Butonu Olayı
        document.getElementById('btn-copy-link').addEventListener('click', async function() {
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

    // ======================================================
    // 6. BENZER YAZILAR (Shuffle Özellikli)
    // ======================================================
    
    function renderRelatedPosts(allPosts, currentId, currentCategory) {
        if(!elements.relatedContainer) return;

        let filtered = allPosts.filter(p => String(p.id) !== String(currentId));
        let related = filtered.filter(p => p.kategori === currentCategory);
        
        // Önce kategori eşleşmelerini karıştır
        related = shuffleArray(related);

        // Yetersiz kalırsa rastgele diğerlerinden ekle
        if(related.length < 3) {
            let others = filtered.filter(p => p.kategori !== currentCategory);
            others = shuffleArray(others);
            related = related.concat(others);
        }

        const finalPosts = related.slice(0, 3);

        if(finalPosts.length === 0) {
            document.querySelector('.related-section').style.display = 'none';
            return;
        }

        // --- BAŞLIK EKLEME (YENİ) ---
        // Eğer başlık daha önce eklenmemişse dinamik olarak oluştur
        if (!document.getElementById('related-posts-title')) {
            const titleEl = document.createElement('h3');
            titleEl.id = 'related-posts-title';
            titleEl.textContent = 'İlginizi Çekebilir';
            titleEl.className = 'related-title'; // CSS class
            
            // Modern Stil
            Object.assign(titleEl.style, {
                marginTop: '50px',
                marginBottom: '20px',
                fontSize: '1.4rem',
                fontWeight: '600',
                color: 'var(--text-primary, #fff)',
                borderLeft: '4px solid var(--accent-color, #4facfe)',
                paddingLeft: '15px'
            });
            
            // Container'ın hemen öncesine ekle
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
    // 7. UI ETKİLEŞİMLERİ (Scroll & Zoom)
    // ======================================================

    // İlerleme Çubuğu
    window.addEventListener('scroll', () => {
        if (!elements.progressBar) return;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        elements.progressBar.style.width = scrolled + "%";
    });

    // Yazı içindeki görsellere zoom özelliği (Lightbox)
    function initImageZoom() {
        const contentImages = document.querySelectorAll('#detail-content img');
        contentImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                const overlay = document.createElement('div');
                overlay.className = 'lightbox-overlay';
                overlay.innerHTML = `<img src="${img.src}" class="lightbox-img">`;
                
                // Stil (JS içinde hızlıca tanımladık, CSS'e taşınabilir)
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

    // İçeriğin kaydırdıkça gelmesi (Fade In Up)
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        // Animasyonlanacak elementleri seç
        const animatedElements = document.querySelectorAll('#detail-content p, #detail-content h2, #detail-content img, .share-wrapper, .related-card, #related-posts-title');
        animatedElements.forEach(el => {
            el.classList.add('scroll-hidden'); // CSS'de opacity: 0 olmalı
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
