<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background-color: #121212; color: #ffffff; }
    #tool-frame { width: 100%; height: 100vh; border: none; display: block; background: #fff; }
    
    /* Yükleniyor ve Hata Ekranı Stilleri */
    .status-container {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        background-color: #121212; z-index: 9999; text-align: center;
    }
    .spinner {
        width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%; border-top-color: #3498db;
        animation: spin 1s ease-in-out infinite; margin-bottom: 20px;
    }
    .error-msg { color: #ff6b6b; font-size: 1.5rem; max-width: 80%; }
    .hidden { display: none !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>

<div id="loader" class="status-container">
    <div class="spinner"></div>
    <p>İçerik yükleniyor, lütfen bekleyin...</p>
</div>

<div id="error-display" class="status-container hidden">
    <h2 class="error-msg">⚠️ Bir hata oluştu</h2>
    <p id="error-text" style="color: #ccc;"></p>
</div>

<iframe id="tool-frame" class="hidden"></iframe>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    // --- Ayarlar ve Seçiciler ---
    const CONFIG = {
        API_URL: "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec",
        ID: new URLSearchParams(window.location.search).get('id')
    };

    const els = {
        frame: document.getElementById('tool-frame'),
        loader: document.getElementById('loader'),
        errorDisplay: document.getElementById('error-display'),
        errorText: document.getElementById('error-text')
    };

    // --- Yardımcı Fonksiyonlar ---
    const toggleDisplay = (element, show) => {
        if (show) element.classList.remove('hidden');
        else element.classList.add('hidden');
    };

    const showError = (message) => {
        toggleDisplay(els.loader, false);
        toggleDisplay(els.frame, false);
        els.errorText.textContent = message;
        toggleDisplay(els.errorDisplay, true);
    };

    // --- Ana Akış ---
    if (!CONFIG.ID) {
        showError("URL parametresinde geçerli bir ID bulunamadı.");
        return;
    }

    try {
        // API İsteği
        const res = await fetch(`${CONFIG.API_URL}?type=pages`);
        
        if (!res.ok) throw new Error("Sunucu yanıt vermedi.");

        const data = await res.json();
        const pages = data.pages || [];
        
        // ID Eşleştirme (String dönüşümü ile güvenli karşılaştırma)
        const page = pages.find(p => String(p.id) === String(CONFIG.ID));

        if (page && page.icerik) {
            // Başarılı Yükleme
            document.title = page.baslik || "Sayfa Görüntüleyici";
            els.frame.srcdoc = page.icerik;
            
            // Frame yüklendiğinde loader'ı kapat
            els.frame.onload = () => {
                toggleDisplay(els.loader, false);
                toggleDisplay(els.frame, true);
            };
            
            // Eğer iframe onload tetiklenmezse (bazen srcdoc'ta olabilir) güvenli süre sonra aç:
            setTimeout(() => {
                toggleDisplay(els.loader, false);
                toggleDisplay(els.frame, true);
            }, 500);

        } else {
            // Sayfa Bulunamadı (404)
            showError("Aradığınız sayfa bulunamadı veya silinmiş.");
            document.title = "Sayfa Bulunamadı (404)";
        }

    } catch (e) {
        console.error("Sistem Hatası:", e);
        showError("Veri çekilirken bir bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.");
    }
});
</script>
