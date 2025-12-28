/* ============================================================
   SECURE LOGIN JS (Google Sheets Bağlantılı)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // ⚠️ 1. WEB UYGULAMASI URL'Sİ (Az önce kopyaladığın yeni linki buraya yapıştır)
    const API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec"; 
    
    // ⚠️ 2. GÜVENLİK ANAHTARI (Code.gs ile AYNI olmalı)
    const API_KEY = "Sifre2025"; 

    // DOM Elementleri
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');
    const errorMsg = document.getElementById('error-msg');
    const togglePassword = document.getElementById('togglePassword');

    // 1. Şifre Göster/Gizle
    if(togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // 2. Giriş İşlemi
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userInput = usernameInput.value.trim();
            const passInput = passwordInput.value.trim();

            // Ekranı temizle ve yükleniyor göster
            errorMsg.style.display = 'none';
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            loginBtn.disabled = true;

            try {
                // 🚀 ADIM 1: Google Sheets'ten veriyi çek
                // auth=${API_KEY} parametresini ekliyoruz ki sunucu bizi içeri alsın
                const response = await fetch(`${API_URL}?type=settings&auth=${API_KEY}`);
                const data = await response.json();

                if (!data.ok) {
                    throw new Error(data.error || "Sunucu hatası");
                }

                const realUser = data.user; 
                const realPass = data.pass; 

                // 🚀 ADIM 2: Karşılaştırma
                if (userInput === realUser && passInput === realPass) {
                    
                    // ✅ GİRİŞ BAŞARILI
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminName', realUser); 
                    localStorage.setItem('adminUser', realUser); 
                    localStorage.setItem('adminPass', realPass); 
                    
                    // Yönlendir
                    window.location.href = "admin.html";

                } else {
                    throw new Error("Kullanıcı adı veya şifre hatalı!");
                }

            } catch (error) {
                // ❌ HATA
                console.error(error);
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = error.message === "Failed to fetch" 
                    ? '<i class="fa-solid fa-triangle-exclamation"></i> Bağlantı hatası!' 
                    : '<i class="fa-solid fa-circle-exclamation"></i> Giriş başarısız: Bilgiler yanlış.';
                
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                passwordInput.value = "";
            }
        });
    }
});
