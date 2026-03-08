// admin-posts.js
// Google Sheets backend kullanılarak Post yönetimi.

const AdminPosts = {
  posts: [],
  editPostId: null,

  init: async () => {
    console.log("AdminPosts başlatılıyor...");
    await AdminPosts.loadPosts();

    // Editoru (Quill) bekle ve zengin toolbar ekle
    if (typeof Quill !== 'undefined' && !window.quill) {

      // Font Sistemini Genişletme
      const Font = Quill.import('formats/font');
      Font.whitelist = ['inter', 'roboto', 'space-grotesk', 'outfit', 'poppins', 'monospace'];
      Quill.register(Font, true);

      if (typeof QuillBlotFormatter !== 'undefined') {
        Quill.register('modules/blotFormatter', QuillBlotFormatter.default || QuillBlotFormatter);
      }

      const toolbarOptions = [
        [{ 'font': Font.whitelist }, { 'size': ['small', false, 'large', 'huge'] }], // Font ve Boyut
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // Gelişmiş başlık
        ['bold', 'italic', 'underline', 'strike'],        // Formatlama
        [{ 'color': [] }, { 'background': [] }],          // Renklendirme
        [{ 'script': 'sub' }, { 'script': 'super' }],     // Alt simge, üst simge
        [{ 'header': 1 }, { 'header': 2 }, 'blockquote', 'code-block'], // Bloklar
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],    // Liste yapısı
        [{ 'indent': '-1' }, { 'indent': '+1' }],         // Girinti
        [{ 'direction': 'rtl' }, { 'align': [] }],        // Hizalama ve Yön
        ['link', 'image', 'video', 'formula'],            // Medya ve Formül
        ['clean', 'code-block'],                          // Formatı temizle
        ['source', 'fullscreen']                          // Ozel Butonlar (Kaynak ve Tam Ekran)
      ];

      window.quill = new Quill('#editor-container', {
        modules: {
          blotFormatter: {},
          toolbar: {
            container: toolbarOptions,
            handlers: {
              'image': function () {
                const range = window.quill.getSelection();
                const value = prompt("Lütfen Görsel URL'sini giriniz (örn: https://...):");
                if (value) {
                  window.quill.insertEmbed(range ? range.index : 0, 'image', value, Quill.sources.USER);
                }
              },
              'source': function () {
                const html = window.quill.root.innerHTML;
                const newHtml = prompt("Kaynak HTML kodu (Dikkatli düzenleyin):", html);
                if (newHtml !== null) {
                  window.quill.root.innerHTML = newHtml;
                }
              },
              'fullscreen': function () {
                const editorContainer = document.querySelector('.ql-container').parentElement;
                editorContainer.classList.toggle('editor-fullscreen');

                // Ikon degistirme vs icin ufak kontrol
                if (editorContainer.classList.contains('editor-fullscreen')) {
                  window.showToast?.("Tam ekran modu aktif", "success");
                } else {
                  window.showToast?.("Tam ekran modundan çıkıldı", "success");
                }
              }
            }
          }
        },
        theme: 'snow',
        placeholder: 'Hikayenizi anlatın...'
      });

      // Buton ikonları ekleme (Quill varsayılan olarak bu özel butonların ikonlarını bilmez)
      const sourceBtn = document.querySelector('.ql-source');
      if (sourceBtn) sourceBtn.innerHTML = '<i class="fa-solid fa-code" style="font-size:14px;"></i>';

      const fsBtn = document.querySelector('.ql-fullscreen');
      if (fsBtn) fsBtn.innerHTML = '<i class="fa-solid fa-expand" style="font-size:14px;"></i>';

      // Okuma süresini otomatik hesapla (Her 200 kelime = 1 dk) ve Auto-Save yap
      window.quill.on('text-change', function () {
        const text = window.quill.getText().trim();
        const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
        const readingTime = Math.ceil(wordCount / 200);
        const readEl = document.getElementById('read-time');
        if (readEl) {
          readEl.value = readingTime === 0 ? '< 1 dk' : readingTime + ' dk';
        }

        // Auto-Save: Kullanıcı yazarken taslağı local storage'a yedekle
        if (!AdminPosts.editPostId) { // Sadece yeni yazı eklenirken
          localStorage.setItem('quill_autosave_content', window.quill.root.innerHTML);
          const titleEl = document.getElementById('post-title');
          if (titleEl) localStorage.setItem('quill_autosave_title', titleEl.value);
        }
      });

      // Varsa Auto-Save'den geri yükle (Sadece yeni yazı ekranındaysa)
      if (!AdminPosts.editPostId) {
        const savedContent = localStorage.getItem('quill_autosave_content');
        const savedTitle = localStorage.getItem('quill_autosave_title');

        if (savedContent) window.quill.root.innerHTML = savedContent;
        const titleEl = document.getElementById('post-title');
        if (savedTitle && titleEl) titleEl.value = savedTitle;
      }
    }
  },

  loadPosts: async () => {
    try {
      const data = await window.AdminCore.fetchAPI('get_posts'); // Authenticated POST
      if (data.ok) {
        AdminPosts.posts = data.posts || [];
        AdminPosts.populateCategories(); // Dinamik kategorileri yükle
        AdminPosts.renderPosts();
      } else {
        window.showToast?.("Yazılar yüklenemedi", "error");
      }
    } catch (err) {
      console.error(err);
    }
  },

  populateCategories: () => {
    const catSelect = document.getElementById('post-category');
    if (!catSelect) return;

    const currentVal = catSelect.value;
    const categories = new Set(["Genel", "Teknoloji", "Yazılım"]); // Standart kategoriler

    AdminPosts.posts.forEach(p => {
      if (p.kategori) categories.add(p.kategori.trim());
    });

    catSelect.innerHTML = '';
    Array.from(categories).sort().forEach(cat => {
      catSelect.add(new Option(cat, cat));
    });

    if (currentVal && categories.has(currentVal)) {
      catSelect.value = currentVal;
    }
  },

  renderPosts: () => {
    const tbody = document.getElementById('posts-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (AdminPosts.posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Henüz yazı eklenmemiş.</td></tr>';
      return;
    }

    AdminPosts.posts.forEach((p) => {
      const tr = document.createElement('tr');

      // İkon mu resim mi?
      let thumb = `<div style="width:50px; height:50px; background:rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                            <i class="fa-solid fa-image"></i>
                         </div>`;

      if (p.resim && p.resim.startsWith('fa-')) {
        thumb = `<div style="width:50px; height:50px; background:rgba(59,130,246,0.2); color:#3b82f6; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="${p.resim}"></i>
                         </div>`;
      } else if (p.resim) {
        thumb = `<img src="${p.resim}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;" onerror="this.src='https://placehold.co/50x50/1e293b/white?text=Img'">`;
      }

      const statusColor = (p.durum.toLowerCase() === 'yayında' || p.durum.toLowerCase() === 'published') ? '#10b981' : '#f59e0b';
      const statusText = (p.durum.toLowerCase() === 'yayında' || p.durum.toLowerCase() === 'published') ? 'Yayında' : 'Taslak';

      tr.innerHTML = `
                <td>${thumb}</td>
                <td style="font-weight:600;">${p.baslik || 'İsimsiz Yazı'}</td>
                <td><span style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; font-size:0.8rem;">${p.kategori || 'Genel'}</span></td>
                <td><span style="color:${statusColor}; font-size:0.9rem; font-weight:600;"><i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i>${statusText}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="editPost('${p.id}')" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" onclick="deletePost('${p.id}')" title="Sil"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
      tbody.appendChild(tr);
    });
  }
};

// Yeni Kategori Ekleme Fonksiyonu
window.addNewCategory = function () {
  const newCat = prompt("Yeni kategori adını girin:");
  if (!newCat || !newCat.trim()) return;

  const catSelect = document.getElementById('post-category');
  if (!catSelect) return;

  const cleanCat = newCat.trim();
  // Zaten var mı diye kontrol et
  const exists = Array.from(catSelect.options).some(opt => opt.value.toLowerCase() === cleanCat.toLowerCase());

  if (!exists) {
    catSelect.add(new Option(cleanCat, cleanCat));
  }
  catSelect.value = cleanCat;
};

window.savePost = async function (status) {
  if (!window.AdminCore || typeof window.AdminCore.fetchAPI !== 'function') {
    window.showToast?.("Sistem henüz yüklenmedi!", "error");
    return;
  }

  const titleEl = document.getElementById('post-title');
  const dateEl = document.getElementById('post-date');
  const catEl = document.getElementById('post-category');
  const readEl = document.getElementById('read-time');
  const imgEl = document.getElementById('post-image');
  const descEl = document.getElementById('post-desc');
  const featEl = document.getElementById('post-featured');

  const tagsInputEl = document.getElementById('tags-input');

  if (!titleEl.value.trim()) {
    window.showToast?.("Lütfen başlık giriniz.", "error");
    titleEl.focus();
    return;
  }

  if (!window.quill) {
    window.showToast?.("Editör yüklenmedi.", "error");
    return;
  }

  const content = window.quill.root.innerHTML;

  // Etiket listesinden varsa topla, yoksa inputtan al
  let tags = "";
  const tagsList = document.getElementById('tags-list');
  if (tagsList && tagsList.querySelectorAll('li').length > 0) {
    tags = Array.from(tagsList.querySelectorAll('li')).map(li => li.innerText.replace('✖', '').trim()).join(', ');
  } else if (tagsInputEl) {
    tags = tagsInputEl.value.trim();
  }

  const postObj = {
    baslik: titleEl.value.trim(),
    icerik: content,
    resim: imgEl?.value.trim() || "",
    tarih: dateEl?.value.trim() || "",
    kategori: catEl?.value.trim() || "Genel",
    ozet: descEl?.value.trim() || "",
    durum: status,
    okuma_suresi: readEl?.value || "",
    etiketler: tags,
    one_cikan: featEl?.checked ? "Evet" : "Hayır"
  };

  if (AdminPosts.editPostId) {
    postObj.id = AdminPosts.editPostId;
  }

  try {
    const actionText = status === 'published' ? 'Yayınlanıyor...' : 'Kaydediliyor...';
    let originalText = '';
    const targetBtn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');

    if (targetBtn) {
      originalText = targetBtn.innerHTML;
      targetBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${actionText}`;
      targetBtn.disabled = true;
    }

    const data = await window.AdminCore.fetchAPI(postObj.id ? 'update_post' : 'add_post', postObj);

    if (data.ok) {
      window.showToast?.(status === 'published' ? "Yazı yayınlandı!" : "Taslak kaydedildi!", "success");

      AdminPosts.editPostId = null;
      document.getElementById('add-post-form').reset();
      window.quill.root.innerHTML = '';

      // Kayıt başarılıysa auto-save i temizle
      localStorage.removeItem('quill_autosave_content');
      localStorage.removeItem('quill_autosave_title');

      const headerTitle = document.querySelector('#new-post .form-header h2');
      if (headerTitle) headerTitle.textContent = "Yeni Yazı Oluştur";

      await AdminPosts.loadPosts();
      if (typeof showSection === 'function') showSection('posts');
    } else {
      window.showToast?.("Hata: " + data.error, "error");
    }

    if (targetBtn) {
      targetBtn.innerHTML = originalText;
      targetBtn.disabled = false;
    }
  } catch (err) {
    window.showToast?.("Bağlantı hatası: " + err.message, "error");
    const targetBtn = document.querySelector(status === 'published' ? '.btn-submit' : '.btn-draft');
    if (targetBtn) {
      targetBtn.innerHTML = status === 'published' ? "Yayınla" : "Taslak Kaydet";
      targetBtn.disabled = false;
    }
  }
};

