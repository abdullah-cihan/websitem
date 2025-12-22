/* admin-posts.js - KAPSAMSIZ (GARANTİ) VERSİYON */

console.log("Admin Posts Script Başlatıldı...");

// Sayfa yüklendiğinde bu uyarıyı görmüyorsanız dosya yüklenmiyor demektir.
// Çalıştığını teyit edince bu satırı silebilirsiniz:
// alert("Script Yüklendi!"); 

const DEFAULT_CATEGORIES = ['Python', 'Teknoloji', 'Felsefe', 'Yazılım', 'Kariyer', 'Video'];
const WORKER_URL = "https://github-posts-api.abdullahcihan21.workers.dev";

// Değişkenleri global yapıyoruz ki erişim sorunu olmasın
window.AppState = {
  blogPosts: [],
  categories: [],
  editModeIndex: null,
  tags: [],
  quill: null,
};

function getCore() {
  return window.AdminCore;
}

function ensureCore() {
  if (!window.AdminCore) {
    console.error('AdminCore (admin.js) yüklenmemiş veya bulunamadı!');
    alert("Hata: admin.js dosyası yüklenemedi. Sayfayı yenileyin.");
    return false;
  }
  return true;
}

function getAdminKey() {
  return sessionStorage.getItem("admin_key") || "";
}

// =========================
// ANA KAYDETME FONKSİYONU
// =========================
// Bu fonksiyonu doğrudan window'a atıyoruz.
window.savePostRemote = async function(status) {
    console.log("Butona basıldı. Durum:", status);

    // 1. AdminCore kontrolü
    if (!ensureCore()) return;

    // 2. Anahtar kontrolü
    if (!getAdminKey()) {
        alert("Oturum süreniz dolmuş veya Admin Key eksik. Lütfen çıkış yapıp tekrar girin.");
        return;
    }

    // 3. Form verilerini al
    const titleEl = document.getElementById('post-title');
    const categoryEl = document.getElementById('post-category');
    
    if (!titleEl || !categoryEl) {
        alert("Hata: HTML elementleri bulunamadı (post-title veya post-category).");
        return;
    }

    const title = titleEl.value.trim();
    const category = categoryEl.value.trim();
    const date = document.getElementById('post-date')?.value || new Date().toLocaleDateString('tr-TR');
    const icon = document.getElementById('post-image')?.value.trim() || '';
    const desc = document.getElementById('post-desc')?.value.trim() || '';
    const isFeatured = document.getElementById('post-featured')?.checked || false;

    // Quill editöründen içerik al
    let content = '';
    let plainText = '';
    
    if (window.AppState.quill) {
        content = window.AppState.quill.root.innerHTML;
        plainText = window.AppState.quill.getText().trim();
    }

    // 4. Doğrulama
    if (!title) { alert('Lütfen yazı başlığını girin.'); return; }
    if (!category) { alert('Lütfen bir kategori seçin.'); return; }
    if (status !== 'draft' && !plainText) { alert('Yazı içeriği boş olamaz.'); return; }

    const postData = {
        title,
        date,
        category,
        icon,
        desc,
        content,
        tags: window.AppState.tags,
        isFeatured,
        status: status,
        linkType: 'internal',
        url: ''
    };

    // 5. API İsteği Gönder
    try {
        // Butonu geçici olarak kilitle (çift tıklamayı önle)
        const btn = document.activeElement;
        if(btn) btn.disabled = true;

        if (window.AppState.editModeIndex !== null) {
            // Güncelleme Modu
            window.AppState.blogPosts[window.AppState.editModeIndex] = { 
                ...window.AppState.blogPosts[window.AppState.editModeIndex], 
                ...postData 
            };
            await apiPutAllPosts(window.AppState.blogPosts);
            alert("✅ Yazı başarıyla güncellendi!");
        } else {
            // Yeni Ekleme Modu
            await apiAddPost(postData);
            alert(status === 'draft' ? "✅ Taslak kaydedildi." : "✅ Yazı yayınlandı!");
        }

        // Listeyi yenile
        window.AppState.blogPosts = await apiGetPosts();
        renderPostsTable();
        resetPostForm();
        
        // Listeye geri dön
        if (window.showSection) window.showSection('posts');

    } catch (error) {
        console.error("Kaydetme Hatası:", error);
        alert("Hata oluştu: " + error.message);
    } finally {
        // Buton kilidini aç
        const btn = document.activeElement;
        if(btn) btn.disabled = false;
    }
};

