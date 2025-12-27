/* ADMIN POSTS MANAGER (FIXED & OPTIMIZED) */

let currentEditingId = null; // Düzenlenen yazının ID'sini tutar
let allFetchedPosts = [];    // Çekilen tüm yazıları hafızada tutar

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    
    // Tablo varsa verileri çek
    if(document.getElementById('posts-table-body')) fetchPosts();
    
    // Tarih alanına varsayılan olarak bugünü ata
    const dateInput = document.getElementById('post-date');
    if(dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // Düzenleme iptal butonunu ekle
    addCancelButton();
});

// Düzenleme modundan çıkmak için iptal butonu oluşturur
function addCancelButton() {
    const actionDiv = document.querySelector('.form-actions');
    if(actionDiv && !document.getElementById('btn-cancel-edit')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'btn-cancel-edit';
        cancelBtn.innerText = "Düzenlemeyi İptal Et";
        cancelBtn.style.cssText = "display:none; margin-left:10px; background-color:#6c757d; color:white; padding:10px 15px; border:none; border-radius:4px; cursor:pointer;";
        
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            resetForm();
        };
        actionDiv.appendChild(cancelBtn);
    }
}

function initQuill() {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        window.myQuill = new Quill('#editor-container', { theme: 'snow', placeholder: 'İçerik buraya...' });
    }
}

function loadCategories() {
    const select = document.getElementById('post-category');
    if(!select) return;
    let cats = JSON.parse(localStorage.getItem('categories') || '["Genel","Teknoloji","Yazılım"]');
    select.innerHTML = '';
    cats.forEach(c => { 
        const o = document.createElement('option'); 
        o.value = c; 
        o.innerText = c; 
        select.appendChild(o); 
    });
}

window.addNewCategory = () => {
    const n = prompt("Kategori adı:");
    if(n) {
        let cats = JSON.parse(localStorage.getItem('categories')||'[]');
        cats.push(n); 
        localStorage.setItem('categories', JSON.stringify(cats));
        loadCategories();
        document.getElementById('post-category').value = n;
    }
};

// Formu temizler ve düzenleme modundan çıkar
window.resetForm = () => {
    currentEditingId = null;
    document.getElementById("add-post-form").reset();
    
    if(window.myQuill) window.myQuill.setContents([]);
    document.getElementById("post-date").valueAsDate = new Date();
    
    // Butonları eski haline getir
    document.querySelector('.btn-submit').innerText = "Yayımla";
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.style.display = "none";
    
    // Sayfanın başına kaydır (kullanıcı görsün diye)
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Tıklanan yazıyı forma doldurur (Database güncellemesi için ID set edilir)
window.loadPostIntoEditor = (id) => {
    const post = allFetchedPosts.find(p => p.id === id);
    if(!post) return;

    currentEditingId = post.id; // Kritik nokta: ID hafızaya alınır

    // Form alanlarını doldur
    document.getElementById("post-title").value = post.baslik || "";
    document.getElementById("post-image").value = post.resim || "";
    document.getElementById("post-category").value = post.kategori || "Genel";
    document.getElementById("post-desc").value = post.ozet || "";
    document.getElementById("read-time").value = post.okuma_suresi || "";
    document.getElementById("tags-input").value = post.etiketler || "";
    document.getElementById("post-featured").checked = (post.one_cikan === true || post.one_cikan === "true");
    
    // Tarihi ayarla
    if(post.tarih) {
        let dateVal = post.tarih;
        if(post.tarih.includes('T')) dateVal = post.tarih.split('T')[0];
        document.getElementById("post-date").value = dateVal;
    }

    // Editör içeriğini doldur
    if(window.myQuill) {
        window.myQuill.root.innerHTML = post.icerik || "";
    }

    // Buton metnini değiştir ve İptal butonunu göster
    document.querySelector('.btn-submit').innerText = "Güncelle";
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.style.display = "inline-block";

    // Yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Kullanıcıya bilgi ver (isteğe bağlı alert kaldırılabilir)
    // alert("Yazı düzenleme moduna alındı. Değişiklikleri yaptıktan sonra 'Güncelle' butonuna basın.");
};

window.savePost = async (status) => {
    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    
    // Düzenleme mi yoksa yeni mi?
    const isEdit = !!currentEditingId;
    const loadingText = isEdit ? "Güncelleniyor..." : "Gönderiliyor...";
    const oldText = btn ? btn.innerText : "Kaydet";
    
    if(btn) { btn.innerText = loadingText; btn.disabled = true; }
    
    try {
        const baslik = document.getElementById("post-title").value;
        const editorContent = window.myQuill ? window.myQuill.root.innerHTML : "";
        
        if(!baslik || !editorContent || editorContent === "<p><br></p>") { 
            throw new Error("Başlık ve içerik zorunlu."); 
        }

        let tarihVal = document.getElementById("post-date").value;
        if(!tarihVal) {
            const now = new Date();
            tarihVal = now.toISOString().split('T')[0];
        }

        // Backend'e gidecek komut: ID varsa 'edit_post', yoksa 'add_post'
        const actionType = isEdit ? "edit_post" : "add_post";

        const postData = {
            auth: window.API_KEY, 
            action: actionType,
            id: currentEditingId, // Yeni eklemede null gider, düzenlemede ID gider
            baslik: baslik,
            icerik: editorContent,
            resim: document.getElementById("post-image").value,
            tarih: tarihVal,
            kategori: document.getElementById("post-category").value,
            ozet: document.getElementById("post-desc").value,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: document.getElementById("read-time").value,
            etiketler: document.getElementById("tags-input").value,
            one_cikan: document.getElementById("post-featured").checked
        };

        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        const successMsg = isEdit ? "✅ Yazı başarıyla güncellendi!" : "✅ Yazı başarıyla eklendi!";
        alert(successMsg);
        
        resetForm(); // Formu temizle ve modu sıfırla

        if(document.getElementById('posts-table-body')) {
            setTimeout(fetchPosts, 1500); // Tabloyu yenile
        }

    } catch (e) {
        alert("Hata: " + e.message);
    } finally {
        if(btn) { btn.innerText = oldText; btn.disabled = false; }
    }
};

window.setQuickDraft = async (id, btn) => {
    if(!confirm("Bu yazıyı yayından kaldırıp TASLAK durumuna getirmek istiyor musunuz?")) return;
    
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        // Mevcut veriyi hafızadan bul
        const currentPost = allFetchedPosts.find(p => p.id === id);
        
        const postData = {
            auth: window.API_KEY,
            action: "edit_post",
            id: id,
            durum: "Taslak",
            // Veri kaybını önlemek için diğer alanları da mevcut haliyle gönderiyoruz
            baslik: currentPost ? currentPost.baslik : "",
            icerik: currentPost ? currentPost.icerik : "",
            resim: currentPost ? currentPost.resim : "",
            tarih: currentPost ? currentPost.tarih : "",
            kategori: currentPost ? currentPost.kategori : "",
            ozet: currentPost ? currentPost.ozet : "",
            okuma_suresi: currentPost ? currentPost.okuma_suresi : "",
            etiketler: currentPost ? currentPost.etiketler : "",
            one_cikan: currentPost ? currentPost.one_cikan : false
        };

        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        alert("Yazı taslağa çekildi.");
        setTimeout(fetchPosts, 1500);

    } catch(e) {
        alert("Hata: " + e);
        btn.innerHTML = oldIcon;
        btn.disabled = false;
    }
};