window.editPost = function (id) {
  const post = AdminPosts.posts.find(p => String(p.id) === String(id));
  if (!post) {
    window.showToast?.("Yazı bulunamadı!", "error");
    return;
  }

  AdminPosts.editPostId = id;

  // Form elemanlarını doldur
  document.getElementById('post-title').value = post.baslik || '';

  // Tarih Formatı Düzeltme (2026-01-13T21:00:00.000Z gibi değerleri input=date için YYYY-MM-DD formatına çevirir)
  let rawDate = post.tarih || '';
  if (rawDate && String(rawDate).includes('T')) {
    rawDate = new Date(rawDate).toISOString().split('T')[0];
  }
  document.getElementById('post-date').value = rawDate;

  // Kategori dropdown'ı doldurulmuş varsayıyoruz, onu seç:
  const catSelect = document.getElementById('post-category');
  if (catSelect) {
    // Eğer o kategori listede yoksa ekleyip seçelim
    const exists = Array.from(catSelect.options).some(opt => opt.value === post.kategori);
    if (!exists && post.kategori) {
      const newOpt = new Option(post.kategori, post.kategori);
      catSelect.add(newOpt);
    }
    catSelect.value = post.kategori || '';
  }

  document.getElementById('post-image').value = post.resim || '';
  document.getElementById('post-desc').value = post.ozet || '';
  if (document.getElementById('post-featured')) {
    document.getElementById('post-featured').checked = (post.one_cikan === "Evet");
  }

  if (window.quill) {
    window.quill.root.innerHTML = post.icerik || '';
  }

  if (typeof showSection === 'function') {
    showSection('new-post');
    const headerTitle = document.querySelector('#new-post .form-header h2');
    if (headerTitle) headerTitle.textContent = "Yazıyı Düzenle";
  }
};

