/**
 * ADMIN POSTS MANAGER (TIKLAMA SORUNU GİDERİLMİŞ SÜRÜM)
 */

class PostManager {
    constructor() {
        // Yapılandırma ve State
        this.apiUrl = window.API_URL;
        this.state = {
            currentEditId: null,
            posts: []
        };
        
        // DOM Elementlerini Önbelleğe Al
        this.dom = {
            listContainer: document.getElementById('post-list-container'),
            tableBody: document.getElementById('posts-table-body'),
            form: document.getElementById('add-post-form'),
            formTitle: document.querySelector('#add-post-form h2'),
            categorySelect: document.getElementById('post-category'),
            dateInput: document.getElementById('post-date'),
            cancelBtn: null, 
            submitBtn: document.querySelector('.btn-submit'),
            draftBtn: document.querySelector('.btn-draft')
        };

        this.quill = null;
        this.init();
    }

    async init() {
        this.initQuill();
        this.initDateInput();
        this.loadCategories();
        this.bindGlobalEvents(); 
        await this.fetchPosts();
    }

    // --- 1. OLAY DİNLEYİCİLERİ (EN ÖNEMLİ KISIM BURASI) ---
    bindGlobalEvents() {
        // Kaydet Butonu
        if (this.dom.submitBtn) {
            this.dom.submitBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Sayfa yenilenmesini engelle
                this.savePost('published');
            });
        }
        
        // Taslak Butonu
        if (this.dom.draftBtn) {
            this.dom.draftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePost('draft');
            });
        }

        // LİSTE TIKLAMA MANTIĞI (DÜZELTİLDİ)
        if (this.dom.listContainer) {
            this.dom.listContainer.addEventListener('click', (e) => {
                // Tıklanan elemanı bul
                const target = e.target;
                
                // 1. Eğer SİL butonuna tıklandıysa (Edit çalışmamalı)
                const deleteBtn = target.closest('.delete-btn');
                if (deleteBtn) {
                    // Silme işlemini başlat ve fonksiyondan çık
                    const postItem = deleteBtn.closest('.post-item');
                    if (postItem) this.deletePost(postItem.dataset.id, deleteBtn);
                    return; 
                }

                // 2. Eğer SİL değilse, satıra mı tıklandı kontrol et
                const postItem = target.closest('.post-item');
                if (postItem) {
                    const postId = postItem.dataset.id;
                    // ID eşleşmesini gevşek yapıyoruz (==) çünkü biri string biri number olabilir
                    const postData = this.state.posts.find(p => p.id == postId);
                    
                    if (postData) {
                        this.enableEditMode(postData);
                    } else {
                        console.error("Hata: Tıklanan yazının verisi bulunamadı ID:", postId);
                    }
                }
            });
        }
    }

    // --- 2. AYARLAR ---
    initQuill() {
        if (typeof Quill !== 'undefined' && !this.quill) {
            this.quill = new Quill('#editor-container', { theme: 'snow', placeholder: 'İçerik buraya...' });
        }
    }

    initDateInput() {
        if (this.dom.dateInput && !this.dom.dateInput.value) {
            this.dom.dateInput.valueAsDate = new Date();
        }
    }

    loadCategories() {
        if (!this.dom.categorySelect) return;
        const storedCats = localStorage.getItem('categories');
        const defaultCats = ["Genel", "Teknoloji", "Yazılım", "Felsefe", "Ekonomi", "Sanat"];
        const cats = storedCats ? JSON.parse(storedCats) : defaultCats;
        this.dom.categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // --- 3. VERİ ÇEKME ---
    async fetchPosts() {
        if (this.dom.tableBody) this.dom.tableBody.closest('table').style.display = 'none';
        
        if (!this.dom.listContainer) {
            const wrapper = document.createElement('div');
            wrapper.id = 'post-list-container';
            wrapper.className = 'post-list-container';
            this.dom.tableBody?.closest('div')?.appendChild(wrapper);
            this.dom.listContainer = wrapper;
            // Event listener'ı yeni oluşturulan dive tekrar bağla (önemli)
            this.bindGlobalEvents(); 
        }

        this.dom.listContainer.style.display = 'block';
        this.dom.listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Yükleniyor...</p>';

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
            this.dom.listContainer.innerHTML = '<p style="text-align:center; color:#999;">Henüz yazı yok.</p>';
            return;
        }

        const html = this.state.posts.slice().reverse().map(post => {
            const dateDisplay = new Date(post.tarih).toLocaleDateString('tr-TR');
            const statusClass = post.durum === 'Yayında' ? 'status-active' : 'status-draft';
            
            // CSS Notu: .post-item için cursor:pointer eklenmeli
            return `
                <div class="post-item" data-id="${post.id}" style="cursor: pointer; padding: 15px; border-bottom: 1px solid #eee; transition: background 0.2s;">
                    <div class="post-info">
                        <div class="post-title-row" style="font-weight:bold; font-size:1.1rem;">${post.baslik}</div>
                        <div class="post-meta-row" style="color:#666; font-size:0.9rem; margin-top:5px;">
                            <span style="margin-right:15px;">${post.durum}</span>
                            <span style="margin-right:15px;">${dateDisplay}</span>
                            <span style="background:#eee; padding:2px 8px; borderRadius:4px;">${post.kategori}</span>
                        </div>
                    </div>
                    <div class="post-actions" style="margin-top:10px; display:flex; justify-content:flex-end;">
                        <button class="icon-btn delete-btn" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2rem; padding:5px;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.listContainer.innerHTML = html;
        
        // Hover efekti için JS tarafında stil ekleyelim (CSS dosyasına da yazabilirsiniz)
        const items = this.dom.listContainer.querySelectorAll('.post-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f9fafb');
            item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
        });
    }

    // --- 4. DÜZENLEME MODU (BURASI TETİKLENİYOR MU?) ---
    enableEditMode(post) {
        // State güncelle
        this.state.currentEditId = post.id;

        // Formu doldur
        this.fillForm(post);

        // UI Güncelle
        this.updateFormTitle(`Yazıyı Düzenle: ${post.baslik}`);
        this.toggleSubmitButtonState(true);
        this.createOrShowCancelButton();

        // SAYFAYI YUKARI KAYDIR (Gözden kaçmaması için)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    disableEditMode() {
        this.state.currentEditId = null;
        this.dom.form.reset();
        if (this.quill) this.quill.setContents([]);
        this.dom.dateInput.valueAsDate = new Date();
        this.updateFormTitle(null);
        this.toggleSubmitButtonState(false);
        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'none';
    }

    fillForm(post) {
        document.getElementById("post-title").value = post.baslik || "";
        document.getElementById("post-image").value = post.resim || "";
        document.getElementById("post-category").value = post.kategori || "Genel";
        document.getElementById("post-desc").value = post.ozet || "";
        document.getElementById("read-time").value = post.okuma_suresi || "";
        document.getElementById("tags-input").value = post.etiketler || "";
        document.getElementById("post-featured").checked = (String(post.one_cikan) === "true");

        if (post.tarih) {
            const isoDate = post.tarih.includes('T') ? post.tarih.split('T')[0] : post.tarih;
            this.dom.dateInput.value = isoDate;
        }

        if (this.quill) this.quill.root.innerHTML = post.icerik || "";
    }

    // --- 5. YARDIMCI FONKSİYONLAR ---
    updateFormTitle(text) {
        if (!this.dom.formTitle) return;
        if (!this.dom.formTitle.dataset.original) {
            this.dom.formTitle.dataset.original = this.dom.formTitle.innerText;
        }
        this.dom.formTitle.innerText = text || this.dom.formTitle.dataset.original;
    }

    toggleSubmitButtonState(isEditing) {
        if (!this.dom.submitBtn) return;
        if (isEditing) {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Güncelle';
            this.dom.submitBtn.style.background = '#f59e0b';
        } else {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
            this.dom.submitBtn.style.background = '';
        }
    }

    createOrShowCancelButton() {
        if (!this.dom.cancelBtn) {
            const btn = document.createElement('button');
            btn.type = "button";
            btn.className = 'cancel-edit-btn';
            btn.style.cssText = "margin-bottom:15px; padding:8px 15px; background:#64748b; color:white; border:none; border-radius:5px; cursor:pointer;";
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Vazgeç / Yeni Ekle';
            btn.onclick = () => this.disableEditMode();
            this.dom.form.insertBefore(btn, this.dom.form.firstChild);
            this.dom.cancelBtn = btn;
        }
        this.dom.cancelBtn.style.display = 'inline-block';
    }

    // --- 6. API İŞLEMLERİ ---
    async savePost(status) {
        const token = localStorage.getItem('adminToken');
        if (!token) return alert("Oturum yok!");

        const activeBtn = status === 'published' ? this.dom.submitBtn : this.dom.draftBtn;
        const originalText = activeBtn.innerHTML;
        activeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        activeBtn.disabled = true;

        try {
            const formValues = this.getFormValues(status);
            const actionType = this.state.currentEditId ? "update_post" : "add_post";
            const payload = { action: actionType, id: this.state.currentEditId, token, ...formValues };

            const response = await fetch(this.apiUrl, { method: "POST", body: JSON.stringify(payload) });
            const result = await response.json();

            if (result.ok) {
                alert(this.state.currentEditId ? "Güncellendi!" : "Eklendi!");
                this.disableEditMode();
                setTimeout(() => this.fetchPosts(), 500);
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            alert("Hata: " + e.message);
        } finally {
            activeBtn.innerHTML = originalText;
            activeBtn.disabled = false;
        }
    }

    getFormValues(status) {
        return {
            baslik: document.getElementById("post-title").value,
            icerik: this.quill ? this.quill.root.innerHTML : "",
            resim: document.getElementById("post-image").value,
            tarih: this.dom.dateInput.value || new Date().toISOString().split('T')[0],
            kategori: document.getElementById("post-category").value,
            ozet: document.getElementById("post-desc").value,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: document.getElementById("read-time").value,
            etiketler: document.getElementById("tags-input").value,
            one_cikan: document.getElementById("post-featured").checked
        };
    }

    async deletePost(id, btn) {
        const token = localStorage.getItem('adminToken');
        if (!confirm("Silinsin mi?")) return;
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            const res = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify({ token, action: "delete_row", type: "posts", id })
            });
            const result = await res.json();
            if (result.ok) {
                btn.closest('.post-item').remove();
            } else {
                alert(result.error);
            }
        } catch(e) { alert("Hata"); }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.postManager = new PostManager();
});
