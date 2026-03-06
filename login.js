document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-msg');
  const lockMsg = document.getElementById('lock-msg');

  const MAX_FAIL = 5;
  const LOCK_MS = 2 * 60 * 1000;

  function now() { return Date.now(); }

  function getFailState() {
    try { return JSON.parse(localStorage.getItem('login_fail_state') || '{"count":0,"lockUntil":0}'); }
    catch { return { count: 0, lockUntil: 0 }; }
  }
  function setFailState(state) { localStorage.setItem('login_fail_state', JSON.stringify(state)); }

  function setLockedUI(locked) { if (lockMsg) lockMsg.style.display = locked ? 'block' : 'none'; }
  function isLocked() { const st = getFailState(); return st.lockUntil && st.lockUntil > now(); }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showError(show) { if (errorMsg) errorMsg.style.display = show ? 'block' : 'none'; }

  function setButtonLoading(loading) {
    const btn = document.querySelector('.btn-login');
    if (!btn) return;
    if (loading) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Giriş Yapılıyor...';
      btn.style.opacity = '0.8';
      btn.disabled = true;
    } else {
      btn.innerHTML = 'Giriş Yap <i class="fa-solid fa-arrow-right"></i>';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }



  // Token varsa panele yönlendir
  try {
    const token = sessionStorage.getItem('adminToken');
    const exp = Number(sessionStorage.getItem('adminTokenExp') || '0');

    if (token && exp > now()) {
      window.location.href = 'admin.html';
      return;
    }
  } catch { }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(false);

    const st = getFailState();
    if (isLocked()) { setLockedUI(true); return; }
    setLockedUI(false);

    const username = (document.getElementById('username')?.value || '').trim();
    const password = (document.getElementById('password')?.value || '');

    if (!username || !password) { showError(true); return; }

    setButtonLoading(true);

    try {
      const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          action: 'login',
          username: username,
          password: password
        }).toString()
      });

      const data = await res.json();

      if (data.ok && data.token) {
        // App Script Backend başarılı
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminTokenExp', String(now() + (2 * 60 * 60 * 1000)));
        setFailState({ count: 0, lockUntil: 0 });

        setTimeout(() => { window.location.href = 'admin.html'; }, 300);
      } else {
        st.count = (st.count || 0) + 1;
        if (st.count >= MAX_FAIL) { st.lockUntil = now() + LOCK_MS; setLockedUI(true); }
        setFailState(st);
        showError(true);
      }
    } catch {
      showError(true);
    } finally {
      setButtonLoading(false);
    }
  });

  // ✅ Şifremi unuttum: Sadece Google Sheets Yönlendirmesi
  document.getElementById('forgot-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    alert("Kullanıcı adı ve şifrenizi Google Sheets veritabanınızdaki 'Settings' sayfasından değiştirebilirsiniz.");
  });
});
