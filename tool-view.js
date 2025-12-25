document.addEventListener('DOMContentLoaded', async () => {
    
    // ✅ GÜNCEL API LİNKİ
    const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    const frame = document.getElementById('tool-frame');

    // ID yoksa hata göster
    if (!targetId) {
        document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;font-family:sans-serif;'>Hata: Sayfa ID'si eksik.</h1>";
        return;
    }

    // Frame elementi yoksa dur
    if (!frame) return;

    try {
        // Kullanıcıya bilgi ver (Frame içine yazamıyoruz çünkü srcdoc henüz boş, body'e yazabiliriz ama frame üstüne biner. Console yeterli.)
        console.log("Sayfa verisi çekiliyor...");

        const response = await fetch(`${API_URL}?type=pages`);
        const data = await response.json();
        const pages = data.pages || (data.ok ? data.pages : []);

        // İlgili sayfayı bul
        const pageData = pages.find(p => String(p.id) === String(targetId));

        if (pageData && pageData.icerik) {
            // Başlığı güncelle
            document.title = pageData.baslik;
            
            // İçeriği Iframe'e göm
            frame.srcdoc = pageData.icerik;
        } else {
            document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;font-family:sans-serif;'>Sayfa Bulunamadı (404)</h1>";
        }

    } catch (error) {
        console.error("Tool View Error:", error);
        document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;font-family:sans-serif;'>Veri Yükleme Hatası. Lütfen internet bağlantınızı kontrol edin.</h1>";
    }
});
