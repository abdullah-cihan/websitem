/* tool-view.js */

document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Helpers
  // =========================
  const readArrayLS = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const normalizeId = (v) => {
    // URL parametresi encode edilmiş olabilir
    let s = String(v || '');
    try { s = decodeURIComponent(s); } catch {}
    s = s.trim();

    // basit temizlik (id'ler zaten Date.now() stringi)
    // harf/rakam/_/- dışında karakterleri at
    s = s.replace(/[^a-zA-Z0-9_-]/g, '');
    return s;
  };

  const showError = (msg) => {
    const frame = document.getElementById('tool-frame');
    if (frame) frame.style.display = 'none';

    // aynı hata ekranını 2 kez basma
    if (document.querySelector('.error-container')) return;

    const wrap = document.createElement('div');
    wrap.className = 'error-container';

    const icon = document.createElement('div');
    icon.className = 'error-icon';
    icon.textContent = '⚠️';

    const title = document.createElement('h1');
    title.className = 'error-title';
    title.textContent = 'Sayfa Bulunamadı';

    const text = document.createElement('p');
    text.className = 'error-text';
    text.textContent = msg;

    const btn = document.createElement('a');
    btn.href = 'index.html';
    btn.className = 'back-home-btn';
    btn.style.position = 'static';
    btn.style.display = 'inline-flex';
    btn.textContent = 'Ana Sayfaya Dön';

    wrap.appendChild(icon);
    wrap.appendChild(title);
    wrap.appendChild(text);
    wrap.appendChild(document.createElement('br'));
    wrap.appendChild(btn);

    document.body.appendChild(wrap);
  };

  const addBackButton = () => {
    if (document.querySelector('.back-home-btn')) return;

    const backBtn = document.createElement('a');
    backBtn.href = 'index.html';
    backBtn.className = 'back-home-btn';
    backBtn.textContent = '← Siteye Dön';
    document.body.appendChild(backBtn);
  };

  // =========================
  // 1) URL parametreleri
  // =========================
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('page') || params.get('id');
  const targetId = normalizeId(raw);

  if (!targetId) {
    showError('Geçersiz bağlantı. "page" veya "id" parametresi bulunamadı.');
    return;
  }

  // =========================
  // 2) verileri çek
  // =========================
  const customPages = readArrayLS('customPages');
  const customTools = readArrayLS('customTools');

  // =========================
  // 3) kaydı bul
  // =========================
  const data =
    customPages.find(p => String(p?.id) === targetId) ||
    customTools.find(t => String(t?.id) === targetId);

  const frame = document.getElementById('tool-frame');

  if (!frame) {
    showError('Görüntüleyici yüklenemedi. Iframe bulunamadı.');
    return;
  }

  if (!data || !data.code) {
    showError('Aradığınız araç veya sayfa silinmiş olabilir. Lütfen bağlantıyı kontrol edin.');
    return;
  }

  // =========================
  // 4) yükle
  // =========================
  document.title = String(data.title || data.name || 'Araç Görüntüleme');
  frame.srcdoc = String(data.code);

  addBackButton();
});
