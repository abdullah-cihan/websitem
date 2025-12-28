/**
 * ==========================================
 * MODERN ADMIN POST MANAGER (ES6 Class Yapısı)
 * Backend: Google Apps Script (Code.gs)
 * ==========================================
 */

class PostManager {
    constructor() {
        // --- 1. AYARLAR VE STATE ---
        this.apiUrl = window.API_URL;
        this.state = {
            currentEditId: null, // Şu an düzenlenen yazının ID'si
            posts: []            // API'den çekilen tüm yazılar
        };
        
        // --- 2. DOM ELEMENTLERİNİ ÖNBELLEĞE AL ---
        this.dom = {
            // Liste Alanları
            listContainer: document.getElementById('post-list-container'),
            tableBody: document.getElementById('posts-table-body'), // Eski tablo varsa gizlemek için
            
            // Form Alanları
            form: document.getElementById('add-post-form'),
            formTitle: document.querySelector('#add-post-form h2'),
            
            // Inputlar
            title: document.getElementById('post-title'),
            image: document.getElementById('post-image'),
            category: document.getElementById('post-category'),
            desc: document.getElementById('post-desc'),
            readTime: document.getElementById('read-time'),
            tags: document.getElementById('tags-input'),
            date: document.getElementById('post-date'),
            featured: document.getElementById('post-featured'),
            
            // Butonlar
            submitBtn: document.querySelector('.btn-submit'),
            draftBtn: document.querySelector('.btn-draft'),
            cancelBtn: null // Dinamik oluşturacağız
        };

        // Quill Editör Referansı
        this.quill = null;

        // Uygulamayı Başlat
        this.init();
    }

    async init() {
        this.initQuill();
        this.initDateInput();
        this.loadCategories();
        this.createCancelButton(); // Vazgeç butonunu baştan oluştur ama gizle
        this.bindEvents();         // Tıklama olaylarını dinle
        await this.fetchPosts();   // Verileri çek
    }

    // ============================================================
    // 1. BAŞLANGIÇ KURULUMLARI
    // ============================================================

    initQuill() {
        if (typeof Quill !== 'undefined' && !this.quill) {
            this.quill = new Quill('#editor-container', { 
                theme: 'snow', 
                placeholder: 'İçerik buraya...' 
            });
        }
    }

    initDateInput() {
        // Tarih alanı boşsa bugünü ata
        if (this.dom.date && !this.dom.date.value) {
            this.dom.date.valueAsDate = new Date();
        }
    }

    loadCategories() {
        if (!this.dom.category) return;
        
        // LocalStorage'dan veya varsayılanlardan kategorileri yükle
        const storedCats = localStorage.getItem('categories');
        const defaultCats = ["Genel", "Teknoloji", "Yazılım", "Felsefe", "Ekonomi", "Sanat", "Hayat"];
        const cats = storedCats ? JSON.parse(storedCats) : defaultCats;

        this.dom.category.innerHTML = cats
            .map(c => `<option value="${c}">${c}</option>`)
            .join('');
    }

    createCancelButton() {
        // Formun en başına "Vazgeç" butonu ekle (Varsayılan olarak gizli)
        const btn = document.createElement('button');
        btn.type = "button";
        btn.id = "cancel-edit-btn";
        btn.className = "cancel-edit-btn"; 
        // Stil: Modern gri buton
        btn.style.cssText = "display:none; margin-bottom:15px; padding:8px 15px; background:#64748b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:0.9rem; transition: background 0.2s;";
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Vazgeç / Yeni Ekleme Moduna Dön';
        
        // Butona basınca düzenleme modundan çık
        btn.onclick = () => this.disableEditMode();
        
        this.dom.form.insertBefore(btn, this.dom.form.firstChild);
        this.dom.cancelBtn = btn;
    }

    // ============================================================
    // 2. OLAY DİNLEYİCİLERİ (EVENTS)
    // ============================================================

