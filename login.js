/* ============================================================
   GELİŞMİŞ LOGIN JS (localStorage Destekli)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // 👇 ŞİFRE YÖNETİMİ 👇
    // Varsayılan şifreler (Hiç değiştirilmediyse bunlar geçerlidir)
    const DEFAULT_USER = "admin";
    const DEFAULT_PASS = "123456";

    // Admin panelinden değiştirilen şifreyi hafızadan alıyoruz
    // Eğer hafızada yoksa, varsayılanları kullanıyoruz.
    const REAL_USER = localStorage.getItem('adminUser') || DEFAULT_USER;
    const REAL_PASS = localStorage.getItem('adminPass') || DEFAULT_PASS;

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

            const userInput = usernameInput.value.trim();
            const passInput = passwordInput.value.trim();

            // Mesajı gizle
            errorMsg.style.display = 'none';

            // Butonu yükleniyor yap
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            // Ufak bir bekleme efekti
            setTimeout(() => {
                // GİRİŞ KONTROLÜ
                // Girilen bilgileri, hafızadaki (veya varsayılan) bilgilerle kıyaslıyoruz
                if (userInput === REAL_USER && passInput === REAL_PASS) {
                    
                    // ✅ GİRİŞ BAŞARILI
                    localStorage.setItem('isAdmin', 'true');
                    
                    // Eğer kullanıcı adını admin panelinden değiştirdiyse onu kaydet
                    // Değiştirmediyse varsayılanı göster
                    const displayName = localStorage.getItem('adminUser') || 'Yönetici';
                    localStorage.setItem('adminName', displayName);
                    
                    // Admin paneline git
                    window.location.href = "admin.html";

                } else {
                    
                    // ❌ HATA
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = "Kullanıcı adı veya şifre hatalı!";
                    
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                    
                    // Şifreyi temizle
                    passwordInput.value = "";
                }
            }, 800); // Biraz daha gerçekçi olması için süreyi artırdım
        });
    }
});
