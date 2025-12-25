document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // 1. DAKTİLO EFEKTİ (API'den Bağımsız - Hemen Çalışır)
    // ==========================================
    const TxtType = function(el, toRotate, period) {
        this.toRotate = Array.isArray(toRotate) ? toRotate : [];
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = '';
        this.isDeleting = false;

        // Güvenli span oluşturma
        this.wrap = document.createElement('span');
        this.wrap.className = 'wrap';
        this.el.textContent = ''; 
        this.el.appendChild(this.wrap);

        this.tick();
    };

    TxtType.prototype.tick = function() {
        if (!this.toRotate.length) return;

        const i = this.loopNum % this.toRotate.length;
        const fullTxt = String(this.toRotate[i] || '');

        if (this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        // textContent kullanarak güvenli yazım
        this.wrap.textContent = this.txt;

        let delta = 200 - Math.random() * 100;
        if (this.isDeleting) delta /= 2;

        if (!this.isDeleting && this.txt === fullTxt) {
            delta = this.period;
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500;
        }

        setTimeout(() => this.tick(), delta);
    };

    // Daktiloyu sayfadaki elementlere uygula
    const typewriteElements = document.getElementsByClassName('typewrite');
    for (let i = 0; i < typewriteElements.length; i++) {
        const toRotateStr = typewriteElements[i].getAttribute('data-type');
        const period = typewriteElements[i].getAttribute('data-period');

        if (toRotateStr) {
            try {
                new TxtType(typewriteElements[i], JSON.parse(toRotateStr), period);
            } catch (e) {
                console.error("Daktilo JSON hatası:", e);
            }
        }
    }

    // ==========================================
    // 2. ARAYÜZ ETKİLEŞİMLERİ (Menü & Scroll)
    // ==========================================
    
    // Mobil Menü (Hamburger)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Scroll Bar & Yukarı Çık Butonu
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        // İlerleme Çubuğu
        const progressBar = document.getElementById('progress-bar');
        if (progressBar && scrollHeight > 0) {
            progressBar.style.width = (scrollTop / scrollHeight) * 100 + "%";
        }

        // Yukarı Çık Butonu
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            if (scrollTop > 300) backToTop.classList.add('active');
            else backToTop.classList.remove('active');
        }
    });

    // ==========================================
    // 3. API VERİLERİ (GOOGLE APPS SCRIPT - KORUNDU)
    // ==========================================
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
    const container = document.getElementById('standard-container');
    const featuredContainer = document.getElementById('featured-container');

    // Yükleniyor mesajı
    if (container) container.innerHTML = "<p style='color:white;text-align:center'>Yükleniyor...</p>";

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        const activePosts = posts.filter(p => p.durum === "Yayında");
        
        // Temizlik
        if (container) container.innerHTML = "";
        if (featuredContainer) featuredContainer.innerHTML = "";
        
        if (activePosts.length === 0 && container) {
            container.innerHTML = "<p style='color:#94a3b8;text-align:center'>Henüz yazı yok.</p>";
        }

        // --- KARTLARI OLUŞTURMA (SENİN ORİJİNAL YAPIN) ---
        activePosts.forEach(post => {
            const isFeatured = (String(post.one_cikan).toLowerCase() === "true");
            const target = isFeatured && featuredContainer ? featuredContainer : container;
            if (!target) return;

            const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : '';
            
            // Resim/İkon Mantığı
            let mediaHtml = "";
            if (post.resim && post.resim.startsWith("http")) {
                mediaHtml = `<img src="${post.resim}" alt="${post.baslik}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
            } else {
                mediaHtml = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2rem; color:#3b82f6;"></i>`;
            }
            
            // Kategori Renkleri
            let catColor = "cat-blue";
            if (post.kategori === "Felsefe") catColor = "cat-purple";
            if (post.kategori === "Teknoloji") catColor = "cat-green";

            const html = `
                <article class="blog-card glass ${!isFeatured ? '' : 'featured-card'}">
                    <div class="blog-thumb" style="${post.resim && post.resim.startsWith('http') ? 'padding:0; background:none' : ''}">
                        ${mediaHtml}
                    </div>
                    <div class="blog-content">
                        <div class="meta">
                            <span class="category ${catColor}">${post.kategori}</span>
                            <span class="date">${dateStr}</span>
                        </div>
                        <h3>${post.baslik}</h3>
                        ${isFeatured ? `<p>${post.ozet || ''}</p>` : ''}
                        <a href="blog-detay.html?id=${post.id}" class="btn-read-modern">Oku <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
            target.innerHTML += html;
        });

        // ==========================================
        // 4. ANİMASYON TETİKLEYİCİSİ (Veriler geldikten sonra)
        // ==========================================
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    entry.target.classList.remove('hidden');
                    observer.unobserve(entry.target);
                }
            });
        });

        // Hem yeni gelen kartları hem de gizli sidebar elemanlarını seç
        const blogCards = document.querySelectorAll('.blog-card');
        const hiddenStaticElements = document.querySelectorAll('.hidden');

        blogCards.forEach(el => observer.observe(el));
        hiddenStaticElements.forEach(el => observer.observe(el));

    } catch (e) {
        console.error("API Hatası:", e);
        if (container) container.innerHTML = "<p style='color:red;text-align:center'>Veriler yüklenemedi.</p>";
        // Hata durumunda sidebarlar kaybolmasın diye göster
        document.querySelectorAll('.hidden').forEach(el => el.classList.add('show'));
    }
});
