/* ============================================================
   BASİT LOGIN JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // 👇 AYARLAR: KULLANICI ADI VE ŞİFREYİ BURADAN BELİRLE 👇
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "123456"; 
    // 👆 Burayı değiştirebilirsin 👆

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');
    const errorMsg = document.getElementById('error-msg');
    const togglePassword = document.getElementById('togglePassword');

    // 1. Şifre Göster/Gizle Özelliği
    if(togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // İkonu değiştir
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // 2. Form Gönderilince
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Sayfa yenilenmesin

            const user = usernameInput.value.trim();
            const pass = passwordInput.value.trim();

            // Mesajı gizle
            errorMsg.style.display = 'none';

            // Butonu yükleniyor yap
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            // Ufak bir bekleme efekti (0.5 saniye)
            setTimeout(() => {
                if (user === ADMIN_USER && pass === ADMIN_PASS) {
                    // ✅ GİRİŞ BAŞARILI
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminName', user);
                    
                    // Admin paneline git
                    window.location.href = "admin.html";
                } else {
                    // ❌ HATA
                    errorMsg.style.display = 'block';
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                    
                    // Şifreyi temizle
                    passwordInput.value = "";
                }
            }, 500);
        });
    }
});
