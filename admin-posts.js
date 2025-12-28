/* ADMIN POSTS MANAGER (LIST & UPDATE & DELETE) */

let currentEditId = null; // Düzenlenen yazının ID'si burada tutulur

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadCategories();
    fetchPosts(); // Yazıları listele
    
    // Tarih alanına bugünün tarihini ver
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
    let cats = JSON.parse(localStorage.getItem('categories') || '["Genel","Teknoloji","Yazılım","Felsefe"]');
    select.innerHTML = '';
    cats.forEach(c => { 
        const o = document.createElement('option'); o.value=c; o.innerText=c; select.appendChild(o); 
    });
}

// ==========================================
// 1. YAZILARI LİSTELEME (GÖRSELDEKİ GİBİ)
// ==========================================
async function fetchPosts() {
    // Tablo yapısını bul ve gizle
    const tableBody = document.getElementById('posts-table-body');
    if(tableBody) {
        const table = tableBody.closest('table');
        if(table) table.style.display = 'none';
    }

    // Liste konteynerini bul veya oluştur
    let container = document.getElementById('post-list-container');
    if (!container && tableBody) {
        container = document.createElement('div');
        container.id = 'post-list-container';
        container.className = 'post-list-container';
        // Tablonun olduğu yere konteyneri ekle
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

        // Yazıları listele (En yeni en üstte)
        posts.reverse().forEach(p => {
            let tarihGoster = p.tarih;
            try { if(p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0]; } catch(e){}
            
            const statusClass = p.durum === 'Yayında' ? 'status-active' : 'status-draft';

            // HTML Şablonu
            const item = document.createElement('div');
            item.className = 'post-item';
            item.innerHTML = `
                <div class="post-info">
                    <div class="post-title-row">${p.baslik}</div>
                    <div class="post-meta-row">
                        <span><span class="post-status ${statusClass}"></span> ${p.durum}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${tarihGoster}</span>
                        <span class="post-badge">${p.kategori}</span>
                        ${p.one_cikan ? '<i class="fa-solid fa-star" style="color:gold" title="Öne Çıkan"></i>' : ''}
                    </div>
                </div>
                <div class="post-actions">
                   <i class="fa-solid fa-pen-to-square"></i>
                </div>
            `;
            
            // TIKLAMA OLAYI: Formu doldur ve yukarı kaydır
            item.addEventListener('click', () => loadPostToEdit(p));
            
            container.appendChild(item);
        });

    } catch(e) { 
        console.error(e); 
        container.innerHTML = '<p style="color:red;text-align:center">Veri çekilemedi.</p>'; 
    }
}

// ==========================================
// 2. DÜZENLEME MODUNU AÇMA
// ==========================================
function loadPostToEdit(post) {
    currentEditId = post.id; // ID'yi kaydet

    // Formu doldur
    document.getElementById("post-title").value = post.baslik;
    document.getElementById("post-image").value = post.resim;
    document.getElementById("post-category").value = post.kategori;
    document.getElementById("post-desc").value = post.ozet;
    document.getElementById("read-time").value = post.okuma_suresi;
    document.getElementById("tags-input").value = post.etiketler;
    document.getElementById("post-featured").checked = (String(post.one_cikan) === "true");

    if(window.myQuill) window.myQuill.root.innerHTML = post.icerik;

    let tarihVal = post.tarih;
    if(tarihVal && tarihVal.includes('T')) tarihVal = tarihVal.split('T')[0];
    document.getElementById("post-date").value = tarihVal;

    // Butonu "Güncelle" yap
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Yazıyı Güncelle';
    submitBtn.style.background = '#f59e0b'; // Turuncu renk

    // İptal Butonunu Göster
    let cancelBtn = document.getElementById('cancel-edit-btn');
    if(!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-edit-btn';
        cancelBtn.className = 'cancel-edit-btn';
        cancelBtn.innerText = 'Vazgeç / Yeni Yazı';
        cancelBtn.onclick = resetForm;
        // Butonu "Kaydet" butonunun yanına ekle
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }
    cancelBtn.style.display = 'inline-block';

    // Sayfayı en yukarı (forma) kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Modu Sıfırla (Yeni Yazı Moduna Dön)
function resetForm() {
    currentEditId = null;
    document.getElementById("add-post-form").reset();
    if(window.myQuill) window.myQuill.setContents([]);
    document.getElementById("post-date").valueAsDate = new Date();

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
    submitBtn.style.background = ''; // Orijinal renk

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if(cancelBtn) cancelBtn.style.display = 'none';
}

// ==========================================
// 3. KAYDETME / GÜNCELLEME İŞLEMİ
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

        // --- ID VARSA GÜNCELLEME, YOKSA EKLEME ---
        const actionType = currentEditId ? "update_post" : "add_post";

        const postData = {
            action: actionType,
            id: currentEditId, // Güncelleme için gerekli
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
            alert(currentEditId ? "✅ Yazı başarıyla güncellendi!" : "✅ Yeni yazı eklendi!");
            resetForm(); // Formu temizle
            setTimeout(fetchPosts, 1000); // Listeyi yenile
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
