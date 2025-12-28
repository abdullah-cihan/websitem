class BlogManager {
    constructor() {
        this.apiUrl = window.API_URL; // Global API URL'ini al
        this.token = localStorage.getItem('adminToken');
        
        // Durum (State) Yönetimi
        this.posts = [];
        this.currentEditId = null;
        this.categories = JSON.parse(localStorage.getItem('categories') || '["Genel","Teknoloji","Yazılım","Hayat","Seyahat"]');

        // DOM Elementlerini Tanımla
        this.ui = {
            viewList: document.getElementById('view-list'),
            viewEditor: document.getElementById('view-editor'),
            postsContainer: document.getElementById('posts-container'),
            form: document.getElementById('post-form'),
            searchInput: document.getElementById('search-input'),
            titleDisplay: document.getElementById('form-title'),
            btnNew: document.getElementById('btn-new-post'),
            btnCancel: document.getElementById('btn-cancel'),
            btnSaveDraft: document.getElementById('btn-save-draft'),
            inputs: {
                title: document.getElementById('inp-title'),
                category: document.getElementById('inp-category'),
                date: document.getElementById('inp-date'),
                image: document.getElementById('inp-image'),
                desc: document.getElementById('inp-desc'),
                readTime: document.getElementById('inp-readtime'),
                tags: document.getElementById('inp-tags'),
                featured: document.getElementById('inp-featured'),
            }
        };

        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        this.initQuill();
        this.loadCategories();
        this.fetchPosts();
        this.addEventListeners();
    }

    initQuill() {
        this.quill = new Quill('#quill-editor', {
            theme: 'snow',
            placeholder: 'Harika bir içerik oluştur...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'code-block'],
                    ['clean']
                ]
            }
        });
    }

    loadCategories() {
        this.ui.inputs.category.innerHTML = this.categories
            .map(c => `<option value="${c}">${c}</option>`).join('');
    }

    addEventListeners() {
        // Yeni Yazı Butonu
        this.ui.btnNew.addEventListener('click', () => this.switchView('editor'));
        
        // Vazgeç Butonu
        this.ui.btnCancel.addEventListener('click', () => this.switchView('list'));

        // Form Submit (Yayınla)
        this.ui.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePost('Yayında');
        });

        // Taslak Kaydet
        this.ui.btnSaveDraft.addEventListener('click', (e) => {
            e.preventDefault();
            this.savePost('Taslak');
        });

        // Arama
        this.ui.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = this.posts.filter(p => p.baslik.toLowerCase().includes(term));
            this.renderPosts(filtered);
        });
    }

    switchView(mode) {
        if (mode === 'editor') {
            this.ui.viewList.style.display = 'none';
            this.ui.viewEditor.style.display = 'block';
            
            // Eğer yeni bir yazıysa formu temizle
            if (!this.currentEditId) {
                this.resetForm();
                this.ui.titleDisplay.innerText = "Yeni Yazı Oluştur";
            } else {
                this.ui.titleDisplay.innerText = "Yazıyı Düzenle";
            }
        } else {
            this.ui.viewList.style.display = 'block';
            this.ui.viewEditor.style.display = 'none';
            this.currentEditId = null; // ID'yi sıfırla
            this.resetForm();
        }
    }

    resetForm() {
        this.ui.form.reset();
        this.quill.setContents([]);
        this.ui.inputs.date.valueAsDate = new Date();
    }

    // ================= VERİ İŞLEMLERİ =================

    async fetchPosts() {
        this.ui.postsContainer.innerHTML = '';
        document.getElementById('loading-spinner').style.display = 'block';

        try {
            const res = await fetch(`${this.apiUrl}?type=posts`);
            const data = await res.json();
            
            if (data.posts) {
                this.posts = data.posts.reverse(); // En yeniden eskiye
                this.renderPosts(this.posts);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', 'Veriler çekilemedi.', 'error');
        } finally {
            document.getElementById('loading-spinner').style.display = 'none';
        }
    }

    renderPosts(postsToRender) {
        if (postsToRender.length === 0) {
            this.ui.postsContainer.innerHTML = '<p style="text-align:center; color:#94a3b8;">Kayıtlı yazı bulunamadı.</p>';
            return;
        }

        this.ui.postsContainer.innerHTML = postsToRender.map(p => {
            const isPublished = p.durum === 'Yayında';
            const statusIcon = isPublished ? 'fa-check-circle' : 'fa-clock';
            const statusClass = isPublished ? 'published' : 'draft';
            const dateStr = p.tarih ? new Date(p.tarih).toLocaleDateString('tr-TR') : '-';

            return `
                <div class="post-card">
                    <div class="post-info">
                        <h3>${p.baslik} ${p.one_cikan ? '<i class="fa-solid fa-star" style="color:#f59e0b; font-size:12px;"></i>' : ''}</h3>
                        <div class="post-meta">
                            <span class="badge badge-cat">${p.kategori}</span>
                            <span class="badge badge-status ${statusClass}"><i class="fa-solid ${statusIcon}"></i> ${p.durum}</span>
                            <span><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                        </div>
                    </div>
                    <div class="post-actions-btn">
                        <button class="icon-btn edit" onclick="blogManager.editPost(${p.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete" onclick="blogManager.deletePost(${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ================= DÜZENLEME & KAYDETME =================

    editPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        this.currentEditId = id;
        
        // Form Alanlarını Doldur
        this.ui.inputs.title.value = post.baslik;
        this.ui.inputs.category.value = post.kategori;
        this.ui.inputs.date.value = post.tarih ? post.tarih.split('T')[0] : '';
        this.ui.inputs.image.value = post.resim || '';
        this.ui.inputs.desc.value = post.ozet || '';
        this.ui.inputs.readTime.value = post.okuma_suresi || '';
        this.ui.inputs.tags.value = post.etiketler || '';
        this.ui.inputs.featured.checked = (String(post.one_cikan) === "true");
        
        // Quill Editöre İçeriği Bas
        this.quill.root.innerHTML = post.icerik || '';

        this.switchView('editor');
    }

    async savePost(status) {
        const title = this.ui.inputs.title.value;
        if (!title) {
            Swal.fire('Eksik Bilgi', 'Lütfen yazı başlığını girin.', 'warning');
            return;
        }

        const btn = status === 'Yayında' ? document.getElementById('btn-publish') : this.ui.btnSaveDraft;
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        const postData = {
            action: this.currentEditId ? "update_post" : "add_post",
            id: this.currentEditId,
            token: this.token,
            baslik: title,
            icerik: this.quill.root.innerHTML,
            resim: this.ui.inputs.image.value,
            tarih: this.ui.inputs.date.value || new Date().toISOString().split('T')[0],
            kategori: this.ui.inputs.category.value,
            ozet: this.ui.inputs.desc.value,
            durum: status,
            okuma_suresi: this.ui.inputs.readTime.value,
            etiketler: this.ui.inputs.tags.value,
            one_cikan: this.ui.inputs.featured.checked
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify(postData)
            });
            const result = await response.json();

            if (result.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: this.currentEditId ? 'Yazı güncellendi.' : 'Yeni yazı eklendi.',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.switchView('list');
                this.fetchPosts();
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            Swal.fire('Hata', 'Kaydedilemedi: ' + e.message, 'error');
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }

    // ================= SİLME İŞLEMİ =================

    async deletePost(id) {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu yazı kalıcı olarak silinecek!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'Vazgeç'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify({
                    token: this.token,
                    action: "delete_row",
                    type: "posts",
                    id: id
                })
            });
            const data = await response.json();

            if (data.ok) {
                this.posts = this.posts.filter(p => p.id !== id); // Array'den sil
                this.renderPosts(this.posts); // Tekrar render et (API çağırmadan)
                Swal.fire('Silindi!', 'Yazı başarıyla silindi.', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            Swal.fire('Hata', 'Silme işlemi başarısız: ' + e.message, 'error');
        }
    }
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', () => {
    // Global değişkene ata ki HTML içindeki onclick fonksiyonları erişebilsin
    window.blogManager = new BlogManager();
});
