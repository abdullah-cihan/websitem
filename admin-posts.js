/* ADMIN POSTS MANAGER */

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    if(document.getElementById('posts-table-body')) fetchPosts();
});

function initQuill() {
    if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
        window.myQuill = new Quill('#editor-container', { theme: 'snow', placeholder: 'İçerik...' });
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
    const oldText = btn ? btn.innerText : "";
    if(btn) { btn.innerText = "Gönderiliyor..."; btn.disabled = true; }
    
    try {
        const baslik = document.getElementById("post-title").value;
        const editorContent = window.myQuill ? window.myQuill.root.innerHTML : "";
        
        if(!baslik || !editorContent || editorContent === "<p><br></p>") { 
            throw new Error("Başlık ve içerik zorunlu."); 
        }

        const postData = {
            auth: window.API_KEY, // 🔑 GÜVENLİK
            action: "add_post",
            baslik: baslik,
            icerik: editorContent,
            resim: document.getElementById("post-image").value,
            tarih: document.getElementById("post-date").value,
            kategori: document.getElementById("post-category").value,
            ozet: document.getElementById("post-desc").value,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: document.getElementById("read-time").value,
            etiketler: document.getElementById("tags-input").value,
            one_cikan: document.getElementById("post-featured").checked
        };

        // ✅ CORS ÇÖZÜMÜ: text/plain
        // Düzeltme: window.API_URL kullanıldı
        await fetch(window.API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(postData)
        });

        alert("✅ İşlem Google Sheets'e iletildi!");
        document.getElementById("add-post-form").reset();
        window.myQuill.setContents([]);
        if(document.getElementById('posts-table-body')) setTimeout(fetchPosts, 2000);

    } catch (e) {
        alert("Hata: " + e.message);
    } finally {
        if(btn) { btn.innerText = oldText || "Kaydet"; btn.disabled = false; }
    }
};

async function fetchPosts() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Yükleniyor...</td></tr>';
    
    try {
        // Düzeltme: window.API_URL kullanıldı
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        tbody.innerHTML = '';
        if(posts.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Kayıt yok.</td></tr>'; return; }

        posts.reverse().forEach(p => {
            let img = p.resim.startsWith('http') ? `<img src="${p.resim}" width="40" style="border-radius:4px">` : `<i class="${p.resim}"></i>`;
            tbody.innerHTML += `
                <tr>
                    <td>${img}</td>
                    <td>${p.baslik}</td>
                    <td>${p.kategori}</td>
                    <td>${p.durum}</td>
                    <td><button onclick="deletePost('${p.id}', this)" class="action-btn"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
        });
    } catch(e) { console.error(e); tbody.innerHTML = '<tr><td colspan="5" style="color:red">Veri çekilemedi.</td></tr>'; }
}

// 👇 EKSİK OLAN FONKSİYON TANIMI BURAYA EKLENDİ VE DÜZELTİLDİ
window.deletePost = async (id, btn) => {
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    
    // Butona efekt verelim
    if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        // Düzeltme: window.API_URL ve window.API_KEY kullanıldı
        await fetch(window.API_URL, { 
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                auth: window.API_KEY, // 👈 KİLİT
                action: "delete_row",
                type: "posts",
                id: id
            })
        });
        
        alert("Silme isteği gönderildi.");
        setTimeout(fetchPosts, 2000);

    } catch (e) {
        alert("Hata: " + e);
        if(btn) btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
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
