/* ADMIN POSTS MANAGER (UPDATED - EDIT MODE UI ENHANCED) */

// Düzenleme işlemi için global değişkenler
let allPostsData = []; // Tüm yazıları burada tutacağız
let editingPostId = null; // Şu an düzenlenen yazının ID'si (null ise yeni yazı)

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    // Eğer tablo varsa yazıları çek
    if(document.getElementById('posts-table-body')) fetchPosts();
    
    // Tarih alanına bugünün tarihini otomatik ver
    const dateInput = document.getElementById('post-date');
    if(dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // "Vazgeç" butonunu oluştur
    const formActions = document.querySelector('.form-actions');
    // Eğer .form-actions yoksa formun sonuna eklemeyi dene
    const targetContainer = formActions || document.getElementById('add-post-form');
    
    if(targetContainer && !document.getElementById('btn-cancel')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'btn-cancel';
        cancelBtn.innerText = 'Vazgeç';
        cancelBtn.className = 'btn-secondary'; // CSS class varsayımı
        cancelBtn.style.display = 'none'; // Başlangıçta gizli
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.style.cursor = 'pointer';
        // Buton tipini button yapalım ki formu submit etmesin
        cancelBtn.type = 'button';
        cancelBtn.onclick = (e) => { e.preventDefault(); cancelEdit(); };
        
        if(formActions) formActions.appendChild(cancelBtn);
        else targetContainer.appendChild(cancelBtn);
    }
});

function initQuill() {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        window.myQuill = new Quill('#editor-container', { theme: 'snow', placeholder: 'İçerik buraya...' });

        // --- OTOMATİK OKUMA SÜRESİ ---
        window.myQuill.on('text-change', function() {
            const text = window.myQuill.getText();
            const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
            const wpm = 200; 
            const minutes = Math.ceil(wordCount / wpm);
            
            const timeInput = document.getElementById('read-time');
            if(timeInput) {
                timeInput.value = (minutes < 1 ? 1 : minutes) + " dk";
            }
        });
        // -----------------------------
    }
}

function loadCategories() {
    const select = document.getElementById('post-category');
    if(!select) return;
    let cats = JSON.parse(localStorage.getItem('categories') || '["Genel","Teknoloji","Yazılım"]');
    select.innerHTML = '';
    cats.forEach(c => { const o = document.createElement('option'); o.value=c; o.innerText=c; select.appendChild(o); });
}

window.addNewCategory = () => {
    const n = prompt("Kategori adı:");
    if(n) {
        let cats = JSON.parse(localStorage.getItem('categories')||'[]');
        cats.push(n); localStorage.setItem('categories', JSON.stringify(cats));
        loadCategories();
        document.getElementById('post-category').value = n;
    }
};

// Düzenleme Modunu Başlat
window.startEdit = (id) => {
    const post = allPostsData.find(p => p.id == id);
    if(!post) return;

    editingPostId = id; // ID'yi kaydet
    
    // Formu Doldur
    document.getElementById("post-title").value = post.baslik || "";
    document.getElementById("post-image").value = post.resim || "";
    document.getElementById("post-category").value = post.kategori || "";
    document.getElementById("post-desc").value = post.ozet || "";
    document.getElementById("read-time").value = post.okuma_suresi || "";
    document.getElementById("tags-input").value = post.etiketler || "";
    document.getElementById("post-featured").checked = post.one_cikan === true || post.one_cikan === "true";
    
    // Tarih formatını ayarla (YYYY-MM-DD)
    if(post.tarih) {
        try {
            document.getElementById("post-date").value = post.tarih.split('T')[0];
        } catch(e) {}
    }

    // Editör içeriğini doldur
    if(window.myQuill) {
        window.myQuill.root.innerHTML = post.icerik || "";
    }

    // UI Değişiklikleri - GÜNCELLEME MODU GÖRSELLİĞİ
    const form = document.getElementById("add-post-form");
    if(form) {
        form.style.border = "2px solid #3498db"; // Mavi çerçeve ile edit modunu vurgula
        form.style.padding = "15px";
        form.style.borderRadius = "8px";
        
        // Form başlığını bulup değiştir (Opsiyonel, eğer h2 varsa)
        const formHeader = form.querySelector('h2') || document.querySelector('.card-header h2');
        if(formHeader) {
            if(!formHeader.dataset.original) formHeader.dataset.original = formHeader.innerText;
            formHeader.innerText = "Yazıyı Düzenle: " + post.baslik;
            formHeader.style.color = "#3498db";
        }
    }

    const submitBtn = document.querySelector('.btn-submit');
    if(submitBtn) {
        submitBtn.innerText = "Güncelle";
        submitBtn.classList.add('btn-warning'); // Varsa renk değiştir
    }
    
    const cancelBtn = document.getElementById('btn-cancel');
    if(cancelBtn) cancelBtn.style.display = 'inline-block';

    // Sayfayı yukarı kaydır ve başlığa odaklan
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById("post-title").focus(), 500);
};

