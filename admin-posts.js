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

  // Komple listeyi yazar (edit/sil için)
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

  // Yeni post ekler
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
    const core
