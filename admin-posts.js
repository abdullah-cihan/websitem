/* ============================================================
   ADMIN POSTS MANAGER - YAZI YÖNETİMİ (V-FINAL)
   ============================================================ */

(function () {
    const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec";

    // --- BAŞLANGIÇ ---
    document.addEventListener('DOMContentLoaded', () => {
        initQuill();
        loadCategories();
        // Eğer yazı tablosu varsa (sayfadaysak) verileri çek
        if(document.getElementById('posts-table-body')) {
            fetchPosts();
        }
    });

    // --- QUILL EDİTÖR ---
    function initQuill() {
        if (typeof Quill !== 'undefined' && !document.querySelector('.ql-editor')) {
            const container = document.getElementById('editor-container');
            if (container) {
                new Quill('#editor-container', { 
                    theme: 'snow', 
                    placeholder: 'Yazı içeriğini buraya giriniz...' 
                });
            }
        }
    }

    // --- KATEGORİ YÖNETİMİ ---
    function loadCategories() {
        const select = document.getElementById('post-category');
        if (!select) return;
        
        let cats = JSON.parse(localStorage.getItem('categories') || '[]');
        if (cats.length === 0) {
            cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
            localStorage.setItem('categories', JSON.stringify(cats));
        }
        
        select.innerHTML = '';
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    window.addNewCategory = () => {
        const newCat = prompt("Yeni kategori adı:");
        if (!newCat || !newCat.trim()) return;
        
        const cleanCat = newCat.trim();
        let cats = JSON.parse(localStorage.getItem('categories') || '[]');
        
        if (cats.includes(cleanCat)) { alert("Bu kategori zaten mevcut!"); return; }
        
        cats.push(cleanCat);
        localStorage.setItem('categories', JSON.stringify(cats));
        loadCategories();
        
        const select = document.getElementById('post-category');
        if(select) select.value = cleanCat;
    };

    // --- YAZI GÖNDERME (POST) ---
    window.savePost = async (status) => {
        const btnSubmit = document.querySelector('.btn-submit');
        const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";
        
        if (btnSubmit) { 
            btnSubmit.innerText = "Gönderiliyor..."; 
            btnSubmit.disabled = true; 
        }

        try {
            // Form verileri
            const baslik = document.getElementById("post-title").value.trim();
            const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
            const kategori = document.getElementById("post-category").value || "Genel";
            const resimUrl = document.getElementById("post-image").value.trim(); 
            const ozet = document.getElementById("post-desc").value.trim();
            
            // Yeni Alanlar
            const okumaSuresi = document.getElementById("post-read-time") ? document.getElementById("post-read-time").value : "";
            const etiketler = document.getElementById("post-tags") ? document.getElementById("post-tags").value : "";
            const oneCikan = document.getElementById("post-featured") ? document.getElementById("post-featured").checked : false;

            // Editör verisi
            const editorEl = document.querySelector('#editor-container .ql-editor');
            const editorIcerik = editorEl ? editorEl.innerHTML : "";

            // Kontrol
            if (!baslik) throw new Error("Lütfen bir başlık giriniz.");
            if (!editorEl || editorIcerik === "<p><br></p>" || !editorIcerik.trim()) throw new Error("Yazı içeriği boş olamaz.");

            // Veri Paketi
            const postData = {
                action: "add_post",
                baslik: baslik,
                icerik: editorIcerik,
                resim: resimUrl,
                tarih: tarih,
                kategori: kategori,
                ozet: ozet,
                durum: status,
                okuma_suresi: okumaSuresi,
                etiketler: etiketler,
                one_cikan: oneCikan
            };

            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData)
            });

            alert("✅ Yazı başarıyla gönderildi!");
            
            // Temizlik
            document.getElementById("add-post-form").reset();
            if(editorEl) editorEl.innerHTML = ""; 
            
            // Tabloyu yenile
            if(document.getElementById('posts-table-body')) {
                setTimeout(fetchPosts, 1500);
            }

        } catch (error) {
            console.error(error);
            alert("Hata: " + error.message);
        } finally {
            if (btnSubmit) { 
                btnSubmit.innerText = originalText; 
                btnSubmit.disabled = false; 
            }
        }
    };

    // --- YAZILARI LİSTELEME (GET) ---
    async function fetchPosts() {
        const tbody = document.getElementById('posts-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';
        
        try {
            const res = await fetch(`${API_URL}?type=posts`);
            const data = await res.json();
            const posts = Array.isArray(data) ? data : (data.posts || []);

            tbody.innerHTML = '';
            if (posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Henüz yazı yok.</td></tr>';
                return;
            }
            
            posts.reverse().forEach(post => {
                const tr = document.createElement('tr');
                const imgTag = post.resim 
                    ? `<img src="${post.resim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">` 
                    : '<div style="width:40px; height:40px; background:#334155; border-radius:4px;"></div>';
                
                tr.innerHTML = `
                    <td>${imgTag}</td>
                    <td style="color:white; font-weight:500;">${post.baslik}</td>
                    <td>${post.kategori}</td>
                    <td><span style="padding:4px 8px; background:#10b981; border-radius:4px; font-size:0.8rem;">${post.durum || 'Yayınlandı'}</span></td>
                    <td>
                        <button class="action-btn" onclick="alert('Google Sheet üzerinden siliniz.')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>`;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error("Fetch Hatası:", err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
        }
    }
})();