// Düzenlemeyi İptal Et
window.cancelEdit = () => {
    editingPostId = null;
    document.getElementById("add-post-form").reset();
    if(window.myQuill) window.myQuill.setContents([]);
    document.getElementById("post-date").valueAsDate = new Date();

    // UI Değişikliklerini Geri Al
    const form = document.getElementById("add-post-form");
    if(form) {
        form.style.border = "none";
        form.style.padding = "0"; // Orijinal padding'e döner (CSS'ten geliyorsa sorun olmaz ama inline siliyoruz)
        
        const formHeader = form.querySelector('h2') || document.querySelector('.card-header h2');
        if(formHeader && formHeader.dataset.original) {
            formHeader.innerText = formHeader.dataset.original;
            formHeader.style.color = "";
        }
    }

    const submitBtn = document.querySelector('.btn-submit');
    if(submitBtn) {
        submitBtn.innerText = "Yazıyı Yayınla";
        submitBtn.classList.remove('btn-warning');
    }
    
    const cancelBtn = document.getElementById('btn-cancel');
    if(cancelBtn) cancelBtn.style.display = 'none';
};

window.savePost = async (status) => {
    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    const oldText = btn ? btn.innerText : "Kaydet";
    
    if(btn) { btn.innerText = "İşleniyor..."; btn.disabled = true; }
    
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

        let okumaSuresi = document.getElementById("read-time").value;
        if(!okumaSuresi) okumaSuresi = "1 dk";

        // --- ACTION BELİRLEME ---
        // Eğer editingPostId doluysa 'edit_post', boşsa 'add_post' gönderiyoruz.
        const actionType = editingPostId ? "edit_post" : "add_post";

        const postData = {
            auth: window.API_KEY,
            action: actionType, // Dinamik action
            id: editingPostId,  // Düzenliyorsak ID'yi gönder
            baslik: baslik,
            icerik: editorContent,
            resim: document.getElementById("post-image").value,
            tarih: tarihVal,
            kategori: document.getElementById("post-category").value,
            ozet: document.getElementById("post-desc").value,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: okumaSuresi,
            etiketler: document.getElementById("tags-input").value,
            one_cikan: document.getElementById("post-featured").checked
        };

        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        alert(editingPostId ? "✅ Yazı güncellendi!" : "✅ Yazı başarıyla oluşturuldu!");
        
        // İşlem bitince formu ve düzenleme modunu sıfırla
        cancelEdit(); 

        if(document.getElementById('posts-table-body')) setTimeout(fetchPosts, 2000);

    } catch (e) {
        alert("Hata: " + e.message);
    } finally {
        if(btn) { btn.innerText = oldText; btn.disabled = false; }
    }
};

async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        allPostsData = data.posts || []; // Verileri global değişkene kaydet
        
        tbody.innerHTML = '';
        if(allPostsData.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Kayıt yok.</td></tr>'; return; }

        // Diziyi ters çevirip (en yeni en üstte) listele
        [...allPostsData].reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') ? `<img src="${p.resim}" width="40" style="border-radius:4px">` : `<i class="fa-solid fa-image"></i>`;
            
            tbody.innerHTML += `
                <tr>
                    <td>${img}</td>
                    <td>${p.baslik}</td>
                    <td>${p.kategori}</td>
                    <td>${p.durum}</td>
                    <td>
                        <button onclick="startEdit('${p.id}')" class="action-btn edit-btn" title="Düzenle" style="margin-right:5px; color:#3498db;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deletePost('${p.id}', this)" class="action-btn" title="Sil" style="color:#e74c3c;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Veri çekilemedi. Bağlantıyı kontrol edin.</td></tr>'; 
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
