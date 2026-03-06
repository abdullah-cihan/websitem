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

  // ============================
  // Helpers (XSS azaltma)
  // ============================
  function escapeHTML(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // ==========================================
  // SHARE (X / LinkedIn / WhatsApp / Kopyala)
  // ==========================================
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title || 'Yazı');

  const xBtn = document.getElementById('share-x');
  const liBtn = document.getElementById('share-linkedin');
  const waBtn = document.getElementById('share-whatsapp');
  const copyBtn = document.getElementById('share-copy');

  const toast = document.getElementById('share-toast');
  const showShareToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__share_toast_t);
    window.__share_toast_t = setTimeout(() => toast.classList.remove('show'), 1600);
  };

  if (xBtn) {
    // X (Twitter) paylaşım URL
    xBtn.href = `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`;
  }

  if (liBtn) {
    // LinkedIn paylaşım URL
    liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
  }

  if (waBtn) {
    // WhatsApp paylaşım URL
    waBtn.href = `https://api.whatsapp.com/send?text=${pageTitle}%20-%20${pageUrl}`;
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showShareToast('✅ Link kopyalandı!');
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showShareToast('✅ Link kopyalandı!');
      }
    });
  }


  function safeHttpUrl(url) {
    try {
      const u = new URL(String(url || ''), window.location.origin);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
      return '';
    } catch {
      return '';
    }
  }

  function safeIconClass(cls) {
    const s = String(cls || '').trim();
    if (!s) return '';
    const ok = s.split(/\s+/).every(part =>
      /^fa(-[a-z]+)?$/.test(part) || /^fa-[a-z0-9-]+$/.test(part)
    );
    return ok ? s : '';
  }

  // Basit sanitizer: script/style/iframe vb kaldır + on* attribute temizle
  function sanitizeHtml(dirtyHtml) {
    const html = String(dirtyHtml || '');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // tehlikeli tagları sil
    const badTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
    badTags.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));

    // tehlikeli attributeleri temizle
    doc.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').toLowerCase();

        // onclick, onload...
        if (name.startsWith('on')) el.removeAttribute(attr.name);

        // javascript: / data: engelle
        if (name === 'href' || name === 'src') {
          if (value.startsWith('javascript:') || value.startsWith('data:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

    return doc.body.innerHTML;
  }

  function setCategoryBadge(category, catEl) {
    if (!catEl) return;
    const c = String(category || 'Genel');

    catEl.textContent = c;

    if (c === 'Python' || c === 'Yazılım' || c === 'OOP') catEl.className = 'category cat-blue';
    else if (c === 'Felsefe') catEl.className = 'category cat-purple';
    else if (c === 'Teknoloji' || c === 'Kariyer') catEl.className = 'category cat-green';
    else catEl.className = 'category cat-red';
  }

  // ============================
  // 1) ID parametresi
  // ============================
  const params = new URLSearchParams(window.location.search);
  const idRaw = params.get('id');
  const id = idRaw === null ? null : Number(idRaw);

  // ============================
  // 2) LocalStorage’dan yazıları çek
  // ============================
  let allPosts = [];
  try {
    const p = JSON.parse(localStorage.getItem('posts') || '[]');
    allPosts = Array.isArray(p) ? p : [];
  } catch {
    allPosts = [];
  }

  // allPosts index ile çalışıyoruz (senin index.html’deki link mantığı)
  let post = null;
  if (id !== null && Number.isFinite(id) && id >= 0 && id < allPosts.length) {
    const candidate = allPosts[id];

    // draft gösterme (status yoksa published kabul)
    const isPublished = candidate && (candidate.status === 'published' || candidate.status === undefined);
    if (isPublished) post = candidate;
  }

  // ============================
  // 3) DOM elementleri
  // ============================
  const titleEl = document.getElementById('detail-title');
  const dateEl = document.getElementById('detail-date');
  const catEl = document.getElementById('detail-category');
  const contentEl = document.getElementById('detail-content');

  const iconEl = document.getElementById('detail-icon'); // <i>
  const imgEl = document.getElementById('detail-img');   // <img>

  // ============================
  // 4) Render
  // ============================
  if (post) {
    const title = String(post.title || 'Başlıksız Yazı');
    const date = String(post.date || 'Tarih Yok');
    const category = String(post.category || 'Genel');
    const desc = String(post.summary || post.ozet || 'Ayrıntılar için tıklayın...'); // Use summary/ozet if available

    document.title = `${title} | Abdullah Cihan`;

    // Update Open Graph and Canonical tags dynamically
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-desc');
    const ogUrl = document.getElementById('og-url');
    const ogImage = document.getElementById('og-image');
    const canonicalUrl = document.getElementById('canonical-url');

    // Kapak: icon url mi class mi?
    const rawIcon = post.icon || post.image || '';
    const iconUrl = String(rawIcon).includes('http') ? safeHttpUrl(rawIcon) : '';
    const iconCls = !iconUrl ? safeIconClass(rawIcon) : '';

    if (ogTitle) ogTitle.setAttribute('content', title + ' | Abdullah Cihan');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);
    if (ogImage && iconUrl) ogImage.setAttribute('content', iconUrl);
    if (canonicalUrl) canonicalUrl.setAttribute('href', window.location.href);

    // Schema.org Article JSON-LD Data Population
    const jsonLdScript = document.getElementById('article-json-ld');
    if (jsonLdScript) {
      try {
        const schema = JSON.parse(jsonLdScript.textContent);
        schema.headline = title;
        schema.description = desc;
        if (iconUrl) {
          schema.image = [iconUrl];
        }
        schema.datePublished = date;
        jsonLdScript.textContent = JSON.stringify(schema, null, 2);
      } catch (err) {
        console.warn('JSON-LD update failed:', err);
      }
    }

    if (titleEl) titleEl.textContent = title;
    if (dateEl) dateEl.textContent = date;
    setCategoryBadge(category, catEl);

    if (iconUrl) {
      // Resim göster
      if (imgEl) {
        imgEl.src = iconUrl;
        imgEl.style.display = 'block';
      }
      if (iconEl) iconEl.style.display = 'none';
    } else {
      // İkon göster
      if (imgEl) imgEl.style.display = 'none';
      if (iconEl) {
        iconEl.style.display = 'inline-block';
        iconEl.className = iconCls || 'fa-solid fa-pen';
      }
    }

    // İçerik
    if (contentEl) {
      const html = post.content || '<p>Bu yazının içeriği hazırlanıyor...</p>';
      contentEl.innerHTML = sanitizeHtml(html);
    }
  } else {
    // 404
    document.title = "Yazı Bulunamadı | Abdullah Cihan";

    if (titleEl) titleEl.textContent = "Hata 404";
    if (dateEl) dateEl.style.display = "none";
    if (catEl) catEl.style.display = "none";

    // kapak alanını da temizle
    if (imgEl) imgEl.style.display = 'none';
    if (iconEl) iconEl.style.display = 'none';

    const articleBodySection = document.getElementById('article-body-section');
    if (articleBodySection) {
      articleBodySection.innerHTML = `
        <div class="container" style="display:flex; justify-content:center; align-items:center; min-height:400px;">
          <div class="glass" style="text-align:center; padding:50px; border-radius:20px; max-width:600px; width:100%;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 5rem; color: var(--primary); margin-bottom: 25px;"></i>
            <h2 style="font-size: 2rem; margin-bottom: 15px; color: var(--text-main); font-family: 'Space Grotesk';">
              Yazı Bulunamadı
            </h2>
            <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 1.1rem;">
              Aradığınız yazı mevcut değil, taslak olabilir veya silinmiş olabilir.
            </p>
            <a href="index.html#blog" class="btn-read-modern" style="display:inline-flex; justify-content:center; padding: 12px 30px; text-decoration:none;">
              <i class="fa-solid fa-arrow-left" style="margin-right: 10px;"></i> Blog'a Dön
            </a>
          </div>
        </div>
      `;
    }
  }

  // ============================
  // 5) Script.js'dekine benzer Dinamik Kategoriler (Sidebar)
  // ============================
  const renderSidebarCategories = () => {
    const listWidget = document.querySelector('.cat-list');
    if (!listWidget) return;

    const catCounts = {};
    allPosts.forEach(p => {
      // Sadece yayında olanları say
      if (p.status === 'published' || p.durum === 'yayında' || p.durum === 'Yayında' || p.status === undefined) {
        const cat = p.category || 'Genel';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    });

    listWidget.innerHTML = '';
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
      listWidget.innerHTML = '<li><span style="color:#94a3b8">Kategori bulunamadı</span></li>';
      return;
    }

    sortedCats.forEach(([cat, count]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `index.html?category=${encodeURIComponent(cat)}#blog`;
      a.textContent = cat + ' ';

      const span = document.createElement('span');
      span.textContent = `(${count})`;
      a.appendChild(span);

      li.appendChild(a);
      listWidget.appendChild(li);
    });
  };

  renderSidebarCategories();

  // ============================
  // 5.5) Benzer Yazılar (Related Posts)
  // ============================
  const renderRelatedPosts = () => {
    const relatedGrid = document.getElementById('related-posts-grid');
    if (!relatedGrid || !allPosts || allPosts.length === 0) return;

    // Yayında olan ve şu anki yazı olmayanları filtrele
    let otherPosts = allPosts.filter(p => {
      const isPub = (p.status === 'published' || p.durum === 'yayında' || p.durum === 'Yayında' || p.status === undefined);
      const isNotCurrent = p.id !== id;
      return isPub && isNotCurrent;
    });

    // Kategoriye göre ayır
    const currentCategory = post ? (post.category || 'Genel') : 'Genel';
    let sameCategoryPosts = otherPosts.filter(p => (p.category || 'Genel') === currentCategory);
    let diffCategoryPosts = otherPosts.filter(p => (p.category || 'Genel') !== currentCategory);

    // İki listeyi de yeniden eskiye sırala
    sameCategoryPosts.sort((a, b) => b.id - a.id);
    diffCategoryPosts.sort((a, b) => b.id - a.id);

    // Aynı kategoriden öncelikli olarak al, eksik kalırsa diğerlerinden tamamla
    let related = [...sameCategoryPosts, ...diffCategoryPosts].slice(0, 2);

    if (related.length === 0) {
      document.getElementById('related-posts-section').style.display = 'none';
      return;
    }

    related.forEach(rp => {
      const rawTitle = rp.title || 'Başlıksız Yazı';
      const rawCategory = rp.category || 'Genel';
      const rawDate = rp.date || 'Tarih Yok';
      const rawIcon = rp.icon || rp.image || '';

      const realIndex = allPosts.indexOf(rp);
      const articleUrl = `blog-detay.html?id=${realIndex}`;

      // Kart HTML'i (index.html'deki blog-card yapısı)
      const articleEl = document.createElement('article');
      articleEl.className = 'blog-card glass hidden show'; // show class direkt ekli (animasyon olmadan görünür)

      let thumbHtml = '';
      if (rawIcon && String(rawIcon).includes('http')) {
        thumbHtml = `<img src="${safeHttpUrl(rawIcon)}" alt="${sanitizeHtml(rawTitle)}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        const iCls = safeIconClass(rawIcon) || 'fa-solid fa-pen';
        thumbHtml = `<i class="${iCls}"></i>`;
      }

      // Kategori Rengi Belirleme
      const catLower = rawCategory.toLowerCase();
      let catClass = 'cat-blue';
      if (catLower.includes('python')) catClass = 'cat-purple';
      else if (catLower.includes('video')) catClass = 'cat-red';
      else if (catLower.includes('felsefe')) catClass = 'cat-green';

      const shortTitle = rawTitle.length > 50 ? rawTitle.substring(0, 47) + '...' : rawTitle;

      articleEl.innerHTML = `
        <div class="blog-thumb ${catClass.replace('cat-', 'thumb-')}">
            ${thumbHtml}
        </div>
        <div class="blog-content">
            <div class="meta">
                <span class="category ${catClass}">${sanitizeHtml(rawCategory)}</span>
                <span class="date"><i class="fa-regular fa-calendar-days"></i> ${sanitizeHtml(rawDate)}</span>
            </div>
            <h3>${sanitizeHtml(shortTitle)}</h3>
            <a href="${articleUrl}" class="btn-read-modern">Yazıya Git <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      `;

      relatedGrid.appendChild(articleEl);
    });
  };

  renderRelatedPosts();

  // ============================
  // 6) Scroll progress bar
  // ============================
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = scrolled + "%";
  });
});
