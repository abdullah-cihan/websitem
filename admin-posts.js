/* ADMIN POSTS MANAGER (FIXED & SECURE V2) */

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
});

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

// ==========================================
// YAZI KAYDETME FONKSİYONU (GÜNCELLENDİ)
// ==========================================
window.savePost = async (status) => {
    // 1. ÖNCE TOKEN KONTROLÜ
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        window.location.href = "login.html";
        return;
    }

    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    const oldText = btn ? btn.innerText : "Kaydet";
    
    if(btn) { btn.innerText = "Gönderiliyor..."; btn.disabled = true; }
    
    try {
        const baslik = document.getElementById("post-title").value;
        const editorContent = window.myQuill ? window.myQuill.root.innerHTML : "";
        
        if(!baslik || !editorContent || editorContent === "<p><br></p>") { 
            throw new Error("Başlık ve içerik zorunlu."); 
        }

        // Tarih kontrolü
        let tarihVal = document.getElementById("post-date").value;
        if(!tarihVal) {
            const now = new Date();
            tarihVal = now.toISOString().split('T')[0]; 
        }

        const postData = {
            action: "add_post",
            token: token, // Token burada gönderiliyor
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

        // 2. FETCH İSTEĞİ ('no-cors' KALDIRILDI)
        const response = await fetch(window.API_URL, {
            method: "POST",
            // mode: "no-cors", <--- BU SATIR HATALARI GİZLİYORDU, SİLDİK.
            body: JSON.stringify(postData)
        });

        // 3. YANITI OKU VE KONTROL ET
        const result = await response.json();

        if (result.ok) {
            alert("✅ Yazı başarıyla kaydedildi!");
            
            // Formu temizle
            document.getElementById("add-post-form").reset();
            window.myQuill.setContents([]);
            document.getElementById("post-date").valueAsDate = new Date();

            // Listeyi yenile
            if(document.getElementById('posts-table-body')) setTimeout(fetchPosts, 1000);
        } else {
            // Backend'den hata geldiyse göster
            throw new Error(result.error || "Bilinmeyen bir hata oluştu.");
        }

    } catch (e) {
        console.error("Save Post Hatası:", e);
        alert("HATA: " + e.message);
        
        // Eğer token geçersizse login'e at
        if(e.message.includes("YETKİSİZ") || e.message.includes("Token")) {
            window.location.href = "login.html";
        }
    } finally {
        if(btn) { btn.innerText = oldText; btn.disabled = false; }
    }
};

// ==========================================
// YAZILARI LİSTELEME
// ==========================================
async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        tbody.innerHTML = '';
        if(posts.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Kayıt yok.</td></tr>'; return; }

        posts.reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') ? `<img src="${p.resim}" width="40" style="border-radius:4px">` : `<i class="fa-solid fa-image"></i>`;
            
            let tarihGoster = p.tarih;
            try {
                if(p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0];
            } catch(err){}

            tbody.innerHTML += `
                <tr>
                    <td>${img}</td>
                    <td>${p.baslik}</td>
                    <td>${p.kategori}</td>
                    <td>${p.durum}</td>
                    <td>
                        <button onclick="deletePost('${p.id}', this)" class="action-btn" title="Sil"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Veri çekilemedi. Bağlantıyı kontrol edin.</td></tr>'; 
    }
}

// ==========================================
// YAZI SİLME FONKSİYONU (GÜNCELLENDİ)
// ==========================================
window.deletePost = async (id, btn) => {
    // 1. TOKEN KONTROLÜ
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Hata: Token bulunamadı. Lütfen giriş yapın.");
        return;
    }

    if(!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        // 2. FETCH İSTEĞİ ('no-cors' KALDIRILDI)
        const response = await fetch(window.API_URL, { 
            method: "POST",
            // mode: "no-cors", <--- SİLDİK
            body: JSON.stringify({
                token: token,
                action: "delete_row",
                type: "posts",
                id: id
            })
        });
        
        // 3. YANIT KONTROLÜ
        const result = await response.json();

        if (result.ok) {
            // UX için satırı silik yap
            const row = btn.closest('tr');
            if(row) row.style.opacity = "0.3";
            
            setTimeout(() => {
                fetchPosts(); // Listeyi yenile
                alert("Silme işlemi tamamlandı.");
            }, 1000);
        } else {
            throw new Error(result.error || "Silinemedi.");
        }

    } catch (e) {
        alert("Hata: " + e.message);
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
