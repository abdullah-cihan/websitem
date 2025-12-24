/* ============================================================
   ADMIN POSTS MANAGER - AYRILMIŞ VE GÜNCEL VERSİYON
   ============================================================ */

(function () {
    // ✅ KULLANICININ VERDİĞİ GÜNCEL VE ÇALIŞAN LİNK
    const API_URL = "https://script.google.com/macros/s/AKfycbyu8zJD218qrZoIGX3BmjGml4KhBultnL1oz1X7lgyrxP9vUC6LfvQ8K-IjZvB6XBu89g/exec";

    function core() {
        return window.AdminCore || { 
            readArrayLS: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
            writeLS: (k, v) => localStorage.setItem(k, JSON.stringify(v))
        };
    }

    // ==========================================
    // 1. BAŞLANGIÇ (INIT)
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initQuill();
        loadCategories();
        // Eğer tablo varsa verileri çek
        if(document.getElementById('posts-table-body')) {
            fetchPosts();
        }
    });

    // ==========================================
    // 2. QUILL EDİTÖR KURULUMU
    // ==========================================
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

    // ==========================================
    // 3. KATEGORİ YÖNETİMİ
    // ==========================================
    function loadCategories() {
        const select = document.getElementById('post-category');
        if (!select) return;
        
        let cats = core().readArrayLS('categories');
        if (cats.length === 0) {
            cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
            core().writeLS('categories', cats);
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
        const cats = core().readArrayLS('categories');
        
        if (cats.includes(cleanCat)) { 
            alert("Bu kategori zaten mevcut!"); 
            return; 
        }
        
        cats.push(cleanCat);
        core().writeLS('categories', cats);
        loadCategories();
        
        const select = document.getElementById('post-category');
        if(select) select.value = cleanCat;
    };

    // ==========================================
    // 4. YAZI GÖNDERME (SAVE POST)
    // ==========================================
    window.savePost = async (status) => {
        const btnSubmit = document.querySelector('.btn-submit');
        const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";
        
        if (btnSubmit) { 
            btnSubmit.innerText = "Gönderiliyor..."; 
            btnSubmit.disabled = true; 
        }

        try {
            const baslik = document.getElementById("post-title").value.trim();
            const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
            const kategori = document.getElementById("post-category").value || "Genel";
            const resimUrl = document.getElementById("post-image").value.trim(); 
            const ozet = document.getElementById("post-desc").value.trim();
            
            const okumaSuresi = document.getElementById("post-read-time") ? document.getElementById("post-read-time").value : "";
            const etiketler = document.getElementById("post-tags") ? document.getElementById("post-tags").value : "";
            const oneCikan = document.getElementById("post-featured") ? document.getElementById("post-featured").checked : false;

            const editorEl = document.querySelector('#editor-container .ql-editor');
            const editorIcerik = editorEl ? editorEl.innerHTML : "";

            if (!baslik) throw new Error("Lütfen bir başlık giriniz.");
            if (!editorEl || editorIcerik === "<p><br></p>" || !editorIcerik.trim()) throw new Error("Yazı içeriği boş olamaz.");

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
            
            // Formu temizle
            document.getElementById("add-post-form").reset();
            if(editorEl) editorEl.innerHTML = ""; 
            
            // Eğer tablo varsa yenile
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

    // ==========================================
    // 5. YAZILARI LİSTELEME
    // ==========================================
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
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Hiç yazı yok.</td></tr>';
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
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Veri çekilemedi. <br><small>Konsola bakınız.</small></td></tr>';
        }
    }
})();
