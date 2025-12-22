/* admin-posts.js - İyileştirilmiş Versiyon */

(function () {
  console.log("Admin Posts Script Yükleniyor...");

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

  // API Fonksiyonları
  function adminKey() { return sessionStorage.getItem("admin_key") || ""; }

  async function apiGetPosts() {
    const res = await fetch(`${WORKER_URL}/posts`, {
      method: "GET",
      headers: { "X-ADMIN-KEY": adminKey() },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  }

  async function apiAddPost(post) {
    const res = await fetch(`${WORKER_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ADMIN-KEY": adminKey() },
      body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiPutAllPosts(posts) {
    const res = await fetch(`${WORKER_URL}/posts/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ADMIN-KEY": adminKey() },
      body: JSON.stringify({ posts }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Render Fonksiyonları
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
      x.style.cursor = 'pointer';
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

      const statusBadge = post?.status === 'draft'
        ? `<span style="background:rgba(251,191,36,0.2);color:#fbbf24;padding:4px 8px;border-radius:4px;font-size:0.8rem;">Taslak</span>`
        : `<span style="background:rgba(16,185,129,0.2);color:#10b981;padding:4px 8px;border-radius:4px;font-size:0.8rem;">Yayında</span>`;

      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>${imgDisplay}</td>
        <td style="font-weight:600; color:white;">${core.escapeHTML(post?.title || '')}</td>
        <td>${core.escapeHTML(post?.category || '')}</td>
        <td>${statusBadge}</td>
        <td><button type="button" class="action-btn btn-delete"><i class="fa-solid fa-trash"></i></button></td>
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
    const ids = ['post-title', 'post-date', 'post-image', 'post-desc', 'read-time'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    const dateEl = document.getElementById('post-date');
    if (dateEl) dateEl.value = new Date().toLocaleDateString('tr-TR');
    
    const featuredEl = document.getElementById('post-featured');
    if (featuredEl) featuredEl.checked = false;

    state.tags = [];
    renderTags();
    if (state.quill) state.quill.setText('');
  }

  // =========================
  // GLOBAL FUNCTIONS
  // =========================

  // ✅ BU FONKSİYON ARTIK GARANTİ ÇALIŞIR
  window.savePostRemote = async function(status = 'published') {
    console.log("savePostRemote tetiklendi: ", status); // Debug

    if (!ensureCore()) return;
    if (!adminKey()) {
      alert("Admin anahtarı yok! Lütfen çıkış yapıp tekrar girin.");
      return;
    }

    const title = (document.getElementById('post-title')?.value || '').trim();
    const date = (document.getElementById('post-date')?.value || '').trim() || new Date().toLocaleDateString('tr-TR');
    const category = (document.getElementById('post-category')?.value || '').trim();
    const icon = (document.getElementById('post-image')?.value || '').trim();
    const desc = (document.getElementById('post-desc')?.value || '').trim();
    const isFeatured = !!document.getElementById('post-featured')?.checked;

    const content = state.quill ? state.quill.root.innerHTML : '';
    const plain = state.quill ? state.quill.getText().trim() : '';

    if (!title) { alert('Başlık giriniz'); return; }
    if (!category) { alert('Kategori seçiniz'); return; }
    if (status !== 'draft' && !plain) { alert('İçerik boş olamaz'); return; }

    const postData = {
      title, date, category, icon, desc, content,
      tags: [...state.tags],
      isFeatured,
      status,
      linkType: 'internal',
      url: ''
    };

    try {
      if (state.editModeIndex !== null && state.blogPosts[state.editModeIndex]) {
        state.blogPosts[state.editModeIndex] = { ...state.blogPosts[state.editModeIndex], ...postData };
        await apiPutAllPosts(state.blogPosts);
        alert('Yazı Güncellendi!');
      } else {
        await apiAddPost(postData);
        alert(status === 'draft' ? 'Taslak kaydedildi' : 'Yazı Yayınlandı!');
      }
      
      state.blogPosts = await apiGetPosts();
      renderPostsTable();
      resetPostForm();
      if(window.showSection) window.showSection('posts');
      
    } catch (e) {
      console.error(e);
      alert('Hata: ' + e.message);
    }
  };

  window.addNewCategory = () => {
    if (!ensureCore()) return;
    const core = C();
    const name = prompt('Yeni kategori adı:');
    if (!name) return;
    state.categories.unshift(name);
    core.writeLS('categories', state.categories);
    renderCategorySelect();
  };

  window.filterPosts = () => {
    const q = (document.getElementById('search-posts')?.value || '').toLowerCase();
    const filtered = state.blogPosts.filter(p => 
       (p.title || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    );
    renderPostsTable(filtered);
  };

  window.editPost = (index) => {
    const post = state.blogPosts[index];
    if (!post) return;
    state.editModeIndex = index;

    document.getElementById('post-title').value = post.title || '';
    document.getElementById('post-date').value = post.date || '';
    document.getElementById('post-category').value = post.category || '';
    document.getElementById('post-image').value = post.icon || '';
    document.getElementById('post-desc').value = post.desc || '';
    document.getElementById('post-featured').checked = !!post.isFeatured;

    state.tags = post.tags ? [...post.tags] : [];
    renderTags();
    if (state.quill) state.quill.root.innerHTML = post.content || '';

    if(window.showSection) window.showSection('new-post');
  };

  window.deletePost = async (index) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    try {
        state.blogPosts.splice(index, 1);
        await apiPutAllPosts(state.blogPosts);
        renderPostsTable();
    } catch(e) { console.error(e); }
  };

  // INIT
  document.addEventListener('DOMContentLoaded', async () => {
    if (!ensureCore()) return;
    const core = C();
    state.categories = core.readArrayLS('categories', DEFAULT_CATEGORIES);
    
    // Quill Init
    if (document.getElementById('editor-container') && window.Quill) {
      state.quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'İçerik...',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'code-block'],
            ['link', 'blockquote', 'image'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      });
      state.quill.on('text-change', () => {
         const txt = state.quill.getText();
         const count = txt.trim() ? txt.split(/\s+/).length : 0;
         const rt = document.getElementById('read-time');
         if(rt) rt.value = Math.ceil(count/200) + ' dk';
      });
    }

    // Tag Input
    const tInput = document.getElementById('tags-input');
    if(tInput) {
        tInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                const val = tInput.value.trim();
                if(val && !state.tags.includes(val)) {
                    state.tags.push(val);
                    renderTags();
                }
                tInput.value = '';
            }
        });
    }

    renderCategorySelect();
    
    try {
        if(adminKey()) {
            state.blogPosts = await apiGetPosts();
            renderPostsTable();
        }
    } catch(e) { console.error(e); }
  });

})();
