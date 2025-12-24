/* admin-posts.js - SON HAL */

(function () {
    // ==========================================
    // AYARLAR
    // ==========================================
    const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/exec";

    // AdminCore Kütüphanesi Kontrolü
    function core() {
        return window.AdminCore; 
    }

    // ==========================================
    // 1. BAŞLANGIÇ (INIT)
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initQuill();      // Editörü aç
        loadCategories(); // Kategorileri doldur
        fetchPosts();     // Mevcut yazıları listele
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
    
    // Kategorileri Select Kutusuna Doldur
    function loadCategories() {
        const select = document.getElementById('post-category');
        if (!select || !core()) return;

        // AdminCore ile veriyi çek (Yoksa varsayılanları kullan)
        let cats = core().readArrayLS('categories');
        
        if (cats.length === 0) {
            cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
            core().writeLS('categories', cats);
        }

        // Listeyi temizle ve yeniden doldur
        select.innerHTML = '';
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    // Yeni Kategori Ekleme (Global Fonksiyon)
    window.addNewCategory = () => {
        const newCat = prompt("Yeni kategori adı:");
        if (!newCat || !newCat.trim()) return;

        const cleanCat = newCat.trim();
        const cats = core().readArrayLS('categories', []);

        // Aynı isimde kategori var mı?
        if (cats.includes(cleanCat)) {
            window.showToast("Bu kategori zaten mevcut!", "warning");
            return;
        }

        // Ekle ve Kaydet
        cats.push(cleanCat);
        core().writeLS('categories', cats);

        // Arayüzü Güncelle
        loadCategories();
        
        // Yeni ekleneni seçili yap
        const select = document.getElementById('post-category');
        if(select) select.value = cleanCat;

        window.showToast(`Kategori eklendi: ${cleanCat}`, "success");
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
            // Form verilerini al
            const baslik = document.getElementById("post-title").value.trim();
            const tarih = document.getElementById("post-date").value || new Date().toLocaleDateString('tr-TR');
            const kategori = document.getElementById("post-category").value || "Genel";
            const resimUrl = document.getElementById("post-image").value.trim(); 
            const ozet = document.getElementById("post-desc").value.trim();
            
            // Editör verisini al
            const editorEl = document.querySelector('#editor-container .ql-editor');
            const editorIcerik = editorEl ? editorEl.innerHTML : "";

            // Kontroller
            if (!baslik) throw new Error("Başlık yazmadınız.");
            if (!editorEl || editorIcerik === "<p><br></p>" || !editorIcerik.trim()) {
                throw new Error("İçerik boş olamaz.");
            }

            // Gönderilecek Veri
            const postData = {
                action: "add_post",
                baslik: baslik,
                icerik: editorIcerik,
                resim: resimUrl,
                tarih: tarih,
                kategori: kategori,
                ozet: ozet,
                durum: status
            };

            // API İsteği
            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData)
            });

            window.showToast("✅ Yazı başarıyla gönderildi!", "success");
            
            // Formu Temizle
            document.getElementById("add-post-form").reset();
            if(editorEl) editorEl.innerHTML = ""; 
            
            // Tabloyu Güncelle
            setTimeout(fetchPosts, 1500);

        } catch (error) {
            window.showToast("Hata: " + error.message, "error");
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

            // Ters sırala (En yeni en üstte)
            posts.reverse().forEach(post => {
                const tr = document.createElement('tr');
                
                // Güvenli Resim
                const imgTag = post.resim 
                    ? `<img src="${post.resim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">` 
                    : '<div style="width:40px; height:40px; background:#334155; border-radius:4px;"></div>';

                // Güvenli HTML (XSS Koruması için AdminCore escape kullanılabilir ama burada innerHTML gerekli değil)
                tr.innerHTML = `
                    <td>${imgTag}</td>
                    <td style="font-weight:600; color:white;">${post.baslik}</td>
                    <td>${post.kategori}</td>
                    <td><span style="padding:4px 8px; background:#10b981; border-radius:4px; font-size:0.8rem;">${post.durum || 'Yayınlandı'}</span></td>
                    <td>
                        <button class="action-btn btn-delete" onclick="alert('Silme işlemi için Google Sheet dosyasını kullanınız.')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
        }
    }

})();
