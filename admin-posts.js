/* ADMIN POSTS MANAGER (FIXED) */

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    // Eğer tablo varsa yazıları çek
    if(document.getElementById('posts-table-body')) fetchPosts();
    
    // Tarih alanına bugünün tarihini otomatik ver (Boş kalmasın)
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

window.savePost = async (status) => {
    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    const oldText = btn ? btn.innerText : "Kaydet";
    
    if(btn) { btn.innerText = "Gönderiliyor..."; btn.disabled = true; }
    
    try {
        const baslik = document.getElementById("post-title").value;
        const editorContent = window.myQuill ? window.myQuill.root.innerHTML : "";
        
        if(!baslik || !editorContent || editorContent === "<p><br></p>") { 
            throw new Error("Başlık ve içerik zorunlu."); 
        }

        // Tarih kontrolü: Boşsa bugünü seç
        let tarihVal = document.getElementById("post-date").value;
        if(!tarihVal) {
            const now = new Date();
            tarihVal = now.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        const postData = {
            action: "add_post",
            token: localStorage.getItem('adminToken'),
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

        // window.API_URL kullandığımızdan emin olalım
        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        alert("✅ Yazı başarıyla gönderildi!");
        
        // Formu temizle
        document.getElementById("add-post-form").reset();
        window.myQuill.setContents([]);
        
        // Tarihi tekrar bugüne ayarla
        document.getElementById("post-date").valueAsDate = new Date();

        // Eğer liste sayfasındaysak listeyi yenile
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
        // window.API_URL kullanıyoruz
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        tbody.innerHTML = '';
        if(posts.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Kayıt yok.</td></tr>'; return; }

        posts.reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') ? `<img src="${p.resim}" width="40" style="border-radius:4px">` : `<i class="fa-solid fa-image"></i>`;
            
            // Tarihi düzgün göster
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
                auth: window.API_KEY, // 🔑 GÜVENLİK
                action: "delete_row",
                type: "posts",
                id: id
            })
        });
        
        // İşlem başarılı kabul edip satırı silelim (UX için)
        const row = btn.closest('tr');
        if(row) row.style.opacity = "0.3";
        
        setTimeout(() => {
            fetchPosts(); // Listeyi yenile
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
