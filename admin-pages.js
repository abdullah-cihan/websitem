/* ============================================================
   ADMIN POSTS MANAGER - YAZI YÖNETİMİ (V-FINAL)
   ============================================================ */

// ✅ GÜNCEL API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

// --- BAŞLANGIÇ ---
document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    
    // Eğer yazı tablosu varsa (sayfadaysak) verileri çek
    if(document.getElementById('posts-table-body')) {
        fetchPosts();
    }
});

// --- 1. QUILL EDİTÖR KURULUMU ---
function initQuill() {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        const container = document.getElementById('editor-container');
        if (container) {
            // Editörü global değişkene ata ki savePost içinde erişebilelim
            window.myQuill = new Quill('#editor-container', { 
                theme: 'snow', 
                placeholder: 'Yazı içeriğini buraya giriniz...' 
            });
        }
    }
}

// --- 2. KATEGORİ YÖNETİMİ (LocalStorage Tabanlı - Hızlı Erişim) ---
function loadCategories() {
    const select = document.getElementById('post-category');
    if (!select) return;
    
    let cats = JSON.parse(localStorage.getItem('categories') || '[]');
    if (cats.length === 0) {
        cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
        localStorage.setItem('categories', JSON.stringify(cats));
    }
    
    select.innerHTML = '';
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

window.addNewCategory = () => {
    const newCat = prompt("Yeni kategori adı:");
    if (!newCat || !newCat.trim()) return;
    
    const cleanCat = newCat.trim();
    let cats = JSON.parse(localStorage.getItem('categories') || '[]');
    
    if (cats.includes(cleanCat)) { alert("Bu kategori zaten mevcut!"); return; }
    
    cats.push(cleanCat);
    localStorage.setItem('categories', JSON.stringify(cats));
    loadCategories();
    
    const select = document.getElementById('post-category');
    if(select) select.value = cleanCat;
};

// --- 3. YAZI GÖNDERME (POST) ---
window.savePost = async (status) => {
    const btnSubmit = status === 'published' ? document.querySelector('.btn-submit') : document.querySelector('.btn-draft');
    const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";
    
    if (btnSubmit) { 
        btnSubmit.innerText = "Gönderiliyor..."; 
        btnSubmit.disabled = true; 
    }

    try {
        // --- Form Verilerini Al ---
        const baslik = document.getElementById("post-title").value.trim();
        const tarih = document.getElementById("post-date").value || new Date().toISOString().slice(0, 10);
        const kategori = document.getElementById("post-category").value || "Genel";
        const resimUrl = document.getElementById("post-image").value.trim(); 
        const ozet = document.getElementById("post-desc").value.trim();
        
        // Opsiyonel alanlar (Hata vermemesi için kontrol et)
        const elReadTime = document.getElementById("read-time"); // ID html'de read-time idi
        const okumaSuresi = elReadTime ? elReadTime.value : "";
        
        const elTags = document.getElementById("tags-input"); // Basitçe inputtan alalım
        const etiketler = elTags ? elTags.value : "";
        
        const elFeatured = document.getElementById("post-featured");
        const oneCikan = elFeatured ? elFeatured.checked : false;

        // --- Editör İçeriği ---
        // Quill instance'ı yoksa innerHTML'den, varsa root'tan al
        let editorIcerik = "";
        if (window.myQuill) {
            editorIcerik = window.myQuill.root.innerHTML;
        } else {
            const editorEl = document.querySelector('#editor-container .ql-editor');
            editorIcerik = editorEl ? editorEl.innerHTML : "";
        }

        // --- Kontroller ---
        if (!baslik) throw new Error("Lütfen bir başlık giriniz.");
        if (!editorIcerik || editorIcerik === "<p><br></p>" || !editorIcerik.trim()) throw new Error("Yazı içeriği boş olamaz.");

        // --- Veri Paketi ---
        const postData = {
            action: "add_post",
            baslik: baslik,
            icerik: editorIcerik,
            resim: resimUrl,
            tarih: tarih,
            kategori: kategori,
            ozet: ozet,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: okumaSuresi,
            etiketler: etiketler,
            one_cikan: oneCikan
        };

        // --- API İsteği ---
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        alert("✅ Yazı başarıyla gönderildi!");
        
        // --- Temizlik ---
        document.getElementById("add-post-form").reset();
        if(window.myQuill) window.myQuill.setContents([]); 
        
        // Listeyi yenile (eğer aynı sayfadaysak)
        if(document.getElementById('posts-table-body')) {
            setTimeout(fetchPosts, 1500);
        }

    } catch (error) {
        console.error(error);
        alert("Hata: " + error.message);
    } finally {
        if (btnSubmit) { 
            btnSubmit.innerText = originalText; 
            btnSubmit.disabled = false; 
        }
    }
};

// --- 4. YAZILARI LİSTELEME (GET) ---
async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);

        tbody.innerHTML = '';
        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Henüz yazı yok.</td></tr>';
            return;
        }
        
        // Ters sırala (En yeni en üstte)
        posts.reverse().forEach(post => {
            const tr = document.createElement('tr');
            
            // Görsel Kontrolü
            let imgTag = '<div style="width:40px; height:40px; background:#334155; border-radius:4px;"></div>';
            if(post.resim) {
                // Eğer fontawesome ikonuysa
                if(post.resim.startsWith('fa-')) {
                    imgTag = `<div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:#1e293b; border-radius:4px;"><i class="${post.resim}" style="color:white;"></i></div>`;
                } else {
                    imgTag = `<img src="${post.resim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">`;
                }
            }
            
            tr.innerHTML = `
                <td>${imgTag}</td>
                <td style="color:white; font-weight:500;">${post.baslik}</td>
                <td>${post.kategori}</td>
                <td><span style="padding:4px 8px; background:${post.durum === 'Taslak' ? '#f59e0b' : '#10b981'}; border-radius:4px; font-size:0.8rem; color:white;">${post.durum || 'Yayında'}</span></td>
                <td>
                    <button class="action-btn delete-btn" onclick="deletePost('${post.id}', this)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Fetch Hatası:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
    }
}

// --- 5. YAZI SİLME (DELETE) ---
window.deletePost = async (id, btnElement) => {
    if(!confirm("Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?")) return;
    
    // UI Feedback
    const icon = btnElement.querySelector('i');
    const oldClass = icon.className;
    icon.className = "fa-solid fa-spinner fa-spin";
    btnElement.disabled = true;

    const formData = {
        action: "delete_row",
        type: "posts",
        id: id
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        alert("Silme isteği gönderildi.");
        // Listeyi yenile
        setTimeout(fetchPosts, 1500);

    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Hata: " + error);
        icon.className = oldClass;
        btnElement.disabled = false;
    }
};

// Arama fonksiyonu (Basit HTML filtreleme)
window.filterPosts = () => {
    const input = document.getElementById('search-posts');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.posts-table');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const td = tr[i].getElementsByTagName('td')[1]; // Başlık sütunu
        if (td) {
            const txtValue = td.textContent || td.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
};