window.deletePost = async function (id) {
  if (!confirm("Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?")) return;

  const tr = document.querySelector(`button[onclick="deletePost('${id}')"]`)?.closest('tr');
  if (tr) tr.style.opacity = '0.5';

  try {
    const data = await window.AdminCore.fetchAPI('delete_row', { type: 'posts', id: id });
    if (data.ok) {
      window.showToast?.("Yazı silindi.", "success");
      await AdminPosts.loadPosts();
    } else {
      window.showToast?.("Silinemedi: " + data.error, "error");
      if (tr) tr.style.opacity = '1';
    }
  } catch (err) {
    window.showToast?.("Bağlantı hatası: " + err.message, "error");
    if (tr) tr.style.opacity = '1';
  }
};

window.openNewPost = function () {
  AdminPosts.editPostId = null;
  document.getElementById('add-post-form').reset();
  if (window.quill) window.quill.root.innerHTML = '';

  const tagsList = document.getElementById('tags-list');
  if (tagsList) tagsList.innerHTML = ''; // Eski etiketleri temizle

  localStorage.removeItem('quill_autosave_content');
  localStorage.removeItem('quill_autosave_title');

  const headerTitle = document.querySelector('#new-post .form-header h2');
  if (headerTitle) headerTitle.textContent = "Yeni Yazı Oluştur";

  if (typeof showSection === 'function') showSection('new-post');
};

window.cancelEdit = function () {
  const confirmCancel = confirm("Değişiklikleri iptal edip tüm yazılara dönmek istiyor musunuz? Kaydedilmemiş veriler silinecek.");
  if (!confirmCancel) return;

  AdminPosts.editPostId = null;
  document.getElementById('add-post-form').reset();
  if (window.quill) window.quill.root.innerHTML = '';

  const tagsList = document.getElementById('tags-list');
  if (tagsList) tagsList.innerHTML = ''; // Eski etiketleri temizle

  localStorage.removeItem('quill_autosave_content');
  localStorage.removeItem('quill_autosave_title');

  const headerTitle = document.querySelector('#new-post .form-header h2');
  if (headerTitle) headerTitle.textContent = "Yeni Yazı Oluştur";

  if (typeof showSection === 'function') showSection('posts');
};

document.addEventListener('DOMContentLoaded', () => {
  // Admin.js initialize edildikten sonra çalışması için 
  setTimeout(() => {
    AdminPosts.init();
  }, 500);
});
