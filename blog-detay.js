document.addEventListener('DOMContentLoaded', () => {
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

    document.title = `${title} | Abdullah Cihan`;

    if (titleEl) titleEl.textContent = title;
    if (dateEl) dateEl.textContent = date;
    setCategoryBadge(category, catEl);

    // Kapak: icon url mi class mi?
    const rawIcon = post.icon || post.image || '';
    const iconUrl = String(rawIcon).includes('http') ? safeHttpUrl(rawIcon) : '';
    const iconCls = !iconUrl ? safeIconClass(rawIcon) : '';

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
  // 5) Scroll progress bar
  // ============================
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = scrolled + "%";
  });
});
