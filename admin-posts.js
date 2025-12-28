/**
 * ADMIN POSTS MANAGER (MODERN)
 * Özellikler: ES6 Class Yapısı, Event Delegation, Async/Await
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
        // Düzenle ve Sil butonları için tek bir dinleyici
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
        // Tabloyu gizle, liste konteynerini hazırla
        if (this.dom.tableBody) this.dom.tableBody.closest('table').style.display = 'none';
        
        if (!this.dom.listContainer) {
            // Konteyner yoksa oluştur
            const wrapper = document.createElement('div');
            wrapper.id = 'post-list-container';
            wrapper.className = 'post-list-container';
            this.dom.tableBody?.closest('div').appendChild(wrapper);
            this.dom.listContainer = wrapper;
            // Event listener'ı yeni elemana tekrar bağla
            this.bindGlobalEvents(); 
        }

        // UI Reset
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

        // HTML string oluştur (Map kullanımı performanslıdır)
        const html = this.state.posts.slice().reverse().map(post => {
            const dateDisplay = new Date(post.tarih).toLocaleDateString('tr-TR');
            const statusClass = post.durum === 'Yayında' ? 'status-active' : 'status-draft';
            const starIcon = post.one_cikan ? '<i class="fa-solid fa-star text-yellow-400 ml-2"></i>' : '';

            return `
                <div class="post-item" data-id="${post.id}">
                    <div class="post-info">
                        <div class="post-title-row font-bold">${post.baslik}</div>
                        <div class="post-meta-row text-sm text-gray-500 mt-1">
                            <span class="mr-3"><span class="post-status ${statusClass} w-2 h-2 inline-block rounded-full mr-1"></span> ${post.durum}</span>
                            <span class="mr-3"><i class="fa-regular fa-calendar"></i> ${dateDisplay}</span>
                            <span class="post-badge bg-gray-200 px-2 py-0.5 rounded text-xs">${post.kategori}</span>
                            ${starIcon}
                        </div>
                    </div>
                    <div class="post-actions opacity-50 hover:opacity-100 transition-opacity">
                        <button class="icon-btn delete-btn text-red-500 p-2 hover:bg-red-50 rounded"><i class="fa-solid fa-trash"></i></button>
                        <i class="fa-solid fa-chevron-right ml-2"></i>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.listContainer.innerHTML = html;
    }

    renderLoading() {
        return '<p class="text-center text-gray-400 p-5"><i class="fa-solid fa-circle-notch fa-spin"></i> Yükleniyor...</p>';
    }

    // --- 3. DÜZENLEME MODU (FOCUS MODE) ---

    enableEditMode(post) {
        console.log("Düzenleme Modu:", post.baslik);
        this.state.currentEditId = post.id;

        // UI Değişiklikleri
        this.dom.listContainer.style.display = 'none'; // Listeyi gizle
        this.updateFormTitle(`Yazıyı Düzenle: ${post.baslik}`);
        this.toggleSubmitButtonState(true); // Buton rengini değiştir
        this.createOrShowCancelButton();
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

        this.dom.listContainer.style.display = 'block'; // Listeyi göster
        this.updateFormTitle(null); // Orijinal başlığa dön
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
        
        // Tarih (YYYY-MM-DD formatı input için gereklidir)
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
            btn.className = 'cancel-edit-btn mb-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition';
            btn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Vazgeç ve Listeye Dön';
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
                alert(this.state.currentEditId ? "✅ Yazı başarıyla güncellendi!" : "✅ Yeni yazı eklendi!");
                this.disableEditMode(); // Resetle ve listeye dön
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
                // UI'dan satırı sil (yeniden fetch etmeye gerek kalmadan)
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

    // --- YARDIMCI FONKSİYONLAR ---

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
