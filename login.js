/* ============================================================
   REAL-TIME LOGIN JS (Google Sheets Bağlantılı - FINAL)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // ⚠️ 1. URL KONTROLÜ: Buraya Apps Script'ten aldığın en son "Web App URL"sini yapıştır.
    // (Sonu /exec ile bitmeli)
    const API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec"; 
    
    // ⚠️ 2. DEĞİŞKEN TANIMI (ÖNEMLİ):
    // Backend'de şifre kontrolünü kapattık AMA JavaScript kodunun çökmemesi için
    // bu değişkenin burada tanımlı olması ZORUNLUDUR. İçeriği önemli değil.
    const API_KEY = "Sifre2025"; 

    // DOM Elementleri
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
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // 2. Form Gönderilince Çalışacak Kod
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userInput = usernameInput.value.trim();
            const passInput = passwordInput.value.trim();

            // UI Güncelleme (Yükleniyor...)
            errorMsg.style.display = 'none';
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            try {
                // 🚀 ADIM 1: Google Sheets'ten güncel kullanıcı bilgilerini çek
                // API_KEY parametresi backend'de kontrol edilmese bile URL yapısı bozulmasın diye gönderiyoruz.
                const response = await fetch(`${API_URL}?type=settings&auth=${API_KEY}`);
                const data = await response.json();

                // Backend'den hata dönerse (örn: Tablo bulunamadı)
                if (!data.ok) {
                    throw new Error(data.error || "Sunucu hatası");
                }

                // Backend'den gelen gerçek kullanıcı adı ve şifre
                const realUser = data.user; 
                const realPass = data.pass; 

                // 🚀 ADIM 2: Tarayıcıda Karşılaştırma Yap
                if (userInput === realUser && passInput === realPass) {
                    
                    // ✅ GİRİŞ BAŞARILI
                    // Oturum bilgilerini tarayıcıya kaydet
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminName', realUser); 
                    localStorage.setItem('adminUser', realUser); 
                    localStorage.setItem('adminPass', realPass); 
                    
                    // Admin paneline yönlendir
                    window.location.href = "admin.html";

                } else {
                    // Şifre yanlışsa hata fırlat
                    throw new Error("Kullanıcı adı veya şifre hatalı!");
                }

            } catch (error) {
                // ❌ HATA YÖNETİMİ
                console.error("Giriş Hatası:", error);
                
                errorMsg.style.display = 'block';
                // Eğer internet yoksa veya URL yanlışsa "Failed to fetch" hatası gelir
                errorMsg.innerText = error.message === "Failed to fetch" 
                    ? "Bağlantı hatası! URL'yi veya interneti kontrol edin." 
                    : "Giriş başarısız: Bilgiler yanlış.";
                
                // Butonu eski haline getir
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                passwordInput.value = "";
            }
        });
    }
});
