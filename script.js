document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 0. XSS azaltmak için yardımcılar
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

  // ==========================================
  // 1. VERİLERİ ÇEK VE FİLTRELE
  // ==========================================
  let allPosts = [];
  try {
    allPosts = JSON.parse(localStorage.getItem('posts') || '[]');
    if (!Array.isArray(allPosts)) allPosts = [];
  } catch {
    allPosts = [];
  }

  // Sadece "published" olanlar (status yoksa eski veri => published say)
  const blogPosts = allPosts.filter(post =>
    post && (post.status === 'published' || post.status === undefined)
  );

  // ==========================================
  // 2. HTML RENDER (Güvenli)
  // ==========================================
  const featuredContainer = document.getElementById('featured-container');
  const standardContainer = document.getElementById('standard-container');

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

  const createPostCard = (post, realIndex) => {
    const isFeatured = !!post.isFeatured;

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
      i.className = iconCls || 'fa-solid fa-pen';
      thumb.appendChild(i);
    }

    const content = document.createElement('div');
    content.className = 'blog-content';

    const meta = document.createElement('div');
    meta.className = 'meta';

    const catSpan = document.createElement('span');
    catSpan.className = `category ${getCatColor(post.category)}`;
    catSpan.textContent = String(post.category || '');

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = String(post.date || '');

    meta.appendChild(catSpan);
    meta.appendChild(dateSpan);

    const h3 = document.createElement('h3');
    h3.textContent = String(post.title || '');

    content.appendChild(meta);
    content.appendChild(h3);

    // Featured ise desc göster
    if (post.desc && isFeatured) {
      const p = document.createElement('p');
      p.textContent = String(post.desc || '');
      content.appendChild(p);
    }

    // Buton (external / internal)
    if (post.linkType === 'external') {
      const safeUrl = safeHttpUrl(post.url);
      if (safeUrl) {
        const a = document.createElement('a');
        a.href = safeUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn-read-modern';
        a.textContent = 'İzle ';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-play';
        a.appendChild(icon);
        content.appendChild(a);
      }
    } else {
      const a = document.createElement('a');
      a.href = `blog-detay.html?id=${encodeURIComponent(String(realIndex))}`;
      a.className = 'btn-read-modern';
      a.textContent = isFeatured ? 'Devamını Oku ' : 'Oku ';
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-arrow-right';
      a.appendChild(icon);
      content.appendChild(a);
    }

    card.appendChild(thumb);
    card.appendChild(content);

    return card;
  };

  if (featuredContainer && standardContainer) {
    featuredContainer.textContent = '';
    standardContainer.textContent = '';

    if (blogPosts.length === 0) {
      const p = document.createElement('p');
      p.style.color = 'white';
      p.style.opacity = '0.7';
      p.textContent = 'Henüz yayınlanmış bir yazı yok.';
      standardContainer.appendChild(p);
    } else {
      blogPosts.forEach((post) => {
        const realIndex = allPosts.indexOf(post);
        const card = createPostCard(post, realIndex);

        if (post.isFeatured) featuredContainer.appendChild(card);
        else standardContainer.appendChild(card);
      });
    }
  }

  // ==========================================
  // 3. STANDART ÖZELLİKLER (Menu, Scroll vb.)
  // ==========================================
  // Scroll Reveal
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    });
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

  // Daktilo Efekti (XSS-safe)
  const TxtType = function (el, toRotate, period) {
    this.toRotate = Array.isArray(toRotate) ? toRotate : [];
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.isDeleting = false;

    // güvenli span
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

    // ✅ innerHTML yok
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
    } catch {
      // data-type bozuksa hiçbir şey yapma
    }
  }
});
