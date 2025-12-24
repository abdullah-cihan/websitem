// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbyfxBUq0d-sj315o5a_tgS76h0hDMvJKwFhrGzdnGJXKHDKp9oabootgeyCn9QQJ_2fdw/exec"; 

// Sayfa Yüklendiğinde Quill Editörü Başlat
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        var quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Yazı içeriğini buraya giriniz...'
        });
    }
    // Mevcut yazıları listele
    fetchPosts(); 
});

// --- YAZILARI LİSTELEME ---
async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        
        // Backend'den gelen veri yapısını kontrol et
        const posts = Array.isArray(data) ? data : (data.posts || []);

        tbody.innerHTML = '';
        if(posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Hiç yazı yok.</td></tr>';
            return;
        }

        // Listeyi tersten (yeniden eskiye) sırala
        posts.reverse().forEach(post => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${post.resim || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td style="font-weight:600; color:white;">${post.baslik}</td>
                <td>${post.kategori}</td>
                <td><span style="padding:4px 8px; background:#10b981; border-radius:4px; font-size:0.8rem;">${post.durum || 'Yayınlandı'}</span></td>
                <td>
                    <button class="action-btn btn-delete" onclick="alert('Silme işlemi için Google Sheet dosyasını kullanınız.')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Veri çekilemedi.</td></tr>';
    }
}

// --- YAZI KAYDETME FONKSİYONU ---
async function savePost(status) {
    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit.innerText;
    
    btnSubmit.innerText = "Gönderiliyor...";
    btnSubmit.disabled = true;

    try {
        const baslik = document.getElementById("post-title").value;
        const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
        const kategori = document.getElementById("post-category").value || "Genel";
        const resimUrl = document.getElementById("post-image").value; 
        const ozet = document.getElementById("post-desc").value;
        const editorElement = document.querySelector('#editor-container .ql-editor');
        const editorIcerik = editorElement ? editorElement.innerHTML : "";

        if (!baslik || editorIcerik.trim() === "" || editorIcerik === "<p><br></p>") {
            alert("Başlık ve içerik zorunludur!");
            throw new Error("Eksik bilgi");
        }

        // API İÇİN VERİ PAKETİ
        const postData = {
            action: "add_post", // Backend bu action'ı bekliyor
            baslik: baslik,
            icerik: editorIcerik,
            resim: resimUrl,
            tarih: tarih,
            kategori: kategori,
            ozet: ozet,
            durum: status
        };

        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        alert("✅ Yazı başarıyla gönderildi!");
        
        // Formu temizle
        document.getElementById("add-post-form").reset();
        if(editorElement) editorElement.innerHTML = ""; 
        
        // Tabloyu güncelle (biraz bekle ki Sheet güncellensin)
        setTimeout(fetchPosts, 1500);

    } catch (error) {
        if(error.message !== "Eksik bilgi") alert("Hata: " + error);
    } finally {
        btnSave = document.querySelector('.btn-submit'); // Yeniden seç
        if(btnSave) {
            btnSave.innerText = "Yayınla";
            btnSave.disabled = false;
        }
    }
}
