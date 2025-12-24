// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

// DÜZELTME: Linkin sonundaki 'execc' hatası 'exec' olarak düzeltildi.
const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/exec"; 


// Sayfa Yüklendiğinde Quill Editörü Başlat
document.addEventListener('DOMContentLoaded', () => {
    // Eğer Quill kütüphanesi yüklendiyse ve editör henüz başlatılmadıysa
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        var quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Yazı içeriğini buraya giriniz...'
        });
    }
});


// --- YAZI KAYDETME FONKSİYONU ---
async function savePost(status) {
    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit.innerText;
    
    // Butonu pasife al (Çift tıklamayı önlemek için)
    btnSubmit.innerText = "Kaydediliyor...";
    btnSubmit.disabled = true;

    try {
        // 1. Verileri HTML Formdan Al
        const baslik = document.getElementById("post-title").value;
        const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
        const kategori = document.getElementById("post-category").value || "Genel";
        const resimUrl = document.getElementById("post-image").value; 
        const ozet = document.getElementById("post-desc").value;
        
        // 2. Quill Editöründen İçeriği Al
        // Quill editörü içeriği .ql-editor sınıfı içinde tutar
        const editorElement = document.querySelector('#editor-container .ql-editor');
        const editorIcerik = editorElement ? editorElement.innerHTML : "";

        // Basit Doğrulama
        if (!baslik || editorIcerik === "<p><br></p>" || editorIcerik.trim() === "") {
            alert("Lütfen en azından bir başlık ve içerik giriniz!");
            throw new Error("Eksik bilgi");
        }

        // 3. Gönderilecek Veri Paketi
        const yeniYazi = {
            baslik: baslik,
            icerik: editorIcerik, // HTML formatında içerik
            resim: resimUrl,      // Resim linki
            tarih: tarih,
            kategori: kategori,
            ozet: ozet,
            durum: status // 'published' veya 'draft'
        };

        // 4. Google Sheet'e Gönder (POST İsteği)
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // Google Script için zorunlu
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(yeniYazi)
        });

        // 5. Başarılı İşlem
        showToast("✅ Yazı başarıyla yayınlandı!"); 
        
        // Formu ve Editörü Temizle
        document.getElementById("add-post-form").reset();
        if(editorElement) editorElement.innerHTML = ""; 

    } catch (error) {
        if(error.message !== "Eksik bilgi") {
            console.error(error);
            alert("Bir hata oluştu: " + error);
        }
    } finally {
        // Butonu eski haline getir
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
}

// --- Bildirim Kutusu (Toast) Gösterme ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    if(container) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        // Stil JS ile verilirse CSS bağımlılığı azalır
        toast.style.cssText = "background:#22c55e; color:white; padding:15px; margin-bottom:10px; border-radius:5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out;";
        toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
        
        container.appendChild(toast);
        
        // 3 saniye sonra sil
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } else {
        // Eğer HTML'de toast container yoksa standart alert ver
        alert(message);
    }
}
