/* ============================================================
   LOGIN MANAGEMENT (GİRİŞ KONTROLÜ)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // HTML'deki form elemanlarını seçiyoruz
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');

    // Eğer giriş formu varsa dinlemeye başla
    if (loginForm) {
        
        // Şifreyi görmek için göz ikonuna tıklama özelliği (Opsiyonel)
        const togglePassword = document.querySelector('.fa-eye');
        if(togglePassword) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('fa-eye-slash');
            });
        }

        // Giriş butonuna basılınca
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Sayfanın yenilenmesini engelle

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const originalBtnText = loginBtn.innerText;

            // Butonu "Giriş yapılıyor..." moduna al
            loginBtn.innerText = "Kontrol ediliyor...";
            loginBtn.disabled = true;
            loginBtn.style.opacity = "0.7";

            // Küçük bir gecikme ekleyelim (Gerçekçi hissettirmesi için)
            setTimeout(() => {
                
                // 🔐 KULLANICI ADI VE ŞİFRE BURADA BELİRLENİR
                // Burayı istediğiniz gibi değiştirebilirsiniz.
                const DOGRU_KULLANICI = "admin";
                const DOGRU_SIFRE = "123456"; 

                if (username === DOGRU_KULLANICI && password === DOGRU_SIFRE) {
                    // ✅ Giriş Başarılı!
                    // Tarayıcı hafızasına "yetkili" olduğunu kaydet
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminName', 'Abdullah Cihan'); // İsim kaydedelim
                    
                    // Admin paneline yönlendir
                    window.location.href = "admin.html";
                } else {
                    // ❌ Giriş Başarısız
                    alert("Hatalı kullanıcı adı veya şifre!");
                    loginBtn.innerText = originalText;
                    loginBtn.disabled = false;
                    loginBtn.style.opacity = "1";
                    passwordInput.value = ""; // Şifreyi temizle
                }

            }, 800); // 0.8 saniye bekleme
        });
    }
});
