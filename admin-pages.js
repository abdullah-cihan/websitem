/* admin-pages.js */

(function () {
  // ----------------------------
  // Core erişimi
  // ----------------------------
  function core() {
    return window.AdminCore;
  }

  function ensureCore() {
    if (!core()) {
      console.error('AdminCore bulunamadı. admin.js önce yüklenmeli.');
      return false;
    }
    return true;
  }

  // ----------------------------
  // State
  // ----------------------------
  let customPages = [];
  let editPageIndex = null;

  // ----------------------------
  // Helpers
  // ----------------------------
  function getCodeEl() {
    // Yeni id: page-content | Eski id: page-code-editor
    return document.getElementById('page-content') || document.getElementById('page-code-editor');
  }

  function getCodeValue() {
    const el = getCodeEl();
    return el ? el.value : '';
  }

  function setCodeValue(val) {
    const el = getCodeEl();
    if (el) el.value = val ?? '';
  }

  function pageLinkForId(id) {
    const safe = encodeURIComponent(String(id ?? '').trim());
    return `tool-view.html?page=${safe}`;
  }

  // ----------------------------
  // Render
  // ----------------------------
  function renderPagesTable() {
    const C = core();
    const tbody = document.getElementById('pages-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!customPages || !customPages.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">Henüz oluşturulmuş bir sayfa yok.</td></tr>';
      return;
    }

    customPages.forEach((page, index) => {
      const link = pageLinkForId(page?.id);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${C.escapeHTML(page?.title || '')}</td>
        <td><span style="font-size:0.85rem; color:#94a3b8;">${C.escapeHTML(page?.date || '')}</span></td>
        <td>
          <div class="link-box" style="width:fit-content; background:#0f172a; padding:5px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
            <input type="text" value="${C.escapeHTML(link)}" readonly style="background:transparent; border:none; color:#94a3b8; width:180px; font-size:0.8rem;">
            <button type="button" class="action-btn btn-copy" title="Kopyala">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </td>
        <td style="display:flex; gap:5px;">
          <a href="${C.escapeHTML(link)}" target="_blank" rel="noopener noreferrer"
            class="action-btn btn-view" title="Görüntüle"
            style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
            <i class="fa-solid fa-eye"></i>
          </a>
          <button type="button" class="action-btn btn-edit" title="Düzenle">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="action-btn btn-delete" title="Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      // KOPYALA
      tr.querySelector('.btn-copy')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(link);
          window.showToast?.('Link kopyalandı!', 'success');
        } catch {
          window.showToast?.('Kopyalama başarısız (tarayıcı izin vermedi).', 'error');
        }
      });

      // DÜZENLE
      tr.querySelector('.btn-edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.loadPageToEdit(index);
      });

      // SİL
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.deletePage(index);
      });

      tbody.appendChild(tr);
    });
  }

  // ----------------------------
  // Global API
  // ----------------------------
  window.savePage = async () => {
    if (!ensureCore()) return;
    const C = core();

    const title = (document.getElementById('page-title')?.value || '').trim();
    const code = (getCodeValue() || '').trim();

    if (!title || !code) {
      alert('Lütfen başlık ve içerik alanlarını doldurun!');
      return;
    }

    const id =
      (editPageIndex !== null && customPages[editPageIndex])
        ? customPages[editPageIndex].id
        : Date.now().toString();

    const pageData = {
      id,
      baslik: title,
      icerik: code,
      date: new Date().toLocaleDateString('tr-TR'),
    };

    // UI Feedback
    const btnSave = document.getElementById('btn-save-page');
    if (btnSave) btnSave.disabled = true;

    try {
      const res = await C.fetchAPI(editPageIndex !== null ? 'update_page' : 'add_page', pageData);
      if (res.ok) {
        if (editPageIndex !== null && customPages[editPageIndex]) {
          customPages[editPageIndex] = { id, title, code, date: pageData.date, link: res.link || customPages[editPageIndex].link };
          window.showToast?.('Sayfa başarıyla güncellendi!', 'success');
        } else {
          customPages.unshift({ id: res.id || id, title, code, date: pageData.date, link: res.link });
          window.showToast?.('Yeni sayfa oluşturuldu!', 'success');
        }
      } else {
        throw new Error(res.error || "Sunucu hatası");
      }

      C.writeLS('customPages', customPages);

      window.resetPageForm();
      window.showSection?.('pages-manager');
      renderPagesTable();
    } catch (err) {
      console.error(err);
      window.showToast?.('Sayfa kaydedilemedi: ' + err.message, 'error');
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerHTML = (editPageIndex !== null) ? '<i class="fa-solid fa-rotate"></i> Güncelle' : '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
      }
    }
  };

  window.loadPageToEdit = (index) => {
    if (!ensureCore()) return;

    const page = customPages[index];
    if (!page) return;

    editPageIndex = index;

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.value = page.title || '';

    setCodeValue(page.code || '');

    const formTitle = document.getElementById('page-form-title');
    if (formTitle) formTitle.textContent = 'Sayfayı Düzenle';

    const btnSave = document.getElementById('btn-save-page');
    if (btnSave) btnSave.innerHTML = '<i class="fa-solid fa-rotate"></i> Güncelle';

    window.showSection?.('page-editor');
  };

  window.deletePage = async (index) => {
    if (!ensureCore()) return;
    const C = core();

    if (!confirm('Bu sayfayı silmek istediğinize emin misiniz?')) return;

    const page = customPages[index];
    if (!page) return;

    try {
      // Backend delete via API
      const res = await C.fetchAPI('delete_row', { type: 'pages', id: page.id });

      if (res.ok) {
        customPages.splice(index, 1);
        C.writeLS('customPages', customPages);

        renderPagesTable();
        window.showToast?.('Sayfa silindi.', 'success');
      } else {
        throw new Error(res.error || "Sunucu hatası");
      }
    } catch (err) {
      console.error(err);
      window.showToast?.('Sayfa silinemedi: ' + err.message, 'error');
    }
  };

  window.resetPageForm = () => {
    editPageIndex = null;

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.value = '';

    setCodeValue('');

    const formTitle = document.getElementById('page-form-title');
    if (formTitle) formTitle.textContent = 'Yeni Sayfa Oluştur';

    const btnSave = document.getElementById('btn-save-page');
    if (btnSave) btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
  };

  window.openNewPageEditor = () => {
    window.resetPageForm();
    window.showSection?.('page-editor');
  };

  // ----------------------------
  // INIT (tek DOMContentLoaded)
  // ----------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    if (!ensureCore()) return;
    const C = core();

    // Offline / İlk açılış hızı için LS
    customPages = C.readArrayLS('customPages', []);
    renderPagesTable();

    // Backend'den çekme
    try {
      const data = await C.fetchAPI('get_pages');
      if (data.ok && data.pages) {
        // Mapping from sheet (id, baslik, icerik, tarih, link) to local object
        customPages = data.pages.map(p => ({
          id: p.id,
          title: p.baslik,
          code: p.icerik,
          date: p.tarih,
          link: p.link
        }));
        C.writeLS('customPages', customPages);
        renderPagesTable();
      }
    } catch (err) {
      console.warn('Sayfalar sunucudan alınamadı, yerel önbellek kullanılıyor.', err);
    }
  });
})();
