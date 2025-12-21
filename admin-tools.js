/* admin-tools.js */

(function () {
  function C() { return window.AdminCore; }
  function ensureCore() {
    if (!C()) {
      console.error('AdminCore bulunamadı. admin.js önce yüklenmeli.');
      return false;
    }
    return true;
  }

  let siteTools = [];
  let editIndex = null;

  // Form elemanları
  const elTitle = () => document.getElementById('tool-title');
  const elIcon  = () => document.getElementById('tool-icon');
  const elLink  = () => document.getElementById('tool-link');

  // "Ekle" butonunu yakala (admin.html’de onclick="addTool()")
  const elSaveBtn = () => document.querySelector('#tools-manager button[onclick*="addTool"]');

  // İsteğe bağlı iptal butonu (JS ile ekleyeceğiz)
  let cancelBtn = null;

  function setSaveBtnMode(mode) {
    const btn = elSaveBtn();
    if (!btn) return;

    if (mode === 'edit') {
      btn.textContent = 'Güncelle';
      btn.style.opacity = '1';
      ensureCancelBtn();
    } else {
      btn.textContent = 'Ekle';
      removeCancelBtn();
    }
  }

  function ensureCancelBtn() {
    if (cancelBtn) return;

    const btn = elSaveBtn();
    if (!btn) return;

    cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-draft';
    cancelBtn.textContent = 'İptal';
    cancelBtn.style.height = '45px';
    cancelBtn.style.marginTop = '2px';
    cancelBtn.style.marginLeft = '8px';

    cancelBtn.addEventListener('click', () => {
      resetForm();
      showToast('Düzenleme iptal edildi', 'warning');
    });

    // Ekle butonunun yanına koy
    btn.parentElement?.appendChild(cancelBtn);
  }

  function removeCancelBtn() {
    if (cancelBtn) {
      cancelBtn.remove();
      cancelBtn = null;
    }
  }

  function resetForm() {
    editIndex = null;
    if (elTitle()) elTitle().value = '';
    if (elIcon()) elIcon().value = '';
    if (elLink()) elLink().value = '';
    setSaveBtnMode('add');
  }

  function loadToForm(index) {
    const t = siteTools[index];
    if (!t) return;

    editIndex = index;

    if (elTitle()) elTitle().value = t.title || '';
    if (elIcon())  elIcon().value  = t.icon || '';
    if (elLink())  elLink().value  = t.link || '';

    setSaveBtnMode('edit');
    showToast('Düzenleme modu açıldı', 'warning');
  }

  function persist() {
    C().writeLS('siteTools', siteTools);
  }

  function moveTool(from, to) {
    if (to < 0 || to >= siteTools.length) return;
    const item = siteTools.splice(from, 1)[0];
    siteTools.splice(to, 0, item);
    persist();
    renderToolsTable();
  }

  function renderToolsTable() {
    const core = C();
    const tbody = document.getElementById('tools-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!siteTools.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="padding:18px; color:#94a3b8; text-align:center;">
            Henüz araç eklenmedi.
          </td>
        </tr>
      `;
      return;
    }

    siteTools.forEach((tool, index) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = 'Düzenlemek için tıkla';

      const icon = core.safeIconClass(tool?.icon) || 'fa-solid fa-toolbox';
      const title = core.escapeHTML(tool?.title || '');
      const link = core.escapeHTML(tool?.link || '');

      tr.innerHTML = `
        <td style="text-align:center; font-size:1.2rem;">
          <i class="${core.escapeHTML(icon)}"></i>
        </td>
        <td style="font-weight:600;">${title}</td>
        <td style="color:#94a3b8; font-size:0.9rem;">${link}</td>
        <td onclick="event.stopPropagation()">
          <div style="display:flex; gap:6px; justify-content:flex-end;">
            <button type="button" class="action-btn btn-edit" title="Yukarı Taşı" data-up="${index}">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button type="button" class="action-btn btn-edit" title="Aşağı Taşı" data-down="${index}">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button type="button" class="action-btn btn-delete" title="Sil" data-del="${index}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      // satıra tıkla => düzenle
      tr.addEventListener('click', () => loadToForm(index));

      // up/down/delete
      tr.querySelector(`[data-up="${index}"]`)?.addEventListener('click', () => {
        moveTool(index, index - 1);
      });

      tr.querySelector(`[data-down="${index}"]`)?.addEventListener('click', () => {
        moveTool(index, index + 1);
      });

      tr.querySelector(`[data-del="${index}"]`)?.addEventListener('click', () => {
        window.deleteTool(index);
      });

      tbody.appendChild(tr);
    });
  }

  // ==========================
  // GLOBAL API (admin.html onclick)
  // ==========================
  window.addTool = () => {
    if (!ensureCore()) return;
    const core = C();

    const title = (elTitle()?.value || '').trim();
    const iconRaw = (elIcon()?.value || '').trim();
    const linkRaw = (elLink()?.value || '').trim();

    if (!title || !linkRaw) return showToast('Araç adı ve link zorunlu', 'error');

    const icon = iconRaw ? (core.safeIconClass(iconRaw) || '') : '';

    // http/https güvenli, ama # / relative linklere de izin
    const isHash = linkRaw.startsWith('#');
    const isRelative = !linkRaw.includes('://') && !linkRaw.startsWith('javascript:');
    const safe = core.safeHttpUrl(linkRaw);

    const link = safe || (isHash || isRelative ? linkRaw : '');
    if (!link) return showToast('Link geçersiz (http/https veya # / relatif olmalı)', 'error');

    // EDIT MODE -> GÜNCELLE
    if (editIndex !== null && siteTools[editIndex]) {
      siteTools[editIndex] = { ...siteTools[editIndex], title, icon, link };
      persist();
      renderToolsTable();
      resetForm();
      showToast('Araç güncellendi', 'success');
      return;
    }

    // ADD MODE -> EKLE
    siteTools.unshift({ title, icon, link });
    persist();
    renderToolsTable();
    resetForm();
    showToast('Araç eklendi', 'success');
  };

  window.deleteTool = (index) => {
    if (!ensureCore()) return;

    if (!confirm('Bu aracı silmek istediğinize emin misiniz?')) return;

    siteTools.splice(index, 1);
    persist();
    renderToolsTable();

    // silinen öğe edit moddaysa resetle
    if (editIndex === index) resetForm();
    else if (editIndex !== null && index < editIndex) editIndex -= 1;

    showToast('Araç silindi', 'error');
  };

  // ==========================
  // INIT
  // ==========================
  document.addEventListener('DOMContentLoaded', () => {
    if (!ensureCore()) return;
    siteTools = C().readArrayLS('siteTools', []);
    renderToolsTable();
    setSaveBtnMode('add');
  });
})();
