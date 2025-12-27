/* ADMIN POSTS MANAGER (FIXED: NEW POST BUTTON & RESET LOGIC) */

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

    // Düzenleme/Yeni Ekle butonlarını ayarla
    setupFormButtons();
});

// "Yeni Yazı Ekle / Vazgeç" butonunu oluşturur
function setupFormButtons() {
    const actionDiv = document.querySelector('.form-actions');
    if(actionDiv && !document.getElementById('btn-cancel-edit')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'btn-cancel-edit';
        cancelBtn.innerText = "Yeni Yazı Ekle (Vazgeç)";
        // Stil: Koyu gri arka plan, beyaz yazı, başlangıçta gizli
        cancelBtn.style.cssText = "display:none; margin-left:10px; background-color:#6c757d; color:white; padding:10px 15px; border:none; border-radius:4px; cursor:pointer;";
        
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            startNewPost(); // Formu sıfırlar ve yeni moda geçer
        };
        actionDiv.appendChild(cancelBtn);
    }
}

// Global "Yeni Yazı Başlat" fonksiyonu (HTML'den de çağrılabilir)
window.startNewPost = () => {
    resetForm();
    // Kullanıcıya hissettirmek için ufak bir bildirim veya odaklanma
    document.getElementById("post-title").focus();
    // alert("Yeni yazı modu aktif. Alanlar temizlendi."); // İstenirse açılabilir
};

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

// Formu tamamen temizler ve "Yeni Ekle" moduna alır
window.resetForm = () => {
    currentEditingId = null; // ID'yi sıfırla (Artık yeni kayıt modu)
    
    // HTML Formunu sıfırla (Inputlar, Selectler vb.)
    const form = document.getElementById("add-post-form");
    if(form) form.reset();
    
    // Quill Editörü sıfırla
    if(window.myQuill) window.myQuill.setContents([]);
    
    // Tarihi tekrar bugüne ayarla
    const dateInput = document.getElementById("post-date");
    if(dateInput) dateInput.valueAsDate = new Date();
    
    // Buton metnini "Yayımla" yap
    const submitBtn = document.querySelector('.btn-submit');
    if(submitBtn) {
        submitBtn.innerText = "Yayımla";
        submitBtn.disabled = false;
    }
    
    // Vazgeç butonunu gizle (Zaten yeni moddayız)
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.style.display = "none";
    
    // Sayfanın başına kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Tıklanan yazıyı forma doldurur (Düzenleme Modu)
window.loadPostIntoEditor = (id) => {
    const post = allFetchedPosts.find(p => String(p.id) === String(id));
    
    if(!post) {
        console.error("Yazı bulunamadı ID:", id);
        alert("Veri bulunamadı! Sayfayı yenileyin.");
        return;
    }

    currentEditingId = post.id; // Düzenlenen ID'yi sakla

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

    // Buton metnini değiştir ve "Yeni Yazı Ekle" butonunu göster
    const submitBtn = document.querySelector('.btn-submit');
    if(submitBtn) submitBtn.innerText = "Güncelle";
    
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) {
        cancelBtn.style.display = "inline-block";
        cancelBtn.innerText = "Yeni Yazı Ekle (Temizle)"; // Metni güncelle
    }

    // Sayfayı yukarı form alanına kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Kaydetme / Güncelleme Fonksiyonu
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

        // Backend işlemi: ID varsa 'edit_post', yoksa 'add_post'
        const actionType = isEdit ? "edit_post" : "add_post";

        const postData = {
            auth: window.API_KEY, 
            action: actionType,
            id: currentEditingId, // Yeni eklemede null, düzenlemede ID
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
        
        startNewPost(); // İşlem bitince formu temizle ve yeni moda geç

        if(document.getElementById('posts-table-body')) {
            setTimeout(fetchPosts, 1500); 
        }

    } catch (e) {
        alert("Hata: " + e.message);
    } finally {
        if(btn) { btn.innerText = oldText; btn.disabled = false; }
    }
};

