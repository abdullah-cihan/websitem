/* ADMIN POSTS MANAGER (UPDATED WITH EDIT & DRAFT) */

let currentEditingId = null; // Düzenlenen yazının ID'sini tutar
let allFetchedPosts = [];    // Çekilen tüm yazıları hafızada tutar

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

    // İptal butonu ekleyelim (Düzenlemeden çıkmak için)
    addCancelButton();
});

function addCancelButton() {
    const actionDiv = document.querySelector('.form-actions'); // Butonların olduğu div
    if(actionDiv && !document.getElementById('btn-cancel-edit')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'btn-cancel-edit';
        cancelBtn.innerText = "Düzenlemeyi İptal Et";
        cancelBtn.className = "btn-secondary"; // CSS'inizde varsa
        cancelBtn.style.display = "none"; // Başlangıçta gizli
        cancelBtn.style.marginLeft = "10px";
        cancelBtn.style.backgroundColor = "#6c757d";
        cancelBtn.style.color = "white";
        cancelBtn.style.padding = "10px 15px";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "4px";
        cancelBtn.style.cursor = "pointer";
        
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

// Formu ve düzenleme modunu sıfırlar
window.resetForm = () => {
    currentEditingId = null;
    document.getElementById("add-post-form").reset();
    if(window.myQuill) window.myQuill.setContents([]);
    document.getElementById("post-date").valueAsDate = new Date();
    
    // Butonları eski haline getir
    document.querySelector('.btn-submit').innerText = "Yayımla";
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.style.display = "none";
    
    // Sayfanın başına kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Yazıyı düzenleyiciye yükler
window.loadPostIntoEditor = (id) => {
    const post = allFetchedPosts.find(p => p.id === id);
    if(!post) return;

    currentEditingId = post.id; // ID'yi hafızaya al

    // Form alanlarını doldur
    document.getElementById("post-title").value = post.baslik || "";
    document.getElementById("post-image").value = post.resim || "";
    document.getElementById("post-category").value = post.kategori || "Genel";
    document.getElementById("post-desc").value = post.ozet || "";
    document.getElementById("read-time").value = post.okuma_suresi || "";
    document.getElementById("tags-input").value = post.etiketler || "";
    document.getElementById("post-featured").checked = post.one_cikan === true || post.one_cikan === "true";
    
    // Tarihi ayarla
    if(post.tarih) {
        let dateVal = post.tarih.includes('T') ? post.tarih.split('T')[0] : post.tarih;
        document.getElementById("post-date").value = dateVal;
    }

    // Quill editöre içeriği bas
    if(window.myQuill) {
        // Delta formatında değilse HTML olarak yapıştır
        window.myQuill.root.innerHTML = post.icerik || "";
    }

    // Buton metnini değiştir ve İptal butonunu göster
    document.querySelector('.btn-submit').innerText = "Güncelle";
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.style.display = "inline-block";

    // Yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("Yazı düzenleme moduna alındı. Değişiklikleri yaptıktan sonra 'Güncelle' butonuna basın.");
};

window.savePost = async (status) => {
    const btn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    // Eğer düzenleme modundaysak ve yayınla butonuna bastıysak "Güncelleniyor" yazsın
    const loadingText = currentEditingId ? "Güncelleniyor..." : "Gönderiliyor...";
    const oldText = btn ? btn.innerText : "Kaydet";
    
    if(btn) { btn.innerText = loadingText; btn.disabled = true; }
    
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

        // Action: ID varsa 'edit_post', yoksa 'add_post'
        const actionType = currentEditingId ? "edit_post" : "add_post";

        const postData = {
            auth: window.API_KEY, // 🔑 GÜVENLİK ANAHTARI
            action: actionType,
            id: currentEditingId, // Yeni eklerken null gider, sorun olmaz
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

        const successMsg = currentEditingId ? "✅ Yazı başarıyla güncellendi!" : "✅ Yazı başarıyla gönderildi!";
        alert(successMsg);
        
        // Formu temizle ve modu sıfırla
        resetForm();

        // Eğer liste sayfasındaysak listeyi yenile
        if(document.getElementById('posts-table-body')) setTimeout(fetchPosts, 2000);

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
        const postData = {
            auth: window.API_KEY,
            action: "edit_post", // Sadece durumu güncellemek için de edit kullanıyoruz
            id: id,
            durum: "Taslak" // Sadece durumu değiştiriyoruz
            // Backend'iniz diğer alanları boş gönderince siliyor mu yoksa sadece geleni mi güncelliyor?
            // Genelde Google Apps Script tarafında "sadece gelenleri güncelle" mantığı kurulmalıdır.
            // Eğer tüm veriyi istiyorsa, önce veriyi bulup doldurmamız gerekir.
            // Güvenli yöntem: Mevcut veriyi bulup, sadece durumunu değiştirip geri yollamak.
        };

        // Hafızadaki veriyi bulup birleştirelim (Veri kaybını önlemek için)
        const currentPost = allFetchedPosts.find(p => p.id === id);
        if(currentPost) {
             Object.assign(postData, {
                baslik: currentPost.baslik,
                icerik: currentPost.icerik,
                resim: currentPost.resim,
                tarih: currentPost.tarih,
                kategori: currentPost.kategori,
                ozet: currentPost.ozet,
                okuma_suresi: currentPost.okuma_suresi,
                etiketler: currentPost.etiketler,
                one_cikan: currentPost.one_cikan
             });
        }

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
    tbody.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';
    
    try {
        // window.API_URL kullanıyoruz
        const res = await fetch(`${window.API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        
        allFetchedPosts = posts; // Verileri global değişkene at, düzenlemede kullanacağız.

        tbody.innerHTML = '';
        if(posts.length === 0) { tbody.innerHTML = '<tr><td colspan="6">Kayıt yok.</td></tr>'; return; }

        posts.reverse().forEach(p => {
            let img = p.resim && p.resim.startsWith('http') ? `<img src="${p.resim}" width="40" style="border-radius:4px">` : `<i class="fa-solid fa-image"></i>`;
            
            // Tarihi düzgün göster
            let tarihGoster = p.tarih;
            try {
                if(p.tarih.includes('T')) tarihGoster = p.tarih.split('T')[0];
            } catch(err){}

            // Duruma göre stil
            const statusBadge = p.durum === 'Yayında' 
                ? `<span style="color:green;font-weight:bold">Yayında</span>` 
                : `<span style="color:orange;font-weight:bold">Taslak</span>`;

            // Taslak butonu sadece yayındaysa görünsün
            const draftBtn = p.durum === 'Yayında' 
                ? `<button onclick="setQuickDraft('${p.id}', this)" class="action-btn" title="Taslağa Çek" style="color:#e67e22"><i class="fa-solid fa-file-pen"></i></button>` 
                : '';

            tbody.innerHTML += `
                <tr>
                    <td>${img}</td>
                    <!-- Başlığa tıklayınca düzenleme fonksiyonunu çağırır -->
                    <td style="cursor:pointer; color:blue; text-decoration:underline;" onclick="loadPostIntoEditor('${p.id}')" title="Düzenlemek için tıkla">
                        ${p.baslik} <i class="fa-solid fa-pencil" style="font-size:0.8em; opacity:0.5"></i>
                    </td>
                    <td>${p.kategori}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <!-- Düzenle Butonu (Alternatif) -->
                        <button onclick="loadPostIntoEditor('${p.id}')" class="action-btn" title="Düzenle"><i class="fa-solid fa-edit"></i></button>
                        
                        <!-- Taslak Butonu -->
                        ${draftBtn}

                        <!-- Sil Butonu -->
                        <button onclick="deletePost('${p.id}', this)" class="action-btn" title="Sil" style="color:red"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="6" style="color:red">Veri çekilemedi. Bağlantıyı kontrol edin.</td></tr>'; 
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
