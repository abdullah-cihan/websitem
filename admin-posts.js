/* admin-posts.js */

(function () {
  const DEFAULT_CATEGORIES = ['Python', 'Teknoloji', 'Felsefe', 'Yazılım', 'Kariyer', 'Video'];
  const WORKER_URL = "https://github-posts-api.abdullahcihan21.workers.dev";

  const state = {
    blogPosts: [],
    categories: [],
    editModeIndex: null,
    tags: [],
    quill: null,
  };

  function C() {
    return window.AdminCore;
  }

  function ensureCore() {
    if (!C()) {
      console.error('AdminCore bulunamadı. admin.js önce yüklenmeli.');
      return false;
    }
    return true;
  }

  // =========================
  // API HELPERS (Worker)
  // =========================
  function adminKey() {
    return sessionStorage.getItem("admin_key") || "";
  }

  async function apiGetPosts() {
    const res = await fetch(`${WORKER_URL}/posts`, {
      method: "GET",
      headers: {
        "X-ADMIN-KEY": adminKey(),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json(); // {posts:[...]}
    return Array.isArray(data.posts) ? data.posts : [];
  }

  async function apiAddPost(post) {
    const res = await fetch(`${WORKER_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ADMIN-KEY": adminKey(),
      },
      body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiPutAllPosts(posts) {
    const res = await fetch(`${WORKER_URL}/posts/all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ADMIN-KEY": adminKey(),
      },
      body: JSON.stringify({ posts }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // =========================
  // UI RENDER HELPERS
  // =========================
  function renderCategorySelect() {
    const sel = document.getElementById('post-category');
    const catsCount = document.getElementById('total-cats-count');

    if (catsCount) catsCount.textContent = String(state.categories.length);

    if (!sel) return;
    sel.innerHTML = '';

    state.categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
  }

  function renderTags() {
    const tagsList = document.getElementById('tags-list');
    if (!tagsList) return;

    tagsList.innerHTML = '';
    state.tags.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'tag-chip';
      li.textContent = t + ' ';

      const x = document.createElement('i');
      x.className = 'fa-solid fa-xmark';
      x.title = 'Sil';
      x.addEventListener('click', () => {
        state.tags.splice(idx, 1);
        renderTags();
      });

      li.appendChild(x);
      tagsList.appendChild(li);
    });
  }

  function renderPostsTable(postsToRender = state.blogPosts) {
    const core = C();
    const tbody = document.getElementById('posts-table-body');
    const countEl = document.getElementById('total-posts-count');
    if (!tbody) return;

    tbody.innerHTML = '';

    postsToRender.forEach((post) => {
      const realIndex = state.blogPosts.indexOf(post);

      const iconRaw = post?.icon || '';
      const iconUrl = String(iconRaw).includes('http') ? core.safeHttpUrl(iconRaw) : '';
      const iconCls = !iconUrl ? core.safeIconClass(iconRaw) : '';

      let imgDisplay = '';
      if (iconUrl) {
        imgDisplay = `<img src="${core.escapeHTML(iconUrl)}" style="width:40px;height:40px;border-radius:5px;object-fit:cover;">`;
      } else {
        const finalIcon = iconCls || 'fa-solid fa-pen';
        imgDisplay = `<div style="width:40px;height:40px;background:#334155;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;"><i class="${core.escapeHTML(finalIcon)}"></i></div>`;
      }

      const statusBadge =
        post?.status === 'draft'
          ? `<span style="background:rgba(251,191,36,0.2);color:#fbbf24;padding:4px 8px;border-radius:4px;font-size:0.8rem;">Taslak</span>`
          : `<span style="background:rgba(16,185,129,0.2);color:#10b981;padding:4px 8px;border-radius:4px;font-size:0.8rem;">Yayında</span>`;

      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = 'Düzenlemek için tıkla';

      tr.innerHTML = `
        <td>${imgDisplay}</td>
        <td style="font-weight:600; color:white;">${core.escapeHTML(post?.title || '')}</td>
        <td>${core.escapeHTML(post?.category || '')}</td>
        <td>${statusBadge}</td>
        <td>
          <button type="button" class="action-btn btn-delete" title="Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      tr.addEventListener('click', () => window.editPost(realIndex));

      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.deletePost(realIndex);
      });

      tbody.appendChild(tr);
    });

    if (countEl) countEl.textContent = String(state.blogPosts.length);
  }

  function resetPostForm() {
    state.editModeIndex = null;

    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    const imgEl = document.getElementById('post-image');
    const descEl = document.getElementById('post-desc');
    const featuredEl = document.getElementById('post-featured');
    const readTimeEl = document.getElementById('read-time');

    if (titleEl) titleEl.value = '';
    if (dateEl) dateEl.value = new Date().toLocaleDateString('tr-TR');
    if (imgEl) imgEl.value = '';
    if (descEl) descEl.value = '';
    if (featuredEl) featuredEl.checked = false;
    if (readTimeEl) readTimeEl.value = '';

    state.tags = [];
    renderTags();

    if (state.quill) state.quill.setText('');
  }

  // =========================
  // GLOBAL FUNCTIONS (onclick)
  // =========================
  window.addNewCategory = () => {
    if (!ensureCore()) return;
    const core = C();

    const name = prompt('Yeni kategori adı:');
    const cat = (name || '').trim();
    if (!cat) return;

    if (state.categories.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      showToast('Bu kategori zaten var.', 'warning');
      return;
    }

    state.categories.unshift(cat);

    // kategori localde kalabilir (istersen bunu da GitHub'a taşırız)
    core.writeLS('categories', state.categories);

    renderCategorySelect();
    showToast('Kategori eklendi.', 'success');
  };

  window.filterPosts = () => {
    if (!ensureCore()) return;

    const q = (document.getElementById('search-posts')?.value || '').toLowerCase().trim();
    const filtered = state.blogPosts.filter((p) => {
      const title = String(p?.title || '').toLowerCase();
      const cat = String(p?.category || '').toLowerCase();
      return title.includes(q) || cat.includes(q);
    });

    renderPostsTable(filtered);
  };

  // ✅ ÖNEMLİ: isim değişti (çakışmayı bitirir)
  window.savePostRemote = async (status = 'published') => {
    if (!ensureCore()) return;

    if (!adminKey()) {
      showToast("Admin anahtarı yok. Tekrar login olup ADMIN_KEY gir.", "error");
      return;
    }

    const title = (document.getElementById('post-title')?.value || '').trim();
    const date =
      (document.getElementById('post-date')?.value || '').trim() ||
      new Date().toLocaleDateString('tr-TR');

    const category = (document.getElementById('post-category')?.value || '').trim();
    const icon = (document.getElementById('post-image')?.value || '').trim();
    const desc = (document.getElementById('post-desc')?.value || '').trim();
    const isFeatured = !!document.getElementById('post-featured')?.checked;

    const content = state.quill ? state.quill.root.innerHTML : '';
    const plain = state.quill ? state.quill.getText().trim() : '';

    if (!title) return showToast('Başlık boş olamaz', 'error');
    if (!category) return showToast('Kategori seçiniz', 'error');
    if (status !== 'draft' && !plain) return showToast('İçerik boş olamaz', 'error');

    const postData = {
      title,
      date,
      category,
      icon,
      desc,
      content,
      tags: Array.isArray(state.tags) ? [...state.tags] : [],
      isFeatured,
      status: status === 'draft' ? 'draft' : 'published',
      linkType: 'internal',
      url: '',
    };

    try {
      // Güncelleme
      if (state.editModeIndex !== null && state.blogPosts[state.editModeIndex]) {
        state.blogPosts[state.editModeIndex] = { ...state.blogPosts[state.editModeIndex], ...postData };
        await apiPutAllPosts(state.blogPosts);
        showToast('Yazı güncellendi', 'success');
      } else {
        // Yeni ekleme
        await apiAddPost(postData);
        showToast(status === 'draft' ? 'Taslak kaydedildi' : 'Yazı yayınlandı', 'success');
      }

      // En doğru liste için tekrar çek
      state.blogPosts = await apiGetPosts();

      renderPostsTable();
      resetPostForm();
      window.showSection?.('posts');
    } catch (e) {
      console.error(e);
      showToast('Kaydetme hatası: ' + (e?.message || 'Bilinmeyen hata'), 'error');
    }
  };

  window.editPost = (index) => {
    if (!ensureCore()) return;

    const post = state.blogPosts[index];
    if (!post) return;

    state.editModeIndex = index;

    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    const catEl = document.getElementById('post-category');
    const imgEl = document.getElementById('post-image');
    const descEl = document.getElementById('post-desc');
    const featuredEl = document.getElementById('post-featured');

    if (titleEl) titleEl.value = post.title || '';
    if (dateEl) dateEl.value = post.date || '';
    if (catEl) catEl.value = post.category || state.categories[0] || '';
    if (imgEl) imgEl.value = post.icon || '';
    if (descEl) descEl.value = post.desc || '';
    if (featuredEl) featuredEl.checked = !!post.isFeatured;

    state.tags = Array.isArray(post.tags) ? [...post.tags] : [];
    renderTags();

    if (state.quill) state.quill.root.innerHTML = post.content || '';

    showToast('Düzenleme modu', 'warning');
    window.showSection?.('new-post');
  };

  window.deletePost = async (index) => {
    if (!ensureCore()) return;

    if (!adminKey()) {
      showToast("Admin anahtarı yok. Tekrar login olup ADMIN_KEY gir.", "error");
      return;
    }

    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;

    try {
      state.blogPosts.splice(index, 1);
      await apiPutAllPosts(state.blogPosts);

      // tekrar çek
      state.blogPosts = await apiGetPosts();

      renderPostsTable();
      showToast('Yazı silindi', 'error');
    } catch (e) {
      console.error(e);
      showToast('Silme hatası: ' + (e?.message || 'Bilinmeyen hata'), 'error');
    }
  };

  // =========================
  // INIT
  // =========================
  document.addEventListener('DOMContentLoaded', async () => {
    if (!ensureCore()) return;
    const core = C();

    // Categories (local)
    state.categories = core.readArrayLS('categories', DEFAULT_CATEGORIES);
    if (!state.categories.length) state.categories = [...DEFAULT_CATEGORIES];

    // Quill
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer && window.Quill) {
      state.quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'İçeriği buraya yazın...',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'code-block'],
            ['link', 'blockquote', 'image'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean'],
          ],
        },
      });

      state.quill.on('text-change', () => {
        const text = state.quill.getText();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const readTimeEl = document.getElementById('read-time');
        if (readTimeEl) readTimeEl.value = `${Math.ceil(wordCount / 200) || 1} Dakika`;
      });
    }

    // Date default
    const dateEl = document.getElementById('post-date');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toLocaleDateString('tr-TR');

    // Tags input
    const tagsInput = document.getElementById('tags-input');
    if (tagsInput) {
      tagsInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const val = (tagsInput.value || '').trim();
        if (!val) return;

        const normalized = val.toLowerCase();
        if (state.tags.some((x) => x.toLowerCase() === normalized)) {
          tagsInput.value = '';
          return;
        }

        state.tags.push(val);
        tagsInput.value = '';
        renderTags();
      });
    }

    renderCategorySelect();

    // ✅ Posts'u GitHub'tan çek
    try {
      if (!adminKey()) {
        state.blogPosts = [];
      } else {
        state.blogPosts = await apiGetPosts();
      }
    } catch (e) {
      console.error(e);
      showToast("Postlar alınamadı: " + (e?.message || ""), "error");
      state.blogPosts = [];
    }

    renderPostsTable();
  });
})();
