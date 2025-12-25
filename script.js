/* ==========================================================================
   1. DAKTİLO EFEKTİ (Bağımsız Çalışır - Veriyi Beklemez)
   ========================================================================== */
const TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }

    setTimeout(function() {
        that.tick();
    }, delta);
};

// Daktiloyu hemen başlatır
document.addEventListener('DOMContentLoaded', function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            try {
                new TxtType(elements[i], JSON.parse(toRotate), period);
            } catch(e) {
                console.error("JSON Hatası: data-type içindeki tırnakları kontrol edin.", e);
            }
        }
    }
});


/* ==========================================================================
   2. BLOG VERİLERİ VE DİĞER FONKSİYONLAR (Eski Yapınız Korundu)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- SCROLL PROGRESS BAR (Eklendi) ---
    window.addEventListener('scroll', () => {
        const progressBar = document.getElementById("progress-bar");
        if(progressBar) {
            const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = scrolled + "%";
        }
    });

    // --- BLOG API VERİ ÇEKME ---
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
    const container = document.getElementById('standard-container');
    const featuredContainer = document.getElementById('featured-container');

    // Yükleniyor mesajı
    if(container) container.innerHTML = "<p style='color:white;text-align:center'>Yükleniyor...</p>";

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        const activePosts = posts.filter(p => p.durum === "Yayında");
        
        // Temizlik
        if(container) container.innerHTML = "";
        if(featuredContainer) featuredContainer.innerHTML = "";
        
        if(activePosts.length === 0 && container) {
            container.innerHTML = "<p style='color:#94a3b8;text-align:center'>Henüz yazı yok.</p>";
        }

        // Kartları Oluşturma Döngüsü (Aynen Korundu)
        activePosts.forEach(post => {
            const isFeatured = (String(post.one_cikan).toLowerCase() === "true");
            const target = isFeatured && featuredContainer ? featuredContainer : container;
            if(!target) return;

            const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : '';
            
            // Resim/İkon Mantığı (Aynen Korundu)
            let mediaHtml = "";
            if(post.resim && post.resim.startsWith("http")) {
                mediaHtml = `<img src="${post.resim}" alt="${post.baslik}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
            } else {
                mediaHtml = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2rem; color:#3b82f6;"></i>`;
            }
            
            // Kategori Renkleri (Aynen Korundu)
            let catColor = "cat-blue";
            if(post.kategori === "Felsefe") catColor = "cat-purple";
            if(post.kategori === "Teknoloji") catColor = "cat-green";

            const html = `
                <article class="blog-card glass ${!isFeatured ? '' : 'featured-card'}">
                    <div class="blog-thumb" style="${post.resim && post.resim.startsWith('http')?'padding:0; background:none':''}">
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

        // --- SCROLL ANIMATION (Sidebar Düzeltmesi Dahil) ---
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { 
                if(entry.isIntersecting) {
                    entry.target.classList.add('show');
                    entry.target.classList.remove('hidden'); 
                    observer.unobserve(entry.target); 
                }
            });
        });

        // Hem kartları hem de gizli sidebarları seçip animasyona katıyoruz
        const blogCards = document.querySelectorAll('.blog-card');
        const hiddenStaticElements = document.querySelectorAll('.hidden');

        blogCards.forEach(el => observer.observe(el));
        hiddenStaticElements.forEach(el => observer.observe(el));

    } catch(e) {
        console.error("API Hatası:", e);
        if(container) container.innerHTML = "<p style='color:red;text-align:center'>Veriler yüklenemedi.</p>";
        // Hata durumunda sidebarları zorla göster (Güvenlik Önlemi)
        document.querySelectorAll('.hidden').forEach(el => el.classList.add('show'));
    }
});
