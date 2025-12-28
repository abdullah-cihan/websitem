/**
 * ADMIN POSTS MANAGER (MODERN - LISTE GİZLENMEZ)
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
            cancelBtn: null, // Dinamik oluşturulacak
            submitBtn: document.querySelector('.btn-submit'),
            draftBtn: document.querySelector('.btn-draft')
        };

        // Quill Editör Referansı
        this.quill = null;

        // Başlat
        this.init();
    }

    async init() {
        this.initQuill();
        this.initDateInput();
        this.loadCategories();
        this.bindGlobalEvents(); // Form butonlarını dinle
        await this.fetchPosts();
    }

    // --- 1. BAŞLANGIÇ AYARLARI ---

    initQuill() {
        if (typeof Quill !== 'undefined' && !this.quill) {
            this.quill = new Quill('#editor-container', { 
                theme: 'snow', 
                placeholder: 'İçerik buraya...' 
            });
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

        this.dom.categorySelect.innerHTML = cats
            .map(c => `<option value="${c}">${c}</option>`)
            .join('');
    }

    bindGlobalEvents() {
        // Kaydet Butonu (Yayında)
        if (this.dom.submitBtn) {
            this.dom.submitBtn.addEventListener('click', () => this.savePost('published'));
        }
        
        // Taslak Butonu
        if (this.dom.draftBtn) {
            this.dom.draftBtn.addEventListener('click', () => this.savePost('draft'));
        }

        // Liste Üzerindeki Tıklamalar (Event Delegation)
        if (this.dom.listContainer) {
            this.dom.listContainer.addEventListener('click', (e) => {
                const target = e.target;
                const postItem = target.closest('.post-item');
                const deleteBtn = target.closest('.delete-btn');

                if (!postItem) return;

                // Silme Butonuna Tıklandıysa
                if (deleteBtn) {
                    e.stopPropagation();
                    const postId = postItem.dataset.id;
                    this.deletePost(postId, deleteBtn);
                    return;
                }

                // Postun Kendisine Tıklandıysa (Düzenleme Modu)
                const postData = this.state.posts.find(p => String(p.id) === String(postItem.dataset.id));
                if (postData) {
                    this.enableEditMode(postData);
                }
            });
        }
    }

    // --- 2. VERİ ÇEKME VE LİSTELEME ---

    async fetchPosts() {
        // Orijinal tabloyu gizle (eğer varsa)
        if (this.dom.tableBody) {
            const parentTable = this.dom.tableBody.closest('table');
            if (parentTable) parentTable.style.display = 'none';
        }
        
        if (!this.dom.listContainer) {
            const wrapper = document.createElement('div');
            wrapper.id = 'post-list-container';
            wrapper.className = 'post-list-container';
            // Tablonun olduğu yere ekle
            this.dom.tableBody?.closest('div')?.appendChild(wrapper);
            this.dom.listContainer = wrapper;
            this.bindGlobalEvents(); 
        }

        this.dom.listContainer.style.display = 'block';
        this.dom.form.style.display = 'block';
        this.dom.listContainer.innerHTML = this.renderLoading();

        try {
            const res = await fetch(`${this.apiUrl}?type=posts`);
            const data = await res.json();
            this.state.posts = data.posts || [];

            this.renderList();
        } catch (error) {
            console.error(error);
            this.dom.listContainer.innerHTML = `<p class="text-center text-red-500">Veriler yüklenirken hata oluştu.</p>`;
        }
    }

    renderList() {
        if (this.state.posts.length === 0) {
            this.dom.listContainer.innerHTML = '<p class="text-center text-gray-400 p-5">Henüz yazı yok.</p>';
            return;
        }

        const html = this.state.posts.slice().reverse().map(post => {
            const dateDisplay = new Date(post.tarih).toLocaleDateString('tr-TR');
            const statusClass = post.durum === 'Yayında' ? 'status-active' : 'status-draft';
            const starIcon = post.one_cikan ? '<i class="fa-solid fa-star text-yellow-400 ml-2"></i>' : '';

            // Seçili olan satırı belirginleştirmek için logic eklenebilir ama şu an basit tutuyoruz
            return `
                <div class="post-item cursor-pointer hover:bg-gray-50 transition p-4 border-b" data-id="${post.id}">
                    <div class="post-info">
                        <div class="post-title-row font-bold text-lg text-gray-800">${post.baslik}</div>
                        <div class="post-meta-row text-sm text-gray-500 mt-1 flex items-center gap-3">
                            <span><span class="post-status ${statusClass} w-2 h-2 inline-block rounded-full mr-1"></span> ${post.durum}</span>
                            <span><i class="fa-regular fa-calendar"></i> ${dateDisplay}</span>
                            <span class="post-badge bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">${post.kategori}</span>
                            ${starIcon}
                        </div>
                    </div>
                    <div class="post-actions mt-2 flex justify-end gap-2">
                        <button class="icon-btn delete-btn text-red-500 hover:text-red-700 p-2"><i class="fa-solid fa-trash"></i></button>
                        <i class="fa-solid fa-pen-to-square text-gray-400"></i>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.listContainer.innerHTML = html;
    }

    renderLoading() {
        return '<p class="text-center text-gray-400 p-5"><i class="fa-solid fa-circle-notch fa-spin"></i> Yükleniyor...</p>';
    }

    // --- 3. DÜZENLEME MODU (LİSTE GİZLENMEZ) ---

    enableEditMode(post) {
        console.log("Düzenleme Modu:", post.baslik);
        this.state.currentEditId = post.id;

        // UI Değişiklikleri
        // DİKKAT: Listeyi gizleyen kod kaldırıldı (this.dom.listContainer.style.display = 'none'; SİLİNDİ)
        
        this.updateFormTitle(`Yazıyı Düzenle: ${post.baslik}`);
        this.toggleSubmitButtonState(true); 
        this.createOrShowCancelButton();
        
        // Kullanıcıyı formun başına kaydır
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Formu Doldur
        this.fillForm(post);
    }

    disableEditMode() {
        this.state.currentEditId = null;
        
        // UI Reset
        this.dom.form.reset();
        if (this.quill) this.quill.setContents([]);
        this.dom.dateInput.valueAsDate = new Date();

        // Başlığı ve butonları eski haline getir
        this.updateFormTitle(null); 
        this.toggleSubmitButtonState(false);
        
        if (this.dom.cancelBtn) this.dom.cancelBtn.style.display = 'none';
        
        // Scroll hareketi yapmaya gerek yok, kullanıcı zaten listede veya formda kalabilir.
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

    // --- 4. UI YARDIMCILARI ---

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
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Değişiklikleri Güncelle';
            this.dom.submitBtn.style.background = '#f59e0b'; // Amber
        } else {
            this.dom.submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kaydet';
            this.dom.submitBtn.style.background = '';
        }
    }

    createOrShowCancelButton() {
        if (!this.dom.cancelBtn) {
            const btn = document.createElement('button');
            btn.type = "button";
            btn.className = 'cancel-edit-btn mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition';
            // Metni güncelledik:
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Vazgeç / Yeni Ekle';
            btn.onclick = () => this.disableEditMode();
            
            this.dom.form.insertBefore(btn, this.dom.form.firstChild);
            this.dom.cancelBtn = btn;
        }
        this.dom.cancelBtn.style.display = 'inline-block';
    }

    // --- 5. KAYDETME VE SİLME İŞLEMLERİ ---

    async savePost(status) {
        const token = localStorage.getItem('adminToken');
        if (!token) return this.handleAuthError();

        const activeBtn = status === 'published' ? this.dom.submitBtn : this.dom.draftBtn;
        const originalText = activeBtn.innerHTML;
        
        this.setLoading(activeBtn, true);

        try {
            const formValues = this.getFormValues(status);
            const actionType = this.state.currentEditId ? "update_post" : "add_post";

            const payload = {
                action: actionType,
                id: this.state.currentEditId,
                token: token,
                ...formValues
            };

            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.ok) {
                alert(this.state.currentEditId ? "✅ Yazı güncellendi!" : "✅ Yazı eklendi!");
                this.disableEditMode(); // Formu temizle
                setTimeout(() => this.fetchPosts(), 500); // Listeyi yenile
            } else {
                throw new Error(result.error || "İşlem başarısız.");
            }

        } catch (error) {
            alert("HATA: " + error.message);
        } finally {
            this.setLoading(activeBtn, false, originalText);
        }
    }

    getFormValues(status) {
        const title = document.getElementById("post-title").value;
        if (!title) throw new Error("Başlık alanı zorunludur.");

        let dateVal = this.dom.dateInput.value;
        if (!dateVal) dateVal = new Date().toISOString().split('T')[0];

        return {
            baslik: title,
            icerik: this.quill ? this.quill.root.innerHTML : "",
            resim: document.getElementById("post-image").value,
            tarih: dateVal,
            kategori: document.getElementById("post-category").value,
            ozet: document.getElementById("post-desc").value,
            durum: status === 'published' ? 'Yayında' : 'Taslak',
            okuma_suresi: document.getElementById("read-time").value,
            etiketler: document.getElementById("tags-input").value,
            one_cikan: document.getElementById("post-featured").checked
        };
    }

    async deletePost(id, btnElement) {
        const token = localStorage.getItem('adminToken');
        if (!token) return this.handleAuthError();
        
        if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;

        const originalIcon = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

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
                // UI'dan satırı sil
                const row = btnElement.closest('.post-item');
                row.style.transition = "all 0.5s";
                row.style.opacity = "0";
                row.style.transform = "translateX(20px)";
                setTimeout(() => row.remove(), 500);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert("Silme hatası: " + error.message);
            btnElement.innerHTML = originalIcon;
        }
    }

    setLoading(btn, isLoading, originalText = '') {
        if (!btn) return;
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
        } else {
            btn.innerHTML = originalText;
        }
    }

    handleAuthError() {
        alert("Oturum süreniz dolmuş. Giriş sayfasına yönlendiriliyorsunuz.");
        window.location.href = "login.html";
    }
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', () => {
    window.postManager = new PostManager();
});
