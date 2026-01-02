document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. AYARLAR VE SEÇİCİLER
    // ==========================================
    const CONFIG = {
        API_URL: "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec",
        ANIMATION_THRESHOLD: 0.1
    };

    const DOM = {
        featuredContainer: document.getElementById('featured-container'),
        standardContainer: document.getElementById('standard-container'),
        hamburger: document.querySelector('.hamburger'),
        navLinks: document.querySelector('.nav-links'),
        progressBar: document.getElementById('progress-bar'),
        backToTop: document.querySelector('.back-to-top'),
        themeToggle: document.getElementById('theme-toggle'),
        body: document.body
    };

    let allPosts = []; // Tüm yazıları hafızada tutmak için

    // ==========================================
    // 2. MODERN DAKTİLO EFEKTİ (Class Yapısı)
    // ==========================================
    class TypeWriter {
        constructor(el, toRotate, period) {
            this.toRotate = toRotate;
            this.el = el;
            this.loopNum = 0;
            this.period = parseInt(period, 10) || 2000;
            this.txt = '';
            this.isDeleting = false;
            this.tick();
        }

        tick() {
            const i = this.loopNum % this.toRotate.length;
            const fullTxt = this.toRotate[i];

            if (this.isDeleting) {
                this.txt = fullTxt.substring(0, this.txt.length - 1);
            } else {
                this.txt = fullTxt.substring(0, this.txt.length + 1);
            }

            this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

            let delta = 200 - Math.random() * 100;
            if (this.isDeleting) { delta /= 2; }

            if (!this.isDeleting && this.txt === fullTxt) {
                delta = this.period;
                this.isDeleting = true;
            } else if (this.isDeleting && this.txt === '') {
                this.isDeleting = false;
                this.loopNum++;
                delta = 500;
            }

            setTimeout(() => this.tick(), delta);
        }
    }

    // Daktiloyu Başlat
    const elements = document.getElementsByClassName('typewrite');
    for (let i = 0; i < elements.length; i++) {
        const toRotate = elements[i].getAttribute('data-type');
        const period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TypeWriter(elements[i], JSON.parse(toRotate), period);
        }
    }

    // ==========================================
    // 3. UI ETKİLEŞİMLERİ (Menü, Scroll, Tema)
    // ==========================================
    
    // Mobil Menü
    if (DOM.hamburger && DOM.navLinks) {
        DOM.hamburger.addEventListener('click', () => {
            const isExpanded = DOM.hamburger.getAttribute('aria-expanded') === 'true';
            DOM.hamburger.setAttribute('aria-expanded', !isExpanded);
            DOM.navLinks.classList.toggle('active');
            
            // İkon Değişimi
            const icon = DOM.hamburger.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        // Linke tıklayınca menüyü kapat
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                DOM.navLinks.classList.remove('active');
                DOM.hamburger.setAttribute('aria-expanded', 'false');
                const icon = DOM.hamburger.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            });
        });
    }

    // Tema Değiştirme (Güneş/Ay)
    if (DOM.themeToggle) {
        // Kayıtlı temayı kontrol et
        const savedTheme = localStorage.getItem('theme');
        const themeIcon = DOM.themeToggle.querySelector('i');

        // Varsayılan HTML dark-mode ile geliyor. Eğer kullanıcı light seçmişse sınıfı kaldır.
        if (savedTheme === 'light') {
            DOM.body.classList.remove('dark-mode');
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
        }

        DOM.themeToggle.addEventListener('click', () => {
            DOM.body.classList.toggle('dark-mode');
            const isDark = DOM.body.classList.contains('dark-mode');

            if (isDark) {
                // Karanlık mod aktif -> Güneş ikonu (Aydınlığa geçiş için)
                if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                // Aydınlık mod aktif -> Ay ikonu (Karanlığa geçiş için)
                if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Scroll Olayları (Progress Bar & Back to Top)
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        // Progress Bar
        if (DOM.progressBar && scrollHeight > 0) {
            const scrolled = (scrollTop / scrollHeight) * 100;
            DOM.progressBar.style.width = `${scrolled}%`;
        }

        // Back To Top Butonu
        if (DOM.backToTop) {
            DOM.backToTop.classList.toggle('active', scrollTop > 300);
        }
    });

    // ==========================================
    // 4. API VERİ İŞLEMLERİ
    // ==========================================

    // Skeleton (Yükleme) Kartı
    const createSkeletonCard = () => `
        <article class="blog-card glass skeleton-card">
            <div class="skeleton-img"></div>
            <div class="blog-content">
                <div class="skeleton-text w-50"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-btn"></div>
            </div>
        </article>
    `;

    // Yükleniyor durumunu göster
    const showLoading = () => {
        if (DOM.standardContainer) {
            DOM.standardContainer.innerHTML = createSkeletonCard().repeat(3);
        }
    };

    // Tekil Blog Kartı HTML'i
    const createBlogCard = (post, isFeatured = false) => {
        const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        
        // Resim kontrolü
        const isImage = post.resim && post.resim.startsWith("http");
        const mediaHtml = isImage 
            ? `<img src="${post.resim}" alt="${post.baslik}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">`
            : `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2.5rem; color:#3b82f6; display:flex; align-items:center; justify-content:center; height:100%;"></i>`;

        // Kategori Rengi
        const catLower = (post.kategori || '').toLowerCase();
        let catClass = "cat-blue";
        if (catLower.includes("felsefe")) catClass = "cat-purple";
        if (catLower.includes("teknoloji")) catClass = "cat-green";
        if (catLower.includes("video")) catClass = "cat-red";

        return `
            <article class="blog-card glass ${isFeatured ? 'featured-card' : ''} hidden">
                <div class="blog-thumb" style="${isImage ? 'padding:0; background:none;' : ''}">
                    ${mediaHtml}
                </div>
                <div class="blog-content">
                    <div class="meta">
                        <span class="category ${catClass}">${post.kategori || 'Genel'}</span>
                        <span class="date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                    </div>
                    <h3>
                        <a href="blog-detay.html?id=${post.id}">${post.baslik}</a>
                    </h3>
                    <p>${post.ozet || ''}</p>
                    <a href="blog-detay.html?id=${post.id}" class="btn-read-modern">
                        Devamını Oku <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    };

    // Yazıları Ekrana Bas (Filtreleme Destekli)
    const renderPosts = (category = null) => {
        // Konteynerları temizle
        if (DOM.standardContainer) DOM.standardContainer.innerHTML = "";
        if (DOM.featuredContainer) DOM.featuredContainer.innerHTML = "";

        let filteredPosts = allPosts;

        // Kategori Filtresi Uygula
        if (category) {
            filteredPosts = allPosts.filter(p => (p.kategori || '').toLowerCase().includes(category.toLowerCase()));
        }

        if (filteredPosts.length === 0) {
            if (DOM.standardContainer) DOM.standardContainer.innerHTML = `<div class="empty-state glass" style="padding:20px; text-align:center;">Bu kategoride henüz içerik bulunmuyor.</div>`;
            return;
        }

        filteredPosts.forEach(post => {
            // Filtre varsa "Öne Çıkan" ayrımı yapma, hepsini standart listeye ekle
            const isFeatured = !category && String(post.one_cikan).toLowerCase() === "true";
            const cardHtml = createBlogCard(post, isFeatured);
            
            if (isFeatured && DOM.featuredContainer) {
                DOM.featuredContainer.innerHTML += cardHtml;
            } else if (DOM.standardContainer) {
                DOM.standardContainer.innerHTML += cardHtml;
            }
        });

        // Yeni eklenenler için animasyonları başlat
        initObserver();
    };

    // Ana Veri Çekme
    const fetchPosts = async () => {
        showLoading();

        try {
            const res = await fetch(`${CONFIG.API_URL}?type=posts`);
            if (!res.ok) throw new Error('Ağ hatası');
            
            const data = await res.json();
            const posts = data.posts || [];
            allPosts = posts.filter(p => p.durum === "Yayında");

            // İlk açılışta hepsini render et
            renderPosts();

        } catch (error) {
            console.error("Veri çekme hatası:", error);
            if (DOM.standardContainer) {
                DOM.standardContainer.innerHTML = `
                    <div class="error-state glass">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>Yazılar yüklenirken bir sorun oluştu.</p>
                        <button onclick="location.reload()" class="btn-sidebar">Tekrar Dene</button>
                    </div>`;
            }
        }
    };

    // ==========================================
    // 5. ANİMASYON GÖZLEMCİSİ
    // ==========================================
    const initObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    entry.target.classList.remove('hidden');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: CONFIG.ANIMATION_THRESHOLD });

        document.querySelectorAll('.blog-card.hidden').forEach(el => observer.observe(el));
        document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
    };

    // ==========================================
    // 6. GLOBAL FONKSİYONLAR
    // ==========================================
    // HTML'den onclick="filterByCategory('Python')" çağrısı için global fonksiyon
    window.filterByCategory = (category) => {
        // Sayfayı blog bölümüne kaydır
        const blogSection = document.getElementById('blog');
        if(blogSection) blogSection.scrollIntoView({ behavior: 'smooth' });
        
        // Filtrele ve yeniden çiz
        renderPosts(category);
    };

    // ==========================================
    // 7. BAŞLAT
    // ==========================================
    fetchPosts(); 
    initObserver();
});
