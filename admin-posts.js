/* ============================================================
   ADMIN POSTS MANAGER - FINAL VERSİYON
   Özellikler: Kategori Yönetimi, Quill Editör, Yazı Gönderme/Listeleme
   ============================================================ */

(function () {
    // KESİN VE DOĞRU API LİNKİNİZ
    const API_URL = "https://script.google.com/macros/s/AKfycbyfxBUq0d-sj315o5a_tgS76h0hDMvJKwFhrGzdnGJXKHDKp9oabootgeyCn9QQJ_2fdw/exec";

    // AdminCore kütüphanesine güvenli erişim
    function core() {
        return window.AdminCore || { 
            // Yedek (Fallback) metotlar, eğer admin.js yüklenmezse hata vermesin
            readArrayLS: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
            writeLS: (k, v) => localStorage.setItem(k, JSON.stringify(v))
        };
    }

    // ==========================================
    // 1. BAŞLANGIÇ (INIT)
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initQuill();      // Editörü başlat
        loadCategories(); // Kategorileri yükle
        
        // Eğer yazı tablosu varsa (Yazılar sayfasındaysak)
        if(document.getElementById('posts-table-body')) {
            fetchPosts();
        }
    });

    // ==========================================
    // 2. QUILL EDİTÖR KURULUMU
    // ==========================================
    function initQuill() {
        // Quill kütüphanesi var mı ve editör henüz başlatılmamış mı?
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
        if (!select) return;

        // LocalStorage'dan al
        let cats = core().readArrayLS('categories');
        
        // Hiç yoksa varsayılanları oluştur
        if (cats.length === 0) {
            cats = ['Genel', 'Teknoloji', 'Yazılım', 'Hayat', 'Felsefe'];
            core().writeLS('categories', cats);
        }

        // Listeyi temizle ve doldur
        select.innerHTML = '';
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    // Yeni Kategori Ekle (Global - HTML'den çağrılır)
    window.addNewCategory = () => {
        const newCat = prompt("Yeni kategori adı:");
        if (!newCat || !newCat.trim()) return;

        const cleanCat = newCat.trim();
        const cats = core().readArrayLS('categories');

        // Kontrol
        if (cats.includes(cleanCat)) {
            if(window.showToast) window.showToast("Bu kategori zaten mevcut!", "warning");
            else alert("Bu kategori zaten mevcut!");
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

        if(window.showToast) window.showToast(`Kategori eklendi: ${cleanCat}`, "success");
    };

    // ==========================================
    // 4. YAZI GÖNDERME (SAVE POST) - KRİTİK DÜZELTME BURADA
    // ==========================================
    window.savePost = async (status) => {
        const btnSubmit = document.querySelector('.btn-submit');
        const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";
        
        // Butonu Kilitle
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

            // Validasyon
            if (!baslik) throw new Error("Lütfen bir başlık giriniz.");
            if (!editorEl || editorIcerik === "<p><br></p>" || !editorIcerik.trim()) {
                throw new Error("Yazı içeriği boş olamaz.");
            }

            // --- VERİ PAKETİ (Action Eklendi!) ---
            const postData = {
                action: "add_post",  // <-- BU SATIR EKSİKTİ, ARTIK VAR
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

            // Başarılı
            if(window.showToast) window.showToast("✅ Yazı başarıyla gönderildi!", "success");
            else alert("✅ Yazı başarıyla gönderildi!");
            
            // Formu Temizle
            document.getElementById("add-post-form").reset();
            if(editorEl) editorEl.innerHTML = ""; 
            
            // Tabloyu Güncelle (Eğer o sayfadaysak)
            if(document.getElementById('posts-table-body')) {
                setTimeout(fetchPosts, 1500);
            }

        } catch (error) {
            console.error(error);
            if(window.showToast) window.showToast("Hata: " + error.message, "error");
            else alert("Hata: " + error.message);
        } finally {
            // Butonu Eski Haline Getir
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
            
            // Gelen veri dizi mi yoksa obje mi kontrol et
            const posts = Array.isArray(data) ? data : (data.posts || []);

            tbody.innerHTML = '';
            if (posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Hiç yazı yok.</td></tr>';
                return;
            }

            // Ters sırala (En yeni en üstte)
            posts.reverse().forEach(post => {
                const tr = document.createElement('tr');
                
                // Resim Kontrolü
                const imgTag = post.resim 
                    ? `<img src="${post.resim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">` 
                    : '<div style="width:40px; height:40px; background:#334155; border-radius:4px;"></div>';

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
