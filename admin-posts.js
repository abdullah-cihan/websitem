// ==========================================
// ADMIN PANELİ - YAZI YÖNETİMİ (admin-posts.js)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/exec"; 

// --- BAŞLANGIÇ ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Quill Editörünü Başlat
    initQuill();

    // 2. Kategorileri Yükle
    loadCategories();

    // 3. Mevcut Yazıları Listele (Varsa tabloyu doldurur)
    // Eğer sayfada yazı tablosu varsa çalışır
    if(document.getElementById('posts-table-body')) {
        fetchPosts();
    }
});

// --- QUILL EDİTÖR KURULUMU ---
function initQuill() {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        // Eğer container varsa başlat
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            new Quill('#editor-container', {
                theme: 'snow',
                placeholder: 'Yazı içeriğini buraya giriniz...'
            });
        }
    }
}

// --- KATEGORİ YÖNETİMİ (EKSİK OLAN KISIM) ---
function loadCategories() {
    const select = document.getElementById('post-category');
    if (!select) return; // Eğer sayfada kategori seçimi yoksa dur.

    // LocalStorage'dan kategorileri al, yoksa varsayılanları kullan
    let cats = JSON.parse(localStorage.getItem('blog_categories') || '[]');
    
    if (cats.length === 0) {
        cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
        localStorage.setItem('blog_categories', JSON.stringify(cats));
    }

    // Dropdown'ı temizle ve doldur
    select.innerHTML = '';
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

// HTML'deki onclick="addNewCategory()" bu fonksiyonu çağırır
window.addNewCategory = () => {
    const newCat = prompt("Yeni kategori adı:");
    if (!newCat || newCat.trim() === "") return;

    const cleanCat = newCat.trim();
    let cats = JSON.parse(localStorage.getItem('blog_categories') || '[]');

    // Zaten varsa ekleme
    if (cats.includes(cleanCat)) {
        alert("Bu kategori zaten mevcut!");
        return;
    }

    // Listeye ekle ve kaydet
    cats.push(cleanCat);
    localStorage.setItem('blog_categories', JSON.stringify(cats));

    // Listeyi yenile ve yeni ekleneni seç
    loadCategories();
    document.getElementById('post-category').value = cleanCat;
    
    // Küçük bir bildirim (Opsiyonel)
    if(window.showToast) window.showToast(`Kategori eklendi: ${cleanCat}`);
};


// --- YAZI KAYDETME FONKSİYONU ---
window.savePost = async (status) => {
    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";
    
    if(btnSubmit) {
        btnSubmit.innerText = "Gönderiliyor...";
        btnSubmit.disabled = true;
    }

    try {
        // 1. Form Verilerini Al
        const baslik = document.getElementById("post-title").value;
        const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
        const kategori = document.getElementById("post-category").value || "Genel";
        const resimUrl = document.getElementById("post-image").value; 
        const ozet = document.getElementById("post-desc").value;
        
        // 2. Editör İçeriğini Al
        const editorElement = document.querySelector('#editor-container .ql-editor');
        const editorIcerik = editorElement ? editorElement.innerHTML : "";

        // Doğrulama
        if (!baslik || !editorIcerik || editorIcerik === "<p><br></p>") {
            alert("Lütfen başlık ve içerik alanlarını doldurunuz.");
            throw new Error("Eksik bilgi");
        }

        // 3. Veri Paketi
        const postData = {
            action: "add_post",
            baslik: baslik,
            icerik: editorIcerik,
            resim: resimUrl,
            tarih: tarih,
            kategori: kategori,
            ozet: ozet,
            durum: status
        };

        // 4. API'ye Gönder
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        // 5. Başarı İşlemleri
        if(window.showToast) window.showToast("✅ Yazı başarıyla gönderildi!");
        else alert("✅ Yazı başarıyla gönderildi!");
        
        // Formu temizle
        document.getElementById("add-post-form").reset();
        if(editorElement) editorElement.innerHTML = ""; 
        
        // Eğer listedeysek listeyi yenile
        if(typeof fetchPosts === 'function') setTimeout(fetchPosts, 1500);

    } catch (error) {
        if(error.message !== "Eksik bilgi") alert("Hata: " + error);
    } finally {
        if(btnSubmit) {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    }
};

// --- YAZILARI LİSTELEME (Tablo Varsa) ---
async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);

        tbody.innerHTML = '';
        if(posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Hiç yazı yok.</td></tr>';
            return;
        }

        posts.reverse().forEach(post => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${post.resim || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'"></td>
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
