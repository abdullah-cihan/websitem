document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
  
  const container = document.getElementById('standard-container');
  const featuredContainer = document.getElementById('featured-container');

  // Yükleniyor mesajı
  if(container) container.innerHTML = "<p style='color:white;text-align:center'>Yükleniyor...</p>";

  try {
    const res = await fetch(`${API_URL}?type=posts`);
    const data = await res.json();
    const posts = data.posts || [];

    // Sadece Yayında olanlar
    const activePosts = posts.filter(p => p.durum === "Yayında");
    
    // Konteynerleri temizle
    if(container) container.innerHTML = "";
    if(featuredContainer) featuredContainer.innerHTML = "";
    
    // Yazı yoksa uyarı ver
    if(activePosts.length === 0 && container) {
        container.innerHTML = "<p style='color:#94a3b8;text-align:center'>Henüz yazı yok.</p>";
    }

    // Kartları Oluştur
    activePosts.forEach(post => {
      const isFeatured = (String(post.one_cikan).toLowerCase() === "true");
      const target = isFeatured && featuredContainer ? featuredContainer : container;
      if(!target) return;

      const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : '';
      
      // Resim URL mi yoksa FontAwesome Class mı?
      let mediaHtml = "";
      if(post.resim && post.resim.startsWith("http")) {
         mediaHtml = `<img src="${post.resim}" alt="${post.baslik}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
      } else {
         mediaHtml = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2rem; color:#3b82f6;"></i>`;
      }
      
      // Kategori Rengi
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

    // --- ANIMASYON GÖZLEMCİSİ (SIDEBAR DÜZELTMESİ DAHİL) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if(entry.isIntersecting) {
                entry.target.classList.add('show');
                entry.target.classList.remove('hidden'); 
                observer.unobserve(entry.target); 
            }
        });
    });

    // Hem kartları hem de gizli sidebarları izle
    const blogCards = document.querySelectorAll('.blog-card');
    const hiddenStaticElements = document.querySelectorAll('.hidden');

    blogCards.forEach(el => observer.observe(el));
    hiddenStaticElements.forEach(el => observer.observe(el));

  } catch(e) {
    console.error(e);
    if(container) container.innerHTML = "<p style='color:red;text-align:center'>Veriler yüklenemedi.</p>";
    document.querySelectorAll('.hidden').forEach(el => el.classList.add('show'));
  }

  // --- YENİ EKLENEN KISIM: SCROLL PROGRESS BAR ---
  // Sayfa aşağı kaydırıldıkça üstteki barın dolmasını sağlar.
  window.addEventListener('scroll', () => {
      const progressBar = document.getElementById("progress-bar");
      if(progressBar) {
          // Sayfanın toplam kaydırılabilir yüksekliğini hesapla
          const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          
          // Yüzdeyi hesapla
          const scrolled = (scrollTop / scrollHeight) * 100;
          
          // CSS genişliğini güncelle
          progressBar.style.width = scrolled + "%";
      }
  });
  /* =========================================
   DAKTİLO EFEKTİ (TYPEWRITER)
   ========================================= */

const TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

// Yazma Döngüsü (Tick)
TxtType.prototype.tick = function() {
    // Şu anki kelime dizisini al
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    // Siliniyor mu yazılıyor mu?
    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    // HTML'e yaz
    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    // Hız ayarları (Delta)
    var that = this;
    var delta = 200 - Math.random() * 100; // Rastgele yazma hızı

    if (this.isDeleting) { delta /= 2; } // Silerken daha hızlı olsun

    // Kelime tamamlandıysa
    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period; // Bekleme süresi (data-period)
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500; // Yeni kelimeye geçmeden önce kısa bekleme
    }

    // Döngüyü tekrar çağır
    setTimeout(function() {
        that.tick();
    }, delta);
};

// Sayfa Yüklendiğinde Başlat
window.addEventListener('load', function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
          new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }
});
  // ------------------------------------------------
});

