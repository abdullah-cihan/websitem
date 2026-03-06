/* tools.js - Hızlı Araçlar Sidebar */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tools-list-container');
  if (!container) return; // index.html içinde yoksa çık

  const readArrayLS = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const safeIconClass = (cls) => {
    const s = String(cls || '').trim();
    if (!s) return '';
    const ok = s.split(/\s+/).every(part =>
      /^fa(-[a-z]+)?$/.test(part) || /^fa-[a-z0-9-]+$/.test(part)
    );
    return ok ? s : '';
  };

  const safeLink = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return '';

    // javascript: engelle
    if (/^\s*javascript:/i.test(s)) return '';

    // # anchor / relatif link / html sayfa / tool-view linkleri serbest
    if (s.startsWith('#')) return s;
    if (/^[a-zA-Z0-9_\-./?=&%]+$/.test(s)) return s;

    // http/https ise de izin ver
    try {
      const u = new URL(s);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    } catch { }

    return '';
  };

  const renderTools = (toolsList) => {
    container.innerHTML = '';

    if (!toolsList.length) {
      container.innerHTML = `
        <div class="tool-empty" style="color:#94a3b8; font-size:0.9rem;">
          Henüz araç eklenmedi.
        </div>
      `;
      return;
    }

    const list = document.createElement('div');
    list.className = 'tools-list';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '10px';

    toolsList.forEach((t) => {
      const title = String(t?.title || '').trim();
      const icon = safeIconClass(t?.icon) || 'fa-solid fa-toolbox';
      const href = safeLink(t?.link);

      if (!title || !href) return;

      const a = document.createElement('a');
      a.className = 'tool-item';
      a.href = href;
      a.style.display = 'flex';
      a.style.alignItems = 'center';
      a.style.gap = '10px';
      a.style.padding = '8px 12px';
      a.style.borderRadius = '8px';
      a.style.color = '#cbd5e1';
      a.style.textDecoration = 'none';
      a.style.transition = 'all 0.3s ease';
      a.style.background = 'rgba(255,255,255,0.03)';

      a.addEventListener('mouseenter', () => {
        a.style.background = 'rgba(56, 189, 248, 0.1)';
        a.style.color = '#38bdf8';
        a.style.transform = 'translateX(5px)';
      });
      a.addEventListener('mouseleave', () => {
        a.style.background = 'rgba(255,255,255,0.03)';
        a.style.color = '#cbd5e1';
        a.style.transform = 'translateX(0)';
      });

      // dış linkse yeni sekme
      const isExternal = /^https?:\/\//i.test(href);
      if (isExternal) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      a.innerHTML = `
        <i class="${icon}"></i>
        <span style="font-weight: 500; font-size: 0.95rem;">${title}</span>
      `;

      list.appendChild(a);
    });

    // hepsi filtrelenirse boş kalmasın
    if (!list.children.length) {
      container.innerHTML = `<div class="tool-empty" style="color:#94a3b8; font-size:0.9rem;">Geçerli araç bulunamadı.</div>`;
      return;
    }

    container.appendChild(list);
  };

  // Çark yüklemesi
  container.innerHTML = '<div style="color:#94a3b8; font-size:0.9rem;"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...</div>';

  // 1. Önce LocalStorage'dan yükle
  const localTools = readArrayLS('siteTools');
  if (localTools.length > 0) {
    renderTools(localTools);
  }

  // 2. Sonra Sunucudan (Google Sheets) Çek
  const fetchFromServer = async () => {
    try {
      const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
      if (!apiUrl) return;

      const res = await fetch(`${apiUrl}?type=tools`);
      const data = await res.json();
      if (data.ok && data.tools) {
        // Map db format to local format
        const formattedTools = data.tools.map(t => ({
          title: t.baslik,
          icon: t.ikon,
          link: t.link
        }));

        localStorage.setItem('siteTools', JSON.stringify(formattedTools));
        renderTools(formattedTools);
      }
    } catch (err) {
      console.warn("Sunucudan araçlar çekilemedi, yerel önbellek gösteriliyor.");
      if (localTools.length === 0) {
        container.innerHTML = '<div style="color:#ef4444; font-size:0.9rem;">Bağlantı hatası.</div>';
      }
    }
  };

  fetchFromServer();
});
