/**
 * ==========================================
 * MODERN ADMIN POST MANAGER (BUTONLU LİSTE VERSİYONU)
 * Backend: Google Apps Script (Code.gs)
 * Özellikler: Satır içi Silme, Durum Değiştirme, Düzenleme
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
        
        // --- 2. DOM ELEMENTLERİNİ SEÇ ---
        this.dom = {
            listContainer: document.getElementById('post-list-container'),
            tableBody: document.getElementById('posts-table-body'), // Eski tabloyu gizlemek için
            
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
            
            // Ana Butonlar
            submitBtn: document.querySelector('.btn-submit'),
            draftBtn: document.querySelector('.btn-draft'),
            cancelBtn: null 
        };

        this.quill = null;
        this.init();
    }

    async init() {
        this.initQuill();
        this.initDateInput();
        this.loadCategories();
        this.createCancelButton();
        this.bindEvents();        
        await this.fetchPosts();  
    }

    // ============================================================
    // 1. KURULUMLAR
    // ============================================================

    initQuill() {
        if (typeof Quill !== 'undefined' && !this.quill) {
            this.quill = new Quill('#editor-container', { theme: 'snow', placeholder: 'İçerik buraya...' });
        }
    }

    initDateInput() {
        if (this.dom.date && !this.dom.date.value) {
            this.dom.date.valueAsDate = new Date();
        }
    }

    loadCategories() {
        if (!this.dom.category) return;
        const storedCats = localStorage.getItem('categories');
        const defaultCats = ["Genel", "Teknoloji", "Yazılım", "Felsefe", "Ekonomi", "Sanat", "Hayat"];
        const cats = storedCats ? JSON.parse(storedCats) : defaultCats;
        this.dom.category.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    createCancelButton() {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "cancel-edit-btn"; 
        btn.style.cssText = "display:none; margin-bottom:15px; padding:8px 15px; background:#64748b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:0.9rem; transition: background 0.2s;";
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Vazgeç / Yeni Ekleme Moduna Dön';
        btn.onclick = () => this.disableEditMode();
        this.dom.form.insertBefore(btn, this.dom.form.firstChild);
        this.dom.cancelBtn = btn;
    }

    // ============================================================
    // 2. OLAY DİNLEYİCİLERİ (GÜNCELLENDİ)
    // ============================================================

    bindEvents() {
        // Form Gönderimi
        if (this.dom.submitBtn) this.dom.submitBtn.addEventListener('click', (e) => { e.preventDefault(); this.savePost('published'); });
        if (this.dom.draftBtn) this.dom.draftBtn.addEventListener('click', (e) => { e.preventDefault(); this.savePost('draft'); });

        // Liste Konteynerini Hazırla
        if (!this.dom.listContainer) this.setupListContainer();

        // LİSTE TIKLAMA OLAYLARI (Delegation)
        this.dom.listContainer.addEventListener('click', (e) => this.handleListClick(e));
    }

    setupListContainer() {
        if (this.dom.tableBody) {
            const parentTable = this.dom.tableBody.closest('table');
            if (parentTable) parentTable.style.display = 'none';
        }
        const wrapper = document.createElement('div');
        wrapper.id = 'post-list-container';
        wrapper.className = 'post-list-container';
        const targetDiv = this.dom.tableBody ? this.dom.tableBody.closest('div') : document.body;
        targetDiv.appendChild(wrapper);
        this.dom.listContainer = wrapper;
    }

    handleListClick(e) {
        const target = e.target;
        
        // Butonu bul (ikon tıklansa bile butonu yakala)
        const btn = target.closest('button'); 
        if (!btn) return; // Butona tıklanmadıysa işlem yapma

        const postItem = btn.closest('.post-item');
        if (!postItem) return;

        const postId = postItem.dataset.id;
        const postData = this.state.posts.find(p => String(p.id) === String(postId));

        if (!postData) { console.error("Veri bulunamadı"); return; }

        // --- BUTON TİPLERİNE GÖRE İŞLEMLER ---

        // 1. SİLME (DELETE)
        if (btn.classList.contains('btn-delete')) {
            this.deletePost(postId, btn);
        }

        // 2. DÜZENLEME (EDIT)
        else if (btn.classList.contains('btn-edit')) {
            this.enableEditMode(postData);
        }

        // 3. DURUM DEĞİŞTİRME (TOGGLE STATUS)
        else if (btn.classList.contains('btn-status')) {
            this.toggleStatus(postData, btn);
        }
    }

    // ============================================================
    // 3. LİSTELEME (BUTONLAR EKLENDİ)
    // ============================================================

    async fetchPosts() {
        this.dom.listContainer.style.display = 'block';
        this.dom.listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:#9ca3af;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><br>Yükleniyor...</div>';

        try {
            const res = await fetch(`${this.apiUrl}?type=posts`);
            const data = await res.json();
            this.state.posts = data.posts || [];
            this.renderList();
        } catch (error) {
            console.error(error);
            this.dom.listContainer.innerHTML = '<p style="color:red; text-align:center;">Hata oluştu.</p>';
        }
    }

    renderList() {
        if (this.state.posts.length === 0) {
            this.dom.listContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; padding:20px;">Henüz yazı yok.</p>';
            return;
        }

        // --- CSS STİLLERİ (JS İçinde) ---
        // Bu stilleri dilerseniz style.css dosyanıza taşıyabilirsiniz.
        const btnStyle = "border:none; width:34px; height:34px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; margin-left:5px;";

        const html = this.state.posts.slice().reverse().map(post => {
            const dateDisplay = new Date(post.tarih).toLocaleDateString('tr-TR');
            const isPublished = post.durum === 'Yayında';
            const statusColor = isPublished ? '#10b981' : '#f59e0b';
            
            // Yıldız ikonu
            const starIcon = (String(post.one_cikan) === "true") 
                ? '<i class="fa-solid fa-star" style="color:#fbbf24; margin-left:5px;"></i>' : '';

            return `
                <div class="post-item" data-id="${post.id}" 
                     style="background:white; border:1px solid #e5e7eb; border-radius:8px; padding:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    
                    <div class="post-info" style="flex:1;">
                        <div style="font-weight:600; font-size:1.05rem; color:#1f2937; margin-bottom:4px;">
                            ${post.baslik} ${starIcon}
                        </div>
                        <div style="font-size:0.85rem; color:#6b7280; display:flex; gap:15px; align-items:center;">
                            <span style="display:flex; align-items:center;">
                                <span style="width:8px; height:8px; border-radius:50%; background:${statusColor}; margin-right:6px;"></span>
                                ${post.durum}
                            </span>
                            <span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i> ${dateDisplay}</span>
                            <span style="background:#f3f4f6; padding:2px 8px; border-radius:4px; font-weight:500; font-size:0.8rem;">${post.kategori}</span>
                        </div>
                    </div>

                    <div class="post-actions" style="display:flex; align-items:center;">
                        
                        <button class="btn-status" title="${isPublished ? 'Taslağa Al' : 'Yayınla'}"
                                style="${btnStyle} background:${isPublished ? '#eff6ff' : '#fff7ed'}; color:${isPublished ? '#3b82f6' : '#f97316'};">
                            <i class="${isPublished ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}"></i>
                        </button>

                        <button class="btn-edit" title="Düzenle"
                                style="${btnStyle} background:#f0fdf4; color:#16a34a;">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="btn-delete" title="Sil"
                                style="${btnStyle} background:#fef2f2; color:#ef4444;">
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </div>
            `;
        }).join('');

        this.dom.listContainer.innerHTML = html;
    }

    // ============================================================
    // 4. İŞLEM FONKSİYONLARI
    // ============================================================

    // --- DÜZENLEME MODU ---
    enableEditMode(post) {
        console.log("Düzenleniyor:", post.baslik);
        this.state.currentEditId = post.id;

        // Formu Doldur
        this.dom.title.value = post.baslik || "";
        this.dom.image.value = post.resim || "";
        this.dom.category.value = post.kategori || "Genel";
        this.dom.desc.value = post.ozet || "";
        this.dom.readTime.value = post.okuma_suresi || "";
        this.dom.tags.value = post.etiketler || "";
        this.dom.featured.checked = (String(post.one_cikan) === "true");

        if (post.tarih) {
            let isoDate = post.tarih.includes('T') ? post.tarih.split('T')[0] : post.tarih;
            this.dom.date.value = isoDate;
        }

        if (this.quill) {
            const delta = this.quill.clipboard.convert(post.icerik || "");
            this.quill.setContents(delta, 'silent');
        }

        // UI Güncelle
        this.dom.formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Düzenleniyor: <span style="color:#f59e0b">${post.baslik}</span>`;
        if (this.dom.submitBtn) {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Değişiklikleri Güncelle';
            this.dom.submitBtn.style.background = '#f59e0b';
        }
        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'inline-block';

        // Yukarı Kaydır
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    disableEditMode() {
        this.state.currentEditId = null;
        this.dom.form.reset();
        if (this.quill) this.quill.setContents([]);
        this.dom.date.valueAsDate = new Date();

        this.dom.formTitle.innerText = "Yeni Yazı Ekle"; // Basitçe resetle
        if (this.dom.submitBtn) {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
            this.dom.submitBtn.style.background = '';
        }
        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'none';
    }

    // --- DURUM DEĞİŞTİRME (YENİ ÖZELLİK) ---
    async toggleStatus(post, btn) {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const newStatus = post.durum === 'Yayında' ? 'Taslak' : 'Yayında';
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; // Loading ikonu
        btn.disabled = true;

        try {
            // Backend update_post tüm veriyi bekler, o yüzden mevcut veriyi koruyarak gönderiyoruz
            const payload = {
                action: "update_post",
                id: post.id,
                token: token,
                baslik: post.baslik,
                icerik: post.icerik,
                resim: post.resim,
                tarih: post.tarih,
                kategori: post.kategori,
                ozet: post.ozet,
                durum: newStatus, // Sadece burası değişiyor
                okuma_suresi: post.okuma_suresi,
                etiketler: post.etiketler,
                one_cikan: post.one_cikan
            };

            const response = await fetch(this.apiUrl, { method: "POST", body: JSON.stringify(payload) });
            const result = await response.json();

            if (result.ok) {
                // Listeyi güncellemeden sadece UI'da durumu değiştir (Daha hızlı hissettirir)
                post.durum = newStatus; // Local state güncelle
                this.renderList(); // Listeyi tekrar çiz
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert("Durum güncellenemedi: " + error.message);
            btn.innerHTML = originalIcon;
        } finally {
            btn.disabled = false;
        }
    }

    // --- KAYDET / GÜNCELLE ---
    async savePost(status) {
        const token = localStorage.getItem('adminToken');
        if (!token) { alert("Oturum yok"); return; }
        
        const titleVal = this.dom.title.value.trim();
        if (!titleVal) { alert("Başlık giriniz."); return; }

        const activeBtn = status === 'published' ? this.dom.submitBtn : this.dom.draftBtn;
        const oldText = activeBtn.innerHTML;
        activeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        activeBtn.disabled = true;

        try {
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

            const response = await fetch(this.apiUrl, { method: "POST", body: JSON.stringify(payload) });
            const result = await response.json();

            if (result.ok) {
                alert(this.state.currentEditId ? "Güncellendi!" : "Eklendi!");
                this.disableEditMode();
                setTimeout(() => this.fetchPosts(), 500);
            } else {
                throw new Error(result.error);
            }
        } catch (e) { alert("Hata: " + e.message); } 
        finally { activeBtn.innerHTML = oldText; activeBtn.disabled = false; }
    }

    // --- SİLME ---
    async deletePost(id, btn) {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        if (!confirm("Silinsin mi?")) return;

        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify({ token, action: "delete_row", type: "posts", id })
            });
            const result = await response.json();
            if (result.ok) {
                const row = btn.closest('.post-item');
                row.style.opacity = "0";
                setTimeout(() => row.remove(), 400);
                if (String(this.state.currentEditId) === String(id)) this.disableEditMode();
            } else { throw new Error(result.error); }
        } catch (e) { 
            alert("Hata: " + e.message); 
            btn.innerHTML = originalIcon; 
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.postManager = new PostManager();
});
