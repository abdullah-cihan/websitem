/* ============================================================
   GOOGLE SHEET BAĞLANTILI LOGIN JS
   ============================================================ */

// ⚠️ BURAYA DİKKAT: Google Apps Script'ten aldığın URL'i buraya yapıştır!
const API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    
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
            // İkonu değiştir (FontAwesome kullanıyorsan)
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

            if(!user || !pass) {
                alert("Lütfen alanları doldurun.");
                return;
            }

            // Mesajı gizle
            errorMsg.style.display = 'none';

            // Butonu yükleniyor yap
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            // --- GOOGLE SHEET API İSTEĞİ BAŞLIYOR ---
            const payload = {
                action: "login",
                username: user,
                password: pass
            };

            // "no-cors" modu KULLANMA, Apps Script JSON dönmeli.
            fetch(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                // Apps Script'ten yanıt geldi
                if (data.ok) {
                    // ✅ GİRİŞ BAŞARILI
                    // Tarayıcıya giriş yapıldığını kaydet
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminToken', data.token); // Varsa token
                    
                    // Başarılı mesajı (opsiyonel)
                    loginBtn.innerHTML = '<i class="fa-solid fa-check"></i> Başarılı!';
                    
                    // Yönlendir
                    setTimeout(() => {
                        window.location.href = "admin.html";
                    }, 1000);
                } else {
                    // ❌ HATA (Şifre yanlış vb.)
                    throw new Error(data.error || "Giriş başarısız");
                }
            })
            .catch(error => {
                // Hata durumunda yapılacaklar
                console.error("Login Hatası:", error);
                errorMsg.textContent = "Hata: " + error.message;
                errorMsg.style.display = 'block';
                
                // Butonu eski haline getir
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                passwordInput.value = ""; // Şifreyi temizle
            });
        });
    }
});
