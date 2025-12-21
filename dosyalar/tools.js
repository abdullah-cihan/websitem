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
    } catch {}

    return '';
  };

  const tools = readArrayLS('siteTools'); // admin-tools.js buraya yazıyor

  container.innerHTML = '';

  if (!tools.length) {
    container.innerHTML = `
      <div class="tool-empty">
        Henüz araç eklenmedi.
      </div>
    `;
    return;
  }

  const list = document.createElement('div');
  list.className = 'tools-list';

  tools.forEach((t) => {
    const title = String(t?.title || '').trim();
    const icon = safeIconClass(t?.icon) || 'fa-solid fa-toolbox';
    const href = safeLink(t?.link);

    if (!title || !href) return;

    const a = document.createElement('a');
    a.className = 'tool-item';
    a.href = href;

    // dış linkse yeni sekme
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    a.innerHTML = `
      <i class="${icon}"></i>
      <span>${title}</span>
    `;

    list.appendChild(a);
  });

  // hepsi filtrelenirse boş kalmasın
  if (!list.children.length) {
    container.innerHTML = `<div class="tool-empty">Araç verisi var ama link/başlık hatalı.</div>`;
    return;
  }

  container.appendChild(list);
});