// Hızlıca Taslağa Çekme Fonksiyonu
window.setQuickDraft = async (id, btn) => {
    if(!confirm("Bu yazıyı yayından kaldırıp TASLAK durumuna getirmek istiyor musunuz?")) return;
    
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const currentPost = allFetchedPosts.find(p => String(p.id) === String(id));
        
        if (!currentPost) throw new Error("Yazı verisi bulunamadı.");

        const postData = {
            auth: window.API_KEY,
            action: "edit_post",
            id: currentPost.id,
            baslik: currentPost.baslik,
            icerik: currentPost.icerik,
            resim: currentPost.resim,
            tarih: currentPost.tarih,
            kategori: currentPost.kategori,
            ozet: currentPost.ozet,
            durum: "Taslak",
            okuma_suresi: currentPost.okuma_suresi,
            etiketler: currentPost.etiketler,
            one_cikan: currentPost.one_cikan
        };

        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        alert("Yazı başarıyla taslağa çekildi.");
        setTimeout(fetchPosts, 1500);

    } catch(e) {
        alert("İşlem Başarısız: " + e.message);
        btn.innerHTML = oldIcon;
        btn.disabled = false;
    }
};

async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        allFetchedPosts = posts; 

        if(posts.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Kayıt yok.</td></tr>'; 
            return; 
        }

        let htmlBuffer = "";
        
        posts.reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') 
                ? `<img src="${p.resim}" width="40" height="40" style="object-fit:cover; border-radius:4px">` 
                : `<i class="fa-solid fa-image" style="color:#ccc; font-size:1.5em;"></i>`;
            
            let tarihGoster = p.tarih;
            if(p.tarih && p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0];

            const statusBadge = p.durum === 'Yayında' 
                ? `<span style="color:#155724; background-color:#d4edda; padding:4px 8px; border-radius:12px; font-size:0.85em; font-weight:600;">Yayında</span>` 
                : `<span style="color:#856404; background-color:#fff3cd; padding:4px 8px; border-radius:12px; font-size:0.85em; font-weight:600;">Taslak</span>`;

            const draftBtn = p.durum === 'Yayında' 
                ? `<button onclick="setQuickDraft('${p.id}', this)" class="action-btn" title="Taslağa Çek" style="color:#e67e22; margin-right:5px;"><i class="fa-solid fa-file-pen"></i></button>` 
                : '';

            htmlBuffer += `
                <tr class="post-row" style="background-color: #ffffff; border-bottom: 1px solid #e9ecef; color: #333;">
                    <td style="padding:12px;">${img}</td>
                    <td style="cursor:pointer; padding:12px;" onclick="loadPostIntoEditor('${p.id}')" title="Düzenlemek için tıkla">
                        <span style="color:#212529; font-weight:600; font-size:1em;">${p.baslik}</span>
                        <i class="fa-solid fa-pencil" style="font-size:0.75em; margin-left:8px; color:#0d6efd; opacity:0.7;"></i>
                    </td>
                    <td style="padding:12px;">${p.kategori}</td>
                    <td style="padding:12px;">${statusBadge}</td>
                    <td style="padding:12px; white-space:nowrap;">
                        <button onclick="loadPostIntoEditor('${p.id}')" class="action-btn" title="Düzenle" style="color:#0d6efd; margin-right:5px;"><i class="fa-solid fa-edit"></i></button>
                        ${draftBtn}
                        <button onclick="deletePost('${p.id}', this)" class="action-btn" title="Sil" style="color:#dc3545;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        
        tbody.innerHTML = htmlBuffer;

    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center; padding:20px;">Veri çekilemedi. API URL kontrol edin.</td></tr>'; 
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
        setTimeout(() => { fetchPosts(); alert("Silme işlemi tamamlandı."); }, 1500);
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
