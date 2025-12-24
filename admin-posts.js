// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

// Kopyaladığınız Google Apps Script Linki:


// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

// BURAYA DİKKAT: Google Apps Script Linkini tırnak içine yapıştır:
const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/execc"; 


// Sayfa Yüklendiğinde Quill Editörü Başlat (Eğer admin.js başlatmıyorsa burası garanti olsun)
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.ql-editor')) {
        // Quill editör zaten başlatılmamışsa başlat
        var quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Yazı içeriğini buraya giriniz...'
        });
    }
});


// --- YAZI KAYDETME FONKSİYONU ---
// HTML'deki onclick="savePost('published')" komutu bu fonksiyonu çağırır.
async function savePost(status) {
    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit.innerText;
    
    // Butonu pasife al
    btnSubmit.innerText = "Kaydediliyor...";
    btnSubmit.disabled = true;

    try {
        // 1. Verileri HTML Formdan Al
        const baslik = document.getElementById("post-title").value;
        const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
        const kategori = document.getElementById("post-category").value || "Genel";
        const resimUrl = document.getElementById("post-image").value; 
        const ozet = document.getElementById("post-desc").value;
        
        // 2. Quill Editöründen İçeriği Al (HTML olarak)
        // Quill editörü .ql-editor sınıfında içeriği tutar
        const editorIcerik = document.querySelector('#editor-container .ql-editor').innerHTML;

        if (!baslik || editorIcerik === "<p><br></p>") {
            alert("Lütfen başlık ve içerik giriniz!");
            throw new Error("Eksik bilgi");
        }

        // 3. Gönderilecek Paket
        const yeniYazi = {
            baslik: baslik,
            icerik: editorIcerik, // HTML formatında içerik
            resim: resimUrl,      // Link olarak gidiyor
            tarih: tarih,
            kategori: kategori,
            ozet: ozet,
            durum: status // 'published' veya 'draft'
        };

        // 4. Google Sheet'e Gönder
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(yeniYazi)
        });

        // 5. Başarılı İşlem
        showToast("✅ Yazı başarıyla yayınlandı!"); // Eğer toast fonksiyonun varsa
        alert("✅ Yazı Eklendi!");

        // Formu Temizle
        document.getElementById("add-post-form").reset();
        document.querySelector('#editor-container .ql-editor').innerHTML = ""; // Editörü temizle

    } catch (error) {
        if(error.message !== "Eksik bilgi") {
            console.error(error);
            alert("Hata oluştu: " + error);
        }
    } finally {
        // Butonu eski haline getir
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
}

// --- Basit Toast Mesajı (Eğer admin.js içinde yoksa) ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    if(container) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.style.cssText = "background:#22c55e; color:white; padding:15px; margin-bottom:10px; border-radius:5px;";
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
