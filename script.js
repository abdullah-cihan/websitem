document.addEventListener('DOMContentLoaded', async () => {

  // ✅ SENİN YENİ API URL'İN
  const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

  // ==========================================
  // 0. GÜVENLİK VE YARDIMCILAR
  // ==========================================
  const escapeHTML = (str) => {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  const safeHttpUrl = (url) => {
    try {
      const u = new URL(String(url || ''), window.location.origin);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
      return '';
    } catch {
      return '';
    }
  };

  const safeIconClass = (cls) => {
    const s = String(cls || '').trim();
    if (!s) return '';
    // FontAwesome benzeri: fa-solid fa-pen / fa-brands fa-python
    const ok = s.split(/\s+/).every(part =>
      /^fa(-[a-z]+)?$/.test(part) || /^fa-[a-z0-9-]+$/.test(part)
    );
    return ok ? s : '';
  };

  const getCatColor = (cat) => {
    if (cat === 'Python' || cat === 'Yazılım' || cat === 'OOP') return 'cat-blue';
    if (cat === 'Felsefe') return 'cat-purple';
    if (cat === 'Teknoloji' || cat === 'Kariyer') return 'cat-green';
    return 'cat-red';
  };

  const getThumbColor = (cat) => {
    if (cat === 'Felsefe') return 'thumb-purple';
    if (cat === 'Teknoloji' || cat === 'Kariyer') return 'thumb-green';
    if (cat === 'Video') return 'thumb-red';
    return '';
  };

  // ==========================================
  // 1. HTML ELEMENTLERİ VE YÜKLENİYOR DURUMU
  // ==========================================
  const featuredContainer = document.getElementById('featured-container');
  const standardContainer = document.getElementById('standard-container');

  if (standardContainer) {
    standardContainer.innerHTML = '<div style="text-align:center; color:white; padding:20px; opacity:0.8;">Veriler yükleniyor...</div>';
  }

  // ==========================================
  // 2. VERİLERİ API'DEN ÇEK
  // ==========================================
  let blogPosts = [];
  
  try {
    const response = await fetch(`${API_URL}?type=posts`);
    const data = await response.json();
    const rawPosts = data.posts || [];

    // Veritabanı anahtarlarını (baslik, ozet vs.) önyüz formatına çevir
    // Ve sadece yayında olanları filtrele
    blogPosts = rawPosts
      .filter(p => !p.durum || p.durum === 'Yayında' || p.durum === 'published')
      .map(p => ({
        id: p.id,
        title: p.baslik,
        desc: p.ozet,
        date: p.tarih ? new Date(p.tarih).toLocaleDateString('tr-TR') : '',
        category: p.kategori,
        icon: p.resim, // Resim URL veya İkon sınıfı burada
        isFeatured: p.one_cikan === true || String(p.one_cikan).toLowerCase() === 'true',
        linkType: 'internal' // İleride dış link eklersen burayı güncellersin
      }));

  } catch (error) {
    console.error("Veri çekme hatası:", error);
    if (standardContainer) {
      standardContainer.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Veriler yüklenemedi. İnternet bağlantınızı kontrol edin.</div>';
    }
  }

  // ==========================================
  // 3. KARTLARI OLUŞTUR VE YERLEŞTİR
  // ==========================================
  const createPostCard = (post) => {
    const isFeatured = post.isFeatured;

    const card = document.createElement('article');
    card.className = isFeatured ? 'blog-card featured-card glass hidden' : 'blog-card glass hidden';

    const thumb = document.createElement('div');
    thumb.className = `blog-thumb ${getThumbColor(post.category)}`;

    // ikon mu resim mi?
    const iconRaw = String(post.icon || '');
    const iconUrl = iconRaw.includes('http') ? safeHttpUrl(iconRaw) : '';
    const iconCls = !iconUrl ? safeIconClass(iconRaw) : '';

    if (iconUrl) {
      thumb.style.background = 'none';
      thumb.style.padding = '0';
      const img = document.createElement('img');
      img.src = iconUrl;
      img.alt = 'thumbnail';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '12px';
      thumb.appendChild(img);
    } else {
      const i = document.createElement('i');
      i.className = iconCls || 'fa-solid fa-pen'; // Varsayılan ikon
      thumb.appendChild(i);
    }

    const content = document.createElement('div');
    content.className = 'blog-content';

    const meta = document.createElement('div');
    meta.className = 'meta';

    const catSpan = document.createElement('span');
    catSpan.className = `category ${getCatColor(post.category)}`;
    catSpan.textContent = String(post.category || 'Genel');

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = String(post.date || '');

    meta.appendChild(catSpan);
    meta.appendChild(dateSpan);

    const h3 = document.createElement('h3');
    h3.textContent = String(post.title || '');

    content.appendChild(meta);
    content.appendChild(h3);

    // Featured ise özet göster
    if (post.desc && isFeatured) {
      const p = document.createElement('p');
      p.textContent = String(post.desc || '');
      content.appendChild(p);
    }

    // Buton
    const a = document.createElement('a');
    // ID ile linkleme
    a.href = `blog-detay.html?id=${encodeURIComponent(post.id)}`;
    a.className = 'btn-read-modern';
    a.textContent = isFeatured ? 'Devamını Oku ' : 'Oku ';
    
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-arrow-right';
    a.appendChild(icon);
    
    content.appendChild(a);

    card.appendChild(thumb);
    card.appendChild(content);

    return card;
  };

  if (featuredContainer && standardContainer) {
    // İçerikleri temizle (Loading yazısını kaldır)
    featuredContainer.innerHTML = '';
    standardContainer.innerHTML = '';

    if (blogPosts.length === 0) {
      standardContainer.innerHTML = '<p style="color:white; opacity:0.7; text-align:center;">Henüz yayınlanmış bir yazı yok.</p>';
    } else {
      blogPosts.forEach((post) => {
        const card = createPostCard(post);
        if (post.isFeatured) {
          featuredContainer.appendChild(card);
        } else {
          standardContainer.appendChild(card);
        }
      });
    }
  }

  // ==========================================
  // 4. EFEKTLER (Scroll, Menu, Typewriter)
  // ==========================================
  
  // Scroll Reveal (Animasyon)
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));
  }, 100);

  // Mobil Menü
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Scroll Bar & Top Button
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar && scrollHeight > 0) progressBar.style.width = (scrollTop / scrollHeight) * 100 + "%";

    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      if (scrollTop > 300) backToTop.classList.add('active');
      else backToTop.classList.remove('active');
    }
  });

  // Daktilo Efekti
  const TxtType = function (el, toRotate, period) {
    this.toRotate = Array.isArray(toRotate) ? toRotate : [];
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.isDeleting = false;
    this.wrap = document.createElement('span');
    this.wrap.className = 'wrap';
    this.el.textContent = '';
    this.el.appendChild(this.wrap);
    this.tick();
  };

  TxtType.prototype.tick = function () {
    if (!this.toRotate.length) return;
    const i = this.loopNum % this.toRotate.length;
    const fullTxt = String(this.toRotate[i] || '');

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

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

  const elements = document.getElementsByClassName('typewrite');
  for (let i = 0; i < elements.length; i++) {
    const toRotateStr = elements[i].getAttribute('data-type');
    const period = elements[i].getAttribute('data-period');
    if (!toRotateStr) continue;
    try {
      const parsed = JSON.parse(toRotateStr);
      new TxtType(elements[i], parsed, period);
    } catch (e) {}
  }

});
