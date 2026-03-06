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

  // --- API HELPER ---
  async function fetchAPI(action, payload = {}) {
    const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
    if (!apiUrl) throw new Error("API_URL tanımlı değil!");

    const token = sessionStorage.getItem('adminToken');
    const body = { action, token, ...payload };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString()
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Sunucu hatası");
    return data;
  }

  // Modüllerin ortak kullanımı için tek namespace
  window.AdminCore = {
    escapeHTML,
    safeHttpUrl,
    safeIconClass,
    readArrayLS,
    writeLS,
    fetchAPI
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

    // Dashboard'a geçildiyse verileri yükle
    if (sectionId === 'dashboard' && window.AdminDashboard) {
      AdminDashboard.init();
    }
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

    showToast("İşlem yapılıyor, lütfen bekleyin...", "warning");
    const btn = document.querySelector("#settings .btn-submit");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...`;
    }

    try {
      // 1. App Script Backend Testi
      await AdminCore.fetchAPI('update_admin', {
        old_user: u,
        old_pass: oldP,
        new_user: newU,
        new_pass: newP
      });
      // Backend başarılı oldu, auth bilgilerini cache'te tutabiliriz
      const newHash = await sha256(`${newU}:${newP}`);
      localStorage.setItem('ADMIN_CRED_HASH', newHash);

      showToast("✅ Şifre güncellendi", "success");
      sessionStorage.clear();
      setTimeout(() => (window.location.href = 'login.html'), 1500);

    } catch (e) {
      // 2. LocalStorage Fallback Testi (Şifre Backend'de güncellenemedi veya API yok)
      console.warn("API Hatası (Fallback Devrede):", e.message);

      const stored = localStorage.getItem('ADMIN_CRED_HASH') || '';
      const oldHash = await sha256(`${u}:${oldP}`);

      if (oldHash !== stored) {
        showToast("Mevcut şifre hatalı", "error");
      } else {
        const newHash = await sha256(`${newU}:${newP}`);
        localStorage.setItem('ADMIN_CRED_HASH', newHash);
        showToast("✅ Şifre (Yerel) güncellendi", "success");
        sessionStorage.clear();
        setTimeout(() => (window.location.href = 'login.html'), 1500);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Güncelle`;
      }
    }
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