async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        allFetchedPosts = posts; // Global hafızayı güncelle

        if(posts.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Kayıt yok.</td></tr>'; 
            return; 
        }

        // Performans için HTML'i önce bir değişkende topla
        let htmlBuffer = "";
        
        posts.reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') 
                ? `<img src="${p.resim}" width="40" height="40" style="object-fit:cover; border-radius:4px">` 
                : `<i class="fa-solid fa-image" style="color:#ccc"></i>`;
            
            // Tarihi düzgün formatla
            let tarihGoster = p.tarih;
            if(p.tarih && p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0];

            const statusBadge = p.durum === 'Yayında' 
                ? `<span style="color:#2ecc71;font-weight:bold;background:#eafaf1;padding:2px 8px;border-radius:12px;font-size:0.85em">Yayında</span>` 
                : `<span style="color:#f39c12;font-weight:bold;background:#fef5e7;padding:2px 8px;border-radius:12px;font-size:0.85em">Taslak</span>`;

            // Taslak butonu sadece yayındaysa görünsün
            const draftBtn = p.durum === 'Yayında' 
                ? `<button onclick="setQuickDraft('${p.id}', this)" class="action-btn" title="Taslağa Çek" style="color:#e67e22"><i class="fa-solid fa-file-pen"></i></button>` 
                : '';

            htmlBuffer += `
                <tr class="post-row">
                    <td>${img}</td>
                    <!-- Başlığa tıklayınca düzenleme fonksiyonunu çağırır -->
                    <td style="cursor:pointer;" onclick="loadPostIntoEditor('${p.id}')" title="Düzenlemek için tıkla">
                        <span style="color:#2c3e50; font-weight:500;">${p.baslik}</span>
                        <i class="fa-solid fa-pencil" style="font-size:0.7em; margin-left:5px; color:#3498db; opacity:0.6;"></i>
                    </td>
                    <td>${p.kategori}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button onclick="loadPostIntoEditor('${p.id}')" class="action-btn" title="Düzenle"><i class="fa-solid fa-edit"></i></button>
                        ${draftBtn}
                        <button onclick="deletePost('${p.id}', this)" class="action-btn" title="Sil" style="color:#e74c3c"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        
        tbody.innerHTML = htmlBuffer;

    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Veri çekilemedi. API URL kontrol edin.</td></tr>'; 
    }
}

window.deletePost = async (id, btn) => {
    if(!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        await fetch(window.API_URL, { 
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                auth: window.API_KEY,
                action: "delete_row",
                type: "posts",
                id: id
            })
        });
        
        const row = btn.closest('tr');
        if(row) row.style.opacity = "0.3";
        
        setTimeout(() => {
            fetchPosts(); 
            alert("Silme işlemi tamamlandı.");
        }, 1500);

    } catch (e) {
        alert("Hata: " + e);
        btn.innerHTML = originalIcon;
        btn.disabled = false;
    }
};

window.filterPosts = () => {
    const filter = document.getElementById('search-posts').value.toLowerCase();
    const rows = document.querySelectorAll('#posts-table-body tr');
    rows.forEach(row => {
        const txt = row.innerText.toLowerCase();
        row.style.display = txt.includes(filter) ? "" : "none";
    });
};
