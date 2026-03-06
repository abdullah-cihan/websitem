// ==========================================
// DARK / LIGHT MODE TOGGLE (Sayfa yüklenmeden önce, FOUC önleme)
// ==========================================
(function () {
  const saved = localStorage.getItem('siteTheme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

document.addEventListener('DOMContentLoaded', () => {

  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    // Mevcut temaya göre ikonu ayarla
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = themeToggleBtn.querySelector('i');
    if (currentTheme === 'light' && icon) {
      icon.className = 'fa-solid fa-sun';
    }

    themeToggleBtn.addEventListener('click', () => {
      const icon = themeToggleBtn.querySelector('i');
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('siteTheme', 'dark');
        if (icon) icon.className = 'fa-solid fa-moon';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('siteTheme', 'light');
        if (icon) icon.className = 'fa-solid fa-sun';
      }
    });
  }

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

  let activeCategoryFilter = new URLSearchParams(window.location.search).get('category') || null;
  let currentSearchQuery = '';

  // Tarih Formatlayıcı (Örn: "23 Ocak 2026 12:40")
  const formatDateTR = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // Tahmini Okuma Süresi
  const getReadTime = (content) => {
    if (!content) return "1 dk okuma";
    const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} dk okuma`;
  };

  const renderPosts = () => {
    // Sadece "published" olanlar
    let blogPosts = allPosts.filter(post =>
      post && (post.status === 'published' || post.status === undefined || post.durum === 'yayında' || post.durum === 'Yayında')
    );

    const featuredContainer = document.getElementById('featured-container');
    const standardContainer = document.getElementById('standard-container');

    if (!featuredContainer || !standardContainer) return;

    featuredContainer.innerHTML = '';
    standardContainer.innerHTML = '';

    renderCategories(blogPosts);

    // Filtreleme
    let filteredPosts = blogPosts;

    if (activeCategoryFilter) {
      filteredPosts = filteredPosts.filter(post => post.category === activeCategoryFilter);
    }

    if (currentSearchQuery) {
      const sq = currentSearchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        (post.title && post.title.toLowerCase().includes(sq)) ||
        (post.desc && post.desc.toLowerCase().includes(sq)) ||
        (post.category && post.category.toLowerCase().includes(sq))
      );
    }

    // Filtre veya arama bilgisi
    const filterContainer = document.getElementById('filter-info-container') || document.createElement('div');
    filterContainer.id = 'filter-info-container';
    filterContainer.style.width = '100%';
    filterContainer.style.marginBottom = '20px';

    if (activeCategoryFilter || currentSearchQuery) {
      filterContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(59,130,246,0.1); padding:15px 20px; border-radius:12px; border:1px solid rgba(59,130,246,0.2);">
          <span style="color:#f8fafc; font-weight:600;"><i class="fa-solid fa-filter" style="color:#3b82f6; margin-right:8px;"></i> ${activeCategoryFilter ? `<b>${escapeHTML(activeCategoryFilter)}</b> kategorisi. ` : ''} ${currentSearchQuery ? `<b>"${escapeHTML(currentSearchQuery)}"</b> araması. ` : ''} (${filteredPosts.length} sonuç)</span>
          <a href="#" id="clear-filters-btn" style="color:#ef4444; font-size:0.9rem; text-decoration:none; font-weight:600;"><i class="fa-solid fa-xmark"></i> Temizle</a>
        </div>
      `;
      if (!document.getElementById('filter-info-container')) {
        featuredContainer.parentNode.insertBefore(filterContainer, featuredContainer);
      }

      const clearBtn = filterContainer.querySelector('#clear-filters-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          activeCategoryFilter = null;
          currentSearchQuery = '';
          const searchInput = document.getElementById('blog-search');
          if (searchInput) searchInput.value = '';
          // URL'den de sil
          window.history.replaceState({}, document.title, window.location.pathname);
          renderPosts();
        });
      }
    } else {
      filterContainer.innerHTML = '';
    }

    if (filteredPosts.length === 0) {
      const p = document.createElement('p');
      p.style.color = 'white';
      p.style.opacity = '0.7';
      p.textContent = 'Aramanıza uygun yazı bulunamadı.';
      standardContainer.appendChild(p);
    } else {
      filteredPosts.forEach((post) => {
        const realIndex = allPosts.indexOf(post);
        const card = createPostCard(post, realIndex);

        // Eğer arama veya filtre varsa hepsini standarda diz (tasarım bozulmaması için)
        // Yoksa featured ve standard olarak ayır
        const isFeaturedPost = post.isFeatured || post.one_cikan === "Evet" || post.one_cikan === true;

        if (isFeaturedPost && !activeCategoryFilter && !currentSearchQuery) {
          featuredContainer.appendChild(card);
        } else {
          standardContainer.appendChild(card);
        }
      });
    }

    // Animasyonlar
    setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('show');
        });
      });
      document.querySelectorAll('.blog-card.hidden').forEach((el) => observer.observe(el));
    }, 50);
  };

  // Live Search Event Listener
  const searchInput = document.getElementById('blog-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      renderPosts();
    });
  }

  // ==========================================
  // 2. KATEGORİ HTML RENDER VE PILLS
  // ==========================================
  const renderCategories = (postsArray) => {
    const listWidget = document.getElementById('category-list-widget');
    const pillsContainer = document.getElementById('category-pills-container');

    if (!listWidget && !pillsContainer) return;

    const catCounts = {};
    postsArray.forEach(post => {
      const cat = post.category || 'Genel';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

    // Sidebar list
    if (listWidget) {
      listWidget.innerHTML = '';
      if (sortedCats.length === 0) {
        listWidget.innerHTML = '<li><span style="color:#94a3b8">Kategori bulunamadı</span></li>';
      } else {
        sortedCats.forEach(([cat, count]) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#blog`;
          a.textContent = cat + ' ';

          if (cat === activeCategoryFilter) a.style.color = 'var(--primary)';

          const span = document.createElement('span');
          span.textContent = `(${count})`;
          a.appendChild(span);

          a.addEventListener('click', (e) => {
            e.preventDefault();
            activeCategoryFilter = cat;
            window.history.replaceState({}, '', `?category=${encodeURIComponent(cat)}#blog`);
            renderPosts();
          });

          li.appendChild(a);
          listWidget.appendChild(li);
        });
      }
    }

    // Top Pills
    if (pillsContainer) {
      pillsContainer.innerHTML = '';

      const allPill = document.createElement('div');
      allPill.className = `cat-pill ${!activeCategoryFilter ? 'active' : ''}`;
      allPill.textContent = 'Tümü';
      allPill.addEventListener('click', () => {
        activeCategoryFilter = null;
        window.history.replaceState({}, '', window.location.pathname + '#blog');
        renderPosts();
      });
      pillsContainer.appendChild(allPill);

      sortedCats.forEach(([cat, count]) => {
        const pill = document.createElement('div');
        pill.className = `cat-pill ${activeCategoryFilter === cat ? 'active' : ''}`;
        pill.textContent = cat;
        pill.addEventListener('click', () => {
          activeCategoryFilter = cat;
          window.history.replaceState({}, '', `?category=${encodeURIComponent(cat)}#blog`);
          renderPosts();
        });
        pillsContainer.appendChild(pill);
      });
    }
  };

  // ==========================================
  // 3. HTML RENDER (Güvenli)
  // ==========================================

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
    const isFiltering = activeCategoryFilter !== null || currentSearchQuery !== '';

    const card = document.createElement('article');
    // Filtreleme aktifse featured sınıfını ekleme (hepsi standart görünsün)
    card.className = (isFeatured && !isFiltering) ? 'blog-card featured-card glass hidden' : 'blog-card glass hidden';

    const thumb = document.createElement('div');
    thumb.className = `blog-thumb ${getThumbColor(post.category)}`;

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
    // Formatlı tarih ve okuma süresi
    dateSpan.innerHTML = `<i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${formatDateTR(post.date)} <span style="margin:0 5px; opacity:0.5;">•</span> <i class="fa-regular fa-clock" style="margin-right:4px;"></i>${getReadTime(post.content)}`;

    meta.appendChild(catSpan);
    meta.appendChild(dateSpan);

    const h3 = document.createElement('h3');
    h3.textContent = String(post.title || '');

    content.appendChild(meta);
    content.appendChild(h3);

    // Açıklama
    if (post.desc && (isFeatured || isFiltering)) {
      const p = document.createElement('p');
      p.textContent = String(post.desc || '');
      content.appendChild(p);
    }

    if (post.linkType === 'external') {
      const safeUrl = safeHttpUrl(post.url);
      if (safeUrl) {
        const a = document.createElement('a');
        a.href = safeUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn-read-modern';
        a.innerHTML = 'İzle <i class="fa-solid fa-play"></i>';
        content.appendChild(a);
      }
    } else {
      const a = document.createElement('a');
      a.href = `blog-detay.html?id=${encodeURIComponent(String(realIndex))}`;
      a.className = 'btn-read-modern';
      a.innerHTML = (isFeatured && !isFiltering) ? 'Devamını Oku <i class="fa-solid fa-arrow-right"></i>' : 'Oku <i class="fa-solid fa-arrow-right"></i>';
      content.appendChild(a);
    }

    card.appendChild(thumb);
    card.appendChild(content);

    return card;
  };

  const renderSkeletons = () => {
    const container = document.getElementById('featured-container');
    const stdContainer = document.getElementById('standard-container');
    if (!container || !stdContainer) return;

    container.innerHTML = '';
    stdContainer.innerHTML = '';

    const createSkeleton = () => {
      return `
        <article class="blog-card glass">
          <div class="skeleton-thumb skeleton"></div>
          <div class="blog-content">
            <div class="meta" style="margin-bottom:15px">
              <div class="skeleton skeleton-text" style="width:50px; height:20px; border-radius:10px;"></div>
              <div class="skeleton skeleton-text" style="width:100px; height:20px; border-radius:10px;"></div>
            </div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text" style="height:40px; border-radius:10px; margin-top:15px; width:100%;"></div>
          </div>
        </article>
      `;
    };

    container.innerHTML = createSkeleton() + createSkeleton();
    stdContainer.innerHTML = createSkeleton() + createSkeleton() + createSkeleton();
  };

  // Cache'den ilk (varsa) gösterim, yoksa skeleton göster
  if (allPosts && allPosts.length > 0) {
    renderPosts();
  } else {
    renderSkeletons();
  }

  // Sunucudan (Google Sheets) en güncel halini çek
  const fetchFromServer = async () => {
    try {
      const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
      if (!apiUrl) return;

      const res = await fetch(`${apiUrl}?type=posts`);
      const data = await res.json();
      if (data.ok && data.posts) {
        // API Formatını Local Formata Uyarla
        const formattedPosts = data.posts.map(p => ({
          id: p.id,
          title: p.baslik,
          desc: p.ozet,
          content: p.icerik,
          date: p.tarih,
          category: p.kategori,
          status: p.durum === 'Yayında' ? 'published' : (p.durum || 'draft'),
          icon: p.resim,
          isFeatured: p.one_cikan === true || p.one_cikan === "Evet",
          linkType: 'internal'
        }));

        // Güncel veriyi kaydet ve render et
        localStorage.setItem('posts', JSON.stringify(formattedPosts));
        allPosts = formattedPosts;
        renderPosts(allPosts);
      }
    } catch (err) {
      console.warn("Sunucudan yazılar çekilemedi, yerel önbellek gösteriliyor.");
    }
  };

  fetchFromServer();

  // ==========================================
  // 2b. PROJELERİ ÇEK VE RENDER ET
  // ==========================================
  const fetchProjects = async () => {
    const container = document.getElementById('projects-container');
    if (!container) return;

    // Fallback projeler (API başarısız olursa)
    const fallbackProjects = [
      { baslik: 'Auto YBS Bot', aciklama: 'Yönetim Bilişim Sistemleri verilerini analiz eden ve otomatik rapor çıkaran Python tabanlı bot yazılımı.', ikon: 'fa-solid fa-robot', renk: '#38bdf8', etiketler: 'Python,Selenium', github_link: '#', demo_link: '' },
      { baslik: 'Modern Blog CMS', aciklama: 'Google Apps Script (Code.gs) ve Vanilla JS kullanarak geliştirilmiş, Glassmorphism temalı, tam teşekküllü dinamik içerik yönetim sistemi.', ikon: 'fa-brands fa-js', renk: '#f7df1e', etiketler: 'JavaScript,CSS3,Code.gs', github_link: '#', demo_link: '#' },
      { baslik: 'Video Kurgu Şablonu', aciklama: 'Hızlı ve etkili YouTube teknoloji videoları kurgulamak için hazırlanmış Premiere Pro ve After Effects otomatik projeleri.', ikon: 'fa-solid fa-video', renk: '#ef4444', etiketler: 'Premiere,VFX', github_link: '', demo_link: '' }
    ];

    const renderProjects = (projects) => {
      if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:30px; color:var(--text-muted);">Henüz proje eklenmemiş.</div>';
        return;
      }

      container.innerHTML = projects.map(p => {
        const tags = String(p.etiketler || '').split(',').filter(Boolean).map(t =>
          `<span>${t.trim()}</span>`
        ).join('');

        const links = [];
        links.push(`<a href="proje-detay.html?id=${p.id || p.baslik}" class="btn-read-modern">İncele <i class="fa-solid fa-arrow-right"></i></a>`);
        if (p.github_link) links.push(`<a href="${p.github_link}" class="github-link" target="_blank"><i class="fa-brands fa-github"></i></a>`);

        return `<div class="glass project-card">
          <div class="project-img" style="color: ${p.renk || '#38bdf8'};">
            <i class="${p.ikon || 'fa-solid fa-code'}"></i>
          </div>
          <div class="project-info">
            <h3>${p.baslik}</h3>
            <p>${p.aciklama || ''}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-links">${links.join('')}</div>
          </div>
        </div>`;
      }).join('');

      // Render sonrası görünür yap (IntersectionObserver kaçırmış olabilir)
      container.classList.add('show');
    };

    try {
      const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
      const res = await fetch(`${apiUrl}?type=projects`);
      const data = await res.json();
      if (data.ok && data.projects && data.projects.length > 0) {
        renderProjects(data.projects);
      } else {
        renderProjects(fallbackProjects);
      }
    } catch (err) {
      console.warn("Projeler API'den çekilemedi, fallback gösteriliyor.");
      renderProjects(fallbackProjects);
    }
  };

  fetchProjects();

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
