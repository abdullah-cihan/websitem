document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // 0) GÜVENLİK KONTROLÜ (Client-side / UX)
  // ============================================
  const now = Date.now();
  const token = sessionStorage.getItem('adminToken');
  const exp = Number(sessionStorage.getItem('adminTokenExp') || '0');

  if (!token || exp <= now) {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminTokenExp');
    window.location.href = 'login.html';
    return;
  }

  // ============================================
  // CORE HELPERS (diğer modüller buradan kullanır)
  // ============================================
  function escapeHTML(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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

  function readArrayLS(key, fallback = []) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(raw) ? raw : fallback;
    } catch {
      return fallback;
    }
  }

  function writeLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Modüllerin ortak kullanımı için tek namespace
  window.AdminCore = {
    escapeHTML,
    safeHttpUrl,
    safeIconClass,
    readArrayLS,
    writeLS,
  };

  // ============================================
  // TOAST - TEK ve XSS-SAFE
  // ============================================
  window.showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.style.backgroundColor =
      type === 'error' ? '#ef4444' :
      type === 'warning' ? '#f59e0b' :
      '#10b981';

    toast.textContent = String(msg);

    const container = document.getElementById('toast-container');
    if (!container) return;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ============================================
  // PANEL BÖLÜM GEÇİŞİ (MENÜ BUTONLARI)
  // ============================================
  window.showSection = (sectionId) => {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.admin-menu li').forEach(li => {
      li.classList.remove('active');
      const oc = li.getAttribute('onclick') || '';
      if (oc.includes(`showSection('${sectionId}')`) || oc.includes(`showSection("${sectionId}")`)) {
        li.classList.add('active');
      }
    });
  };

  // ============================================
  // PROFİL / ÇIKIŞ
  // ============================================
  window.toggleProfileMenu = () => {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
  };

  document.addEventListener('click', (e) => {
    const trigger = document.getElementById('user-profile-trigger');
    const dropdown = document.getElementById('profile-dropdown');
    if (trigger && !trigger.contains(e.target)) {
      if (dropdown) dropdown.classList.remove('show');
    }
  });

  window.logout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminTokenExp');
      window.location.href = 'login.html';
    }
  };

  // ============================================
  // SHA-256 (şifre işlemleri için)
  // ============================================
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================
  // ŞİFRE DEĞİŞTİRME
  // ============================================
  window.changePassword = async () => {
    const u = (document.getElementById('cp-username')?.value || '').trim();
    const oldP = document.getElementById('cp-old')?.value || '';
    const newU = (document.getElementById('cp-new-user')?.value || '').trim() || u;
    const newP = document.getElementById('cp-new')?.value || '';

    if (!u || !oldP || !newP) return showToast("Alanlar boş olamaz", "error");
    if (newP.length < 8) return showToast("Yeni şifre en az 8 karakter olmalı", "error");

    const stored = localStorage.getItem('ADMIN_CRED_HASH') || '';
    const oldHash = await sha256(`${u}:${oldP}`);
    if (oldHash !== stored) return showToast("Mevcut şifre hatalı", "error");

    const newHash = await sha256(`${newU}:${newP}`);
    localStorage.setItem('ADMIN_CRED_HASH', newHash);

    showToast("✅ Şifre güncellendi", "success");

    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminTokenExp');
    setTimeout(() => (window.location.href = 'login.html'), 600);
  };

  // ============================================
  // YEDEKLEME (Settings)
  // ============================================
  window.exportData = () => {
    const data = {
      posts: readArrayLS('posts', []),
      categories: readArrayLS('categories', []),
      siteTools: readArrayLS('siteTools', []),
      customTools: readArrayLS('customTools', []),
      customPages: readArrayLS('customPages', [])
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'blog_full_backup_' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('Tüm veriler indirildi!', 'success');
  };

  window.importData = (input) => {
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.posts) writeLS('posts', data.posts);
        if (data.categories) writeLS('categories', data.categories);
        if (data.siteTools) writeLS('siteTools', data.siteTools);
        if (data.customTools) writeLS('customTools', data.customTools);
        if (data.customPages) writeLS('customPages', data.customPages);

        alert('Yedek başarıyla yüklendi! Sayfa yenileniyor...');
        location.reload();
      } catch {
        alert('Dosya formatı hatalı veya bozuk!');
      }
    };
    reader.readAsText(file);
  };

  // İlk açılış
  window.showSection('dashboard');
});
