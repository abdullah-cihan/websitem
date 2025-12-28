/* ============================================================
   SECURE LOGIN JS - FINAL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    
    // 👇 AZ ÖNCE ALDIĞIN URL'Yİ BURAYA YAPIŞTIR (Sonunda ? veya & olmasın, sadece /exec ile bitsin)
    const API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec"; 
    
    const API_KEY = "Sifre2025"; 

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');
    const errorMsg = document.getElementById('error-msg');
    const togglePassword = document.getElementById('togglePassword');

    if(togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userInput = usernameInput.value.trim();
            const passInput = passwordInput.value.trim();

            errorMsg.style.display = 'none';
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            try {
                // 🛠️ URL İNŞASI (Hata olmaması için burada birleştiriyoruz)
                // exec'ten sonra '?' koyuyoruz, sonra parametreleri ekliyoruz.
                const fullUrl = API_URL + "?type=settings&auth=" + API_KEY;
                
                // Konsola yazdıralım ki doğru URL gidiyor mu görelim (F12 -> Console)
                console.log("İstek atılıyor:", fullUrl);

                const response = await fetch(fullUrl);
                const data = await response.json();

                if (!data.ok) {
                    throw new Error(data.error || "Sunucu hatası");
                }

                if (userInput === data.user && passInput === data.pass) {
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminName', data.user); 
                    window.location.href = "admin.html";
                } else {
                    throw new Error("Kullanıcı adı veya şifre hatalı!");
                }

            } catch (error) {
                console.error("Hata:", error);
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = error.message === "Failed to fetch" 
                    ? "Bağlantı hatası! URL'yi kontrol et." 
                    : "Giriş başarısız: Bilgiler yanlış.";
                
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        });
    }
});
