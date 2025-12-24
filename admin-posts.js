// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

// Kopyaladığınız Google Apps Script Linki:
const API_URL = "https://script.google.com/macros/s/......./exec"; 

// --- Yardımcı: Resmi Metne Çevir ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- YENİ YAZI KAYDETME ---
// Admin panelinizdeki "Kaydet" butonunun ID'sini buraya yazın
const btnKaydet = document.getElementById("btnKaydet") || document.querySelector(".btn-save");

if (btnKaydet) {
    btnKaydet.addEventListener("click", async (e) => {
        e.preventDefault();
        
        const originalText = btnKaydet.innerText;
        btnKaydet.innerText = "Kaydediliyor...";
        btnKaydet.disabled = true;

        try {
            // HTML'deki input ID'lerinize göre buraları düzenleyin
            const baslik = document.getElementById("inputBaslik").value;
            const icerik = document.getElementById("inputIcerik").value;
            const dosyaInput = document.getElementById("inputResim");
            
            let resimData = "";
            if (dosyaInput && dosyaInput.files[0]) {
                resimData = await toBase64(dosyaInput.files[0]);
            }

            const yeniYazi = {
                baslik: baslik,
                icerik: icerik,
                resim: resimData
            };

            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(yeniYazi)
            });

            alert("✅ Yazı başarıyla eklendi!");
            
            // Formu Temizle
            document.getElementById("inputBaslik").value = "";
            document.getElementById("inputIcerik").value = "";
            if(dosyaInput) dosyaInput.value = "";

        } catch (error) {
            alert("Hata: " + error);
        } finally {
            btnKaydet.innerText = originalText;
            btnKaydet.disabled = false;
        }
    });
}
