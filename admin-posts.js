/* ADMIN POSTS MANAGER (TIKLA & DÜZENLE - FINAL FIX) */

let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    fetchPosts();
    
    // Tarih alanına varsayılan olarak bugünü ver
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
    let cats = JSON.parse(localStorage.getItem('categories') || '["Genel","Teknoloji","Yazılım","Felsefe","Ekonomi","Sanat"]');
    select.innerHTML = '';
    cats.forEach(c => { 
        const o = document.createElement('option'); o.value=c; o.innerText=c; select.appendChild(o); 
    });
}

// ==========================================
// 1. YAZILARI LİSTELEME (DÜZELTİLDİ)
// ==========================================
async function fetchPosts() {
    // Eski tabloyu gizle
    const tableBody = document.getElementById('posts-table-body');
    if(tableBody) {
        const table = tableBody.closest('table');
        if(table) table.style.display = 'none';
    }

    // Liste alanını hazırla
    let container = document.getElementById('post-list-container');
    if (!container && tableBody) {
        container = document.createElement('div');
        container.id = 'post-list-container';
        container.className = 'post-list-container';
        tableBody.closest('div').appendChild(container);
    }

    if(!container) return;
    container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">Yükleniyor...</p>';
    
    try {
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        container.innerHTML = '';
        if(posts.length === 0) { 
            container.innerHTML = '<p style="text-align:center; color:#94a3b8;">Henüz yazı yok.</p>'; 
            return; 
        }

        // Yazıları tersten sırala (En yeni en üstte)
        posts.reverse().forEach(p => {
            let tarihGoster = p.tarih;
            try { if(p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0]; } catch(e){}
            const statusClass = p.durum === 'Yayında' ? 'status-active' : 'status-draft';

            // Kart Elementini Oluştur
            const item = document.createElement('div');
            item.className = 'post-item';
            
            // İçerik HTML'i
            item.innerHTML = `
                <div class="post-info">
                    <div class="post-title-row">${p.baslik}</div>
                    <div class="post-meta-row">
                        <span><span class="post-status ${statusClass}"></span> ${p.durum}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${tarihGoster}</span>
                        <span class="post-badge">${p.kategori}</span>
                        ${p.one_cikan ? '<i class="fa-solid fa-star" style="color:gold; margin-left:5px;"></i>' : ''}
                    </div>
                </div>
                <div class="post-actions">
                   <button class="icon-btn edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                   <button class="icon-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            // --- TIKLAMA OLAYLARI (EN GÜVENLİ YÖNTEM) ---
            
            // 1. Karta tıklayınca düzenle
            item.addEventListener('click', (e) => {
                // Eğer silme butonuna tıklandıysa düzenlemeyi açma
                if (e.target.closest('.delete-btn')) return;
                loadPostToEdit(p);
            });

            // 2. Silme Butonu
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Tıklamanın karta yayılmasını engelle
                deletePost(p.id, deleteBtn);
            });

            container.appendChild(item);
        });

    } catch(e) { 
        console.error(e); 
        container.innerHTML = '<p style="color:red;text-align:center">Veri çekilemedi.</p>'; 
    }
}

// ==========================================
// 2. FORMU DOLDURMA (SCROLL EKLENDİ)
// ==========================================
function loadPostToEdit(post) {
    console.log("Düzenleniyor:", post.baslik);
    currentEditId = post.id;

    // Formu Doldur
    document.getElementById("post-title").value = post.baslik || "";
    document.getElementById("post-image").value = post.resim || "";
    document.getElementById("post-category").value = post.kategori || "Genel";
    document.getElementById("post-desc").value = post.ozet || "";
    document.getElementById("read-time").value = post.okuma_suresi || "";
    document.getElementById("tags-input").value = post.etiketler || "";
    document.getElementById("post-featured").checked = (String(post.one_cikan) === "true");

    if(window.myQuill) window.myQuill.root.innerHTML = post.icerik || "";

    let tarihVal = post.tarih;
    if(tarihVal && tarihVal.includes('T')) tarihVal = tarihVal.split('T')[0];
    document.getElementById("post-date").value = tarihVal;

    // Butonu Değiştir
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Yazıyı Güncelle';
    submitBtn.style.background = '#f59e0b';
    
    // İptal Butonu
    let cancelBtn = document.getElementById('cancel-edit-btn');
    if(!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-edit-btn';
        cancelBtn.className = 'cancel-edit-btn';
        cancelBtn.innerText = 'Vazgeç / Yeni Yazı';
        cancelBtn.type = "button";
        cancelBtn.style.cssText = "background:#ef4444; color:white; border:none; padding:10px 15px; border-radius:8px; margin-left:10px; cursor:pointer;";
        cancelBtn.onclick = resetForm;
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }
    cancelBtn.style.display = 'inline-block';

    // Sayfayı YUKARI Kaydır (Önemli!)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Formu Sıfırla
function resetForm() {
    currentEditId = null;
    document.getElementById("add-post-form").reset();
    if(window.myQuill) window.myQuill.setContents([]);
    document.getElementById("post-date").valueAsDate = new Date();

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
    submitBtn.style.background = ''; 

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if(cancelBtn) cancelBtn.style.display = 'none';
}

// ==========================================
// 3. KAYDET / GÜNCELLE
// ==========================================
window.savePost = async (status) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        window.location.href = "login.html";
        return;
    }

    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
    btn.disabled = true;
    
    try {
        const baslik = document.getElementById("post-title").value;
        const editorContent = window.myQuill ? window.myQuill.root.innerHTML : "";
        
        if(!baslik) throw new Error("Başlık zorunlu."); 

        let tarihVal = document.getElementById("post-date").value;
        if(!tarihVal) {
            const now = new Date();
            tarihVal = now.toISOString().split('T')[0]; 
        }

        const actionType = currentEditId ? "update_post" : "add_post";

        const postData = {
            action: actionType,
            id: currentEditId,
            token: token,
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

        const response = await fetch(window.API_URL, {
            method: "POST",
            body: JSON.stringify(postData)
        });

        const result = await response.json();

        if (result.ok) {
            alert(currentEditId ? "✅ Yazı güncellendi!" : "✅ Yazı eklendi!");
            resetForm();
            setTimeout(fetchPosts, 1000);
        } else {
            throw new Error(result.error || "İşlem başarısız.");
        }

    } catch (e) {
        alert("HATA: " + e.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
};

// ==========================================
// 4. SİLME İŞLEMİ
// ==========================================
window.deletePost = async (id, btn) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Hata: Token bulunamadı.");
        return;
    }
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch(window.API_URL, { 
            method: "POST",
            body: JSON.stringify({
                token: token,
                action: "delete_row",
                type: "posts",
                id: id
            })
        });
        
        const result = await response.json();

        if (result.ok) {
            btn.closest('.post-item').style.opacity = "0.3";
            setTimeout(() => fetchPosts(), 1000);
            alert("Silindi.");
        } else {
            throw new Error(result.error);
        }
    } catch (e) {
        alert("Hata: " + e.message);
        btn.innerHTML = originalIcon;
    }
};
