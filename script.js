document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------------------------------------------------------
    // 1. DAKTİLO EFEKTİ (TYPEWRITER) - Üste Taşındı (Hemen çalışması için)
    // -----------------------------------------------------------------------
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

        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

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

    // 'window.load' beklemesine gerek yok, HTML zaten hazır.
    // Direkt başlatıyoruz:
    var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }


    // -----------------------------------------------------------------------
    // 2. BLOG VERİLERİNİ ÇEKME (API)
    // -----------------------------------------------------------------------
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
    const container = document.getElementById('standard-container');
    const featuredContainer = document.getElementById('featured-container');

    if (container) container.innerHTML = "<p style='color:white;text-align:center'>Yükleniyor...</p>";

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];

        const activePosts = posts.filter(p => p.durum === "Yayında");

        if (container) container.innerHTML = "";
        if (featuredContainer) featuredContainer.innerHTML = "";

        if (activePosts.length === 0 && container) {
            container.innerHTML = "<p style='color:#94a3b8;text-align:center'>Henüz yazı yok.</p>";
        }

        activePosts.forEach(post => {
            const isFeatured = (String(post.one_cikan).toLowerCase() === "true");
            const target = isFeatured && featuredContainer ? featuredContainer : container;
            if (!target) return;

            const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : '';

            let mediaHtml = "";
            if (post.resim && post.resim.startsWith("http")) {
                mediaHtml = `<img src="${post.resim}" alt="${post.baslik}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
            } else {
                mediaHtml = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2rem; color:#3b82f6;"></i>`;
            }

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

        // -----------------------------------------------------------------------
        // 3. SCROLL ANIMATION (Sidebar + Kartlar)
        // -----------------------------------------------------------------------
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    entry.target.classList.remove('hidden');
                    observer.unobserve(entry.target);
                }
            });
        });

        const blogCards = document.querySelectorAll('.blog-card');
        const hiddenStaticElements = document.querySelectorAll('.hidden');

        blogCards.forEach(el => observer.observe(el));
        hiddenStaticElements.forEach(el => observer.observe(el));

    } catch (e) {
        console.error(e);
        if (container) container.innerHTML = "<p style='color:red;text-align:center'>Veriler yüklenemedi.</p>";
        document.querySelectorAll('.hidden').forEach(el => el.classList.add('show'));
    }

    // -----------------------------------------------------------------------
    // 4. SCROLL PROGRESS BAR
    // -----------------------------------------------------------------------
    window.addEventListener('scroll', () => {
        const progressBar = document.getElementById("progress-bar");
        if (progressBar) {
            const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = scrolled + "%";
        }
    });
});