// =========================
// API HELPERS
// =========================
async function apiGetPosts() {
  const res = await fetch(`${WORKER_URL}/posts`, {
    method: "GET",
    headers: { "X-ADMIN-KEY": getAdminKey() },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data.posts) ? data.posts : [];
}

async function apiAddPost(post) {
  const res = await fetch(`${WORKER_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ADMIN-KEY": getAdminKey() },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPutAllPosts(posts) {
  const res = await fetch(`${WORKER_URL}/posts/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ADMIN-KEY": getAdminKey() },
    body: JSON.stringify({ posts }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// =========================
// DİĞER FONKSİYONLAR
// =========================

window.addNewCategory = function() {
    const name = prompt('Yeni kategori adı:');
    if (!name) return;
    window.AppState.categories.unshift(name);
    if(window.AdminCore) window.AdminCore.writeLS('categories', window.AppState.categories);
    renderCategorySelect();
};

window.editPost = function(index) {
    const post = window.AppState.blogPosts[index];
    if (!post) return;
    window.AppState.editModeIndex = index;

    document.getElementById('post-title').value = post.title || '';
    document.getElementById('post-date').value = post.date || '';
    document.getElementById('post-category').value = post.category || '';
    document.getElementById('post-image').value = post.icon || '';
    document.getElementById('post-desc').value = post.desc || '';
    document.getElementById('post-featured').checked = !!post.isFeatured;

    window.AppState.tags = post.tags ? [...post.tags] : [];
    renderTags();
    
    if (window.AppState.quill) {
        window.AppState.quill.root.innerHTML = post.content || '';
    }

    if(window.showSection) window.showSection('new-post');
};

window.deletePost = async function(index) {
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
        window.AppState.blogPosts.splice(index, 1);
        await apiPutAllPosts(window.AppState.blogPosts);
        renderPostsTable();
    } catch(e) {
        alert("Silinemedi: " + e.message);
    }
};

function renderCategorySelect() {
    const sel = document.getElementById('post-category');
    if (!sel) return;
    sel.innerHTML = '';
    window.AppState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        sel.appendChild(opt);
    });
}

function renderTags() {
    const list = document.getElementById('tags-list');
    if(!list) return;
    list.innerHTML = '';
    window.AppState.tags.forEach((tag, idx) => {
        const li = document.createElement('li');
        li.className = 'tag-chip';
        li.innerHTML = `${tag} <i class="fa-solid fa-xmark" onclick="removeTag(${idx})"></i>`;
        list.appendChild(li);
    });
}

// Etiket silme fonksiyonu (HTML içinden çağrılabilmesi için window'a ekledik)
window.removeTag = function(idx) {
    window.AppState.tags.splice(idx, 1);
    renderTags();
}

function renderPostsTable() {
    const tbody = document.getElementById('posts-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    window.AppState.blogPosts.forEach((post, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><i class="fa-solid fa-image"></i></td>
            <td>${post.title}</td>
            <td>${post.category}</td>
            <td>${post.status}</td>
            <td>
                <button onclick="window.deletePost(${i})" class="btn-delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        // Tıklayınca düzenle
        tr.onclick = (e) => {
            if(!e.target.closest('button')) window.editPost(i);
        };
        tbody.appendChild(tr);
    });
    
    const countEl = document.getElementById('total-posts-count');
    if(countEl) countEl.innerText = window.AppState.blogPosts.length;
}

function resetPostForm() {
    window.AppState.editModeIndex = null;
    document.getElementById('add-post-form').reset();
    window.AppState.tags = [];
    renderTags();
    if(window.AppState.quill) window.AppState.quill.setText('');
}

// =========================
// BAŞLATMA (INIT)
// =========================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Yüklendi. Başlatılıyor...");
    
    if(window.AdminCore) {
        window.AppState.categories = window.AdminCore.readArrayLS('categories', DEFAULT_CATEGORIES);
    } else {
        window.AppState.categories = [...DEFAULT_CATEGORIES];
    }

    // Editör Kurulumu
    if (document.getElementById('editor-container') && window.Quill) {
        window.AppState.quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'İçerik...',
            modules: {
                toolbar: [
                    [{ header: [2, 3, false] }],
                    ['bold', 'italic', 'underline', 'code-block'],
                    ['link', 'blockquote', 'image'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                ]
            }
        });
    }

    // Tag Input
    const tInput = document.getElementById('tags-input');
    if(tInput) {
        tInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                const val = tInput.value.trim();
                if(val) {
                    window.AppState.tags.push(val);
                    renderTags();
                    tInput.value = '';
                }
            }
        });
    }

    renderCategorySelect();

    // Verileri Çek
    try {
        if(getAdminKey()) {
            window.AppState.blogPosts = await apiGetPosts();
            renderPostsTable();
        }
    } catch(e) {
        console.error("Veri çekilemedi:", e);
    }
});
window.savePost = window.savePostRemote;