    bindEvents() {
        // --- FORM BUTONLARI ---
        if (this.dom.submitBtn) {
            this.dom.submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePost('published');
            });
        }
        
        if (this.dom.draftBtn) {
            this.dom.draftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePost('draft');
            });
        }

        // --- LİSTE TIKLAMA (EVENT DELEGATION) ---
        // Listeye tek bir dinleyici ekleyerek performansı artırıyoruz
        if (!this.dom.listContainer && this.dom.tableBody) {
            // Eğer container henüz yoksa oluştur
            this.setupListContainer();
        }

        // SetupListContainer içinde event listener eklenecek,
        // ancak DOM hazır olduğunda container zaten varsa buraya ekleyelim:
        if (this.dom.listContainer) {
            this.dom.listContainer.addEventListener('click', (e) => this.handleListClick(e));
        }
    }

    setupListContainer() {
        // Tabloyu gizle
        if (this.dom.tableBody) {
            const parentTable = this.dom.tableBody.closest('table');
            if (parentTable) parentTable.style.display = 'none';
        }

        // Yeni liste konteyneri oluştur
        const wrapper = document.createElement('div');
        wrapper.id = 'post-list-container';
        wrapper.className = 'post-list-container'; // CSS için sınıf
        
        // Tablonun olduğu yere ekle
        const targetDiv = this.dom.tableBody ? this.dom.tableBody.closest('div') : document.body;
        targetDiv.appendChild(wrapper);
        
        this.dom.listContainer = wrapper;
        
        // Olay dinleyicisini yeni oluşturulan elemana bağla
        this.dom.listContainer.addEventListener('click', (e) => this.handleListClick(e));
    }

    handleListClick(e) {
        const target = e.target;
        
        // 1. SİLME BUTONU MU?
        const deleteBtn = target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation(); // Tıklama yukarı (düzenlemeye) gitmesin
            const postItem = deleteBtn.closest('.post-item');
            if (postItem) this.deletePost(postItem.dataset.id, deleteBtn);
            return;
        }

        // 2. YAZI KARTI MI? (DÜZENLEME)
        const postItem = target.closest('.post-item');
        if (postItem) {
            const postId = postItem.dataset.id;
            // ID eşleşmesini gevşek yap (==) çünkü biri string biri number olabilir
            const postData = this.state.posts.find(p => String(p.id) === String(postId));
            
            if (postData) {
                this.enableEditMode(postData);
            }
        }
    }

    // ============================================================
    // 3. VERİ ÇEKME VE LİSTELEME
    // ============================================================

    async fetchPosts() {
        if (!this.dom.listContainer) this.setupListContainer();

        // Yükleniyor durumu
        this.dom.listContainer.style.display = 'block';
        this.dom.listContainer.innerHTML = `
            <div style="text-align:center; padding:40px; color:#9ca3af;">
                <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                <p style="margin-top:10px;">Yazılar yükleniyor...</p>
            </div>`;

        try {
            const res = await fetch(`${this.apiUrl}?type=posts`);
            const data = await res.json();
            
            // Veriyi State'e kaydet
            this.state.posts = data.posts || [];
            
            this.renderList();
        } catch (error) {
            console.error("Fetch Hatası:", error);
            this.dom.listContainer.innerHTML = '<p style="color:red; text-align:center;">Veriler yüklenirken bir hata oluştu.</p>';
        }
    }

    renderList() {
        if (this.state.posts.length === 0) {
            this.dom.listContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; padding:20px;">Henüz hiç yazı eklenmemiş.</p>';
            return;
        }

        // Yazıları tersten sırala (En yeni en üstte)
        const html = this.state.posts.slice().reverse().map(post => {
            const dateDisplay = new Date(post.tarih).toLocaleDateString('tr-TR');
            
            // Durum rengi
            const statusColor = post.durum === 'Yayında' ? '#10b981' : '#f59e0b'; // Yeşil : Turuncu
            
            // Öne çıkan yıldız
            const starIcon = (String(post.one_cikan) === "true") 
                ? '<i class="fa-solid fa-star" style="color:#fbbf24; margin-left:5px;"></i>' 
                : '';

            return `
                <div class="post-item" data-id="${post.id}" 
                     style="background:white; border:1px solid #e5e7eb; border-radius:8px; padding:15px; margin-bottom:10px; cursor:pointer; transition:all 0.2s; display:flex; justify-content:space-between; align-items:center;">
                    
                    <div class="post-info">
                        <div style="font-weight:600; font-size:1.1rem; color:#1f2937; margin-bottom:4px;">
                            ${post.baslik} ${starIcon}
                        </div>
                        <div style="font-size:0.85rem; color:#6b7280; display:flex; gap:15px; align-items:center;">
                            <span>
                                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${statusColor}; margin-right:5px;"></span>
                                ${post.durum}
                            </span>
                            <span><i class="fa-regular fa-calendar"></i> ${dateDisplay}</span>
                            <span style="background:#f3f4f6; padding:2px 8px; border-radius:4px; font-weight:500;">${post.kategori}</span>
                        </div>
                    </div>

                    <div class="post-actions">
                        <button class="icon-btn delete-btn" title="Sil"
                                style="background:#fee2e2; color:#ef4444; border:none; width:36px; height:36px; border-radius:6px; cursor:pointer; transition:background 0.2s;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <button style="background:none; border:none; color:#9ca3af; margin-left:10px;">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.listContainer.innerHTML = html;

        // Hover efektlerini JS ile ekleyelim (CSS dosyasına gerek kalmasın diye)
        const items = this.dom.listContainer.querySelectorAll('.post-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => { item.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"; item.style.borderColor = "#d1d5db"; });
            item.addEventListener('mouseleave', () => { item.style.boxShadow = "none"; item.style.borderColor = "#e5e7eb"; });
        });
    }

    // ============================================================
    // 4. DÜZENLEME MODU (CORE FEATURE)
    // ============================================================

    enableEditMode(post) {
        console.log("Düzenleme Modu Açıldı:", post.baslik);
        this.state.currentEditId = post.id;

        // 1. Formu Doldur
        this.dom.title.value = post.baslik || "";
        this.dom.image.value = post.resim || "";
        this.dom.category.value = post.kategori || "Genel";
        this.dom.desc.value = post.ozet || "";
        this.dom.readTime.value = post.okuma_suresi || "";
        this.dom.tags.value = post.etiketler || "";
        this.dom.featured.checked = (String(post.one_cikan) === "true");

        // Tarih formatı (YYYY-MM-DD)
        if (post.tarih) {
            let isoDate = post.tarih;
            // Eğer tarih ISO formatında uzunsa (T içeriyorsa) kes
            if (isoDate.includes('T')) isoDate = isoDate.split('T')[0];
            this.dom.date.value = isoDate;
        }

        // Editör İçeriği
        if (this.quill) {
            // HTML içeriğini güvenli bir şekilde aktar
            const delta = this.quill.clipboard.convert(post.icerik || "");
            this.quill.setContents(delta, 'silent');
        }

        // 2. UI Değişiklikleri
        // Başlığı değiştir
        if (!this.dom.formTitle.dataset.original) {
            this.dom.formTitle.dataset.original = this.dom.formTitle.innerText;
        }
        this.dom.formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Düzenleniyor: <span style="color:#f59e0b">${post.baslik}</span>`;

        // Butonu "Güncelle" yap
        if (this.dom.submitBtn) {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Değişiklikleri Güncelle';
            this.dom.submitBtn.style.background = '#f59e0b'; // Amber rengi
            this.dom.submitBtn.style.borderColor = '#d97706';
        }

        // Vazgeç butonunu göster
        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'inline-block';

        // 3. ODAKLANMA (Scroll)
        // Kullanıcıyı formun en tepesine yumuşakça kaydır
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    disableEditMode() {
        console.log("Düzenleme Modu Kapatıldı");
        this.state.currentEditId = null;

        // Formu temizle
        this.dom.form.reset();
        if (this.quill) this.quill.setContents([]); // Editörü temizle
        this.dom.date.valueAsDate = new Date();    // Tarihi bugüne al

        // UI Reset
        if (this.dom.formTitle.dataset.original) {
            this.dom.formTitle.innerHTML = this.dom.formTitle.dataset.original;
        }

        if (this.dom.submitBtn) {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
            this.dom.submitBtn.style.background = ''; // Orijinal CSS rengine döner
            this.dom.submitBtn.style.borderColor = '';
        }

        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'none';
    }

    // ============================================================
    // 5. KAYDETME (EKLEME & GÜNCELLEME)
    // ============================================================

    async savePost(status) {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
            window.location.href = "login.html";
            return;
        }

        // Zorunlu alan kontrolü
        const titleVal = this.dom.title.value.trim();
        if (!titleVal) {
            alert("Lütfen bir başlık giriniz.");
            this.dom.title.focus();
            return;
        }

        // Buton animasyonu
        const activeBtn = status === 'published' ? this.dom.submitBtn : this.dom.draftBtn;
        const originalText = activeBtn.innerHTML;
        activeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
        activeBtn.disabled = true;

        try {
            // Verileri hazırla
            const payload = {
                action: this.state.currentEditId ? "update_post" : "add_post",
                id: this.state.currentEditId,
                token: token,
                baslik: titleVal,
                icerik: this.quill ? this.quill.root.innerHTML : "",
                resim: this.dom.image.value,
                tarih: this.dom.date.value || new Date().toISOString().split('T')[0],
                kategori: this.dom.category.value,
                ozet: this.dom.desc.value,
                durum: status === 'published' ? 'Yayında' : 'Taslak',
                okuma_suresi: this.dom.readTime.value,
                etiketler: this.dom.tags.value,
                one_cikan: this.dom.featured.checked
            };

            // API İsteği
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.ok) {
                // Başarılı
                alert(this.state.currentEditId ? "✅ Yazı başarıyla güncellendi!" : "✅ Yeni yazı eklendi!");
                
                // Formu sıfırla ve moddan çık
                this.disableEditMode();
                
                // Listeyi yenile (hafif gecikme ile verinin işlenmesini bekle)
                setTimeout(() => this.fetchPosts(), 500);
            } else {
                throw new Error(result.error || "İşlem başarısız.");
            }

        } catch (error) {
            alert("HATA: " + error.message);
        } finally {
            // Butonu eski haline getir
            activeBtn.innerHTML = originalText;
            activeBtn.disabled = false;
        }
    }

    // ============================================================
    // 6. SİLME İŞLEMİ
    // ============================================================

    async deletePost(id, btnElement) {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (!confirm("Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?")) return;

        // İkonu spinner yap
        const originalIcon = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnElement.disabled = true;

        try {
            const response = await fetch(this.apiUrl, {
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
                // Başarılı: UI'dan satırı sil (efektli)
                const row = btnElement.closest('.post-item');
                row.style.transition = "all 0.5s ease";
                row.style.opacity = "0";
                row.style.transform = "translateX(50px)";
                
                setTimeout(() => row.remove(), 500);
                
                // Eğer edit modundaysak ve silinen yazıyı düzenliyorsak modu kapat
                if (String(this.state.currentEditId) === String(id)) {
                    this.disableEditMode();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert("Silme başarısız: " + error.message);
            btnElement.innerHTML = originalIcon;
            btnElement.disabled = false;
        }
    }
}

// ============================================================
// UYGULAMAYI BAŞLAT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Global değişkene ata ki konsoldan erişilebilsin
    window.postManager = new PostManager();
});
