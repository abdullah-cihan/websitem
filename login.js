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

  // ✅ İlk kurulum (ADMIN_CRED_HASH yoksa)
  async function ensureSetup() {
    const credHash = localStorage.getItem('ADMIN_CRED_HASH');
    const recHash = localStorage.getItem('ADMIN_RECOVERY_HASH');

    if (credHash && recHash) return;

    alert("İlk kurulum: Admin kullanıcı adı ve şifre belirleyeceğiz. Sonra bir Recovery Key vereceğim, bunu kaybetme.");

    const username = prompt("Yeni admin kullanıcı adı:");
    if (!username) return;

    const password = prompt("Yeni admin şifre (en az 8 karakter):");
    if (!password || password.length < 8) {
      alert("Şifre en az 8 karakter olmalı.");
      return;
    }

    // cred hash
    const newCredHash = await sha256(`${username}:${password}`);
    localStorage.setItem('ADMIN_CRED_HASH', newCredHash);

    // recovery key (kullanıcıya 1 kez göster)
    const rnd = crypto.getRandomValues(new Uint8Array(16));
    const recoveryKey = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const recoveryHash = await sha256(`RECOVERY:${recoveryKey}`);
    localStorage.setItem('ADMIN_RECOVERY_HASH', recoveryHash);

    alert(
      "✅ Kurulum tamam.\n\n" +
      "🔑 Recovery Key (BUNU KAYDET!):\n" + recoveryKey + "\n\n" +
      "Bu anahtarla 'Şifremi unuttum' üzerinden şifre sıfırlayabilirsin."
    );
  }

  // sayfa açılınca kurulum kontrol et
  ensureSetup();

  // token varsa panele yönlendir
  try {
    const token = sessionStorage.getItem('adminToken');
    const exp = Number(sessionStorage.getItem('adminTokenExp') || '0');
    if (token && exp > now()) {
      sessionStorage.setItem("admin_key", prompt("Admin anahtarını gir (1 kere):"));
      sessionStorage.setItem("is_admin", "1");

      window.location.href = 'admin.html';
      return;
    }
  } catch {}

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
      const VALID_CRED_HASH = localStorage.getItem("ADMIN_CRED_HASH") || "";
      const credHash = await sha256(`${username}:${password}`);

      if (credHash === VALID_CRED_HASH) {
        const token = crypto.getRandomValues(new Uint8Array(16));
        const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');

        sessionStorage.setItem('adminToken', tokenHex);
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

  // ✅ Şifremi unuttum: Recovery Key ile sıfırla
  document.getElementById('forgot-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();

    const storedRecHash = localStorage.getItem('ADMIN_RECOVERY_HASH');
    if (!storedRecHash) {
      alert("Recovery Key bulunamadı. (Muhtemelen localStorage temizlenmiş.)\nÇözüm: İlk kurulum ekranını tekrar çalıştırmak için ADMIN_* kayıtlarını silip sayfayı yenile.");
      return;
    }

    const key = prompt("🔑 Recovery Key gir:");
    if (!key) return;

    const enteredHash = await sha256(`RECOVERY:${key.trim().toUpperCase()}`);
    if (enteredHash !== storedRecHash) {
      alert("❌ Recovery Key hatalı!");
      return;
    }

    const newUsername = prompt("Yeni kullanıcı adı:");
    if (!newUsername) return;

    const newPassword = prompt("Yeni şifre (en az 8 karakter):");
    if (!newPassword || newPassword.length < 8) {
      alert("Şifre en az 8 karakter olmalı");
      return;
    }

    const newCredHash = await sha256(`${newUsername}:${newPassword}`);
    localStorage.setItem("ADMIN_CRED_HASH", newCredHash);

    alert("✅ Şifre sıfırlandı. Yeni şifreyle giriş yapabilirsin.");
  });
});
