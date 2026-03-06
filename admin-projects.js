// ==========================================
// ADMIN - PROJE YÖNETİMİ (CRUD)
// ==========================================
(function () {
    'use strict';

    function C() { return window.AdminCore; }
    function ready() {
        if (!C()) {
            console.error('AdminCore bulunamadı. admin.js önce yüklenmeli.');
            return false;
        }
        return true;
    }

    let allProjects = [];

    // ---- Projeleri Yükle ----
    async function loadProjects() {
        const tbody = document.getElementById('projects-table-body');
        if (!tbody || !ready()) return;

        try {
            const data = await C().fetchAPI('get_projects');
            if (data.ok && data.projects) {
                allProjects = data.projects;
                renderProjectsTable();
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted);">Henüz proje eklenmemiş.</td></tr>`;
            }
        } catch (err) {
            console.error('Projeler yüklenemedi:', err);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#ef4444;">Projeler yüklenemedi.</td></tr>`;
        }
    }

    // ---- Tablo Render ----
    function renderProjectsTable() {
        const tbody = document.getElementById('projects-table-body');
        if (!tbody) return;

        if (allProjects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted);">Henüz proje eklenmemiş.</td></tr>`;
            return;
        }

        const esc = C().escapeHTML;

        tbody.innerHTML = allProjects.map(p => {
            const tags = String(p.etiketler || '').split(',').filter(Boolean).map(t =>
                `<span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.75rem; background:rgba(56,189,248,0.1); color:#38bdf8; margin:2px;">${esc(t.trim())}</span>`
            ).join('');

            const ghLink = p.github_link ? `<a href="${esc(p.github_link)}" target="_blank" style="color:var(--primary);"><i class="fa-brands fa-github"></i></a>` : '—';
            const demoLink = p.demo_link ? `<a href="${esc(p.demo_link)}" target="_blank" style="color:var(--primary);"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '—';

            return `<tr>
        <td><i class="${esc(p.ikon || 'fa-solid fa-code')}" style="color:${esc(p.renk || '#38bdf8')}; font-size:1.4rem;"></i></td>
        <td><strong>${esc(p.baslik)}</strong><br><small style="color:var(--text-muted);">${esc((p.aciklama || '').substring(0, 60))}...</small></td>
        <td>${tags || '—'}</td>
        <td>${ghLink}</td>
        <td>${demoLink}</td>
        <td>
          <button onclick="editProject('${p.id}')" class="btn-edit" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteProject('${p.id}')" class="btn-delete" title="Sil"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
        }).join('');
    }

    // ---- Yeni Proje Formu Aç ----
    window.openNewProjectForm = function () {
        document.getElementById('project-form-container').style.display = 'block';
        document.getElementById('project-form-title').textContent = 'Yeni Proje Ekle';
        document.getElementById('project-edit-id').value = '';
        document.getElementById('project-baslik').value = '';
        document.getElementById('project-aciklama').value = '';
        document.getElementById('project-ikon').value = 'fa-solid fa-code';
        document.getElementById('project-renk').value = '#38bdf8';
        document.getElementById('project-etiketler').value = '';
        document.getElementById('project-github').value = '';
        document.getElementById('project-demo').value = '';
    };

    // ---- Formu Kapat ----
    window.cancelProjectForm = function () {
        document.getElementById('project-form-container').style.display = 'none';
    };

    // ---- Proje Düzenle ----
    window.editProject = function (id) {
        const p = allProjects.find(x => String(x.id) === String(id));
        if (!p) return;

        document.getElementById('project-form-container').style.display = 'block';
        document.getElementById('project-form-title').textContent = 'Projeyi Düzenle';
        document.getElementById('project-edit-id').value = p.id;
        document.getElementById('project-baslik').value = p.baslik || '';
        document.getElementById('project-aciklama').value = p.aciklama || '';
        document.getElementById('project-ikon').value = p.ikon || 'fa-solid fa-code';
        document.getElementById('project-renk').value = p.renk || '#38bdf8';
        document.getElementById('project-etiketler').value = p.etiketler || '';
        document.getElementById('project-github').value = p.github_link || '';
        document.getElementById('project-demo').value = p.demo_link || '';
    };

    // ---- Proje Kaydet (Ekle / Güncelle) ----
    window.saveProject = async function () {
        if (!ready()) return;

        const id = document.getElementById('project-edit-id').value;
        const baslik = document.getElementById('project-baslik').value.trim();
        const aciklama = document.getElementById('project-aciklama').value.trim();
        const ikon = document.getElementById('project-ikon').value.trim();
        const renk = document.getElementById('project-renk').value;
        const etiketler = document.getElementById('project-etiketler').value.trim();
        const github_link = document.getElementById('project-github').value.trim();
        const demo_link = document.getElementById('project-demo').value.trim();

        if (!baslik) {
            window.showToast?.('Proje adı boş olamaz!', 'error');
            return;
        }

        const payload = { baslik, aciklama, ikon, renk, etiketler, github_link, demo_link };

        try {
            let data;
            if (id) {
                payload.id = id;
                data = await C().fetchAPI('update_project', payload);
            } else {
                data = await C().fetchAPI('add_project', payload);
            }

            window.showToast?.(id ? '✅ Proje güncellendi!' : '✅ Proje eklendi!', 'success');
            cancelProjectForm();
            loadProjects();
        } catch (err) {
            window.showToast?.('Hata: ' + err.message, 'error');
        }
    };

    // ---- Proje Sil ----
    window.deleteProject = async function (id) {
        if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
        if (!ready()) return;

        try {
            await C().fetchAPI('delete_row', { type: 'Projects', id: id });
            window.showToast?.('🗑️ Proje silindi.', 'success');
            loadProjects();
        } catch (err) {
            window.showToast?.('Hata: ' + err.message, 'error');
        }
    };

    // ---- Sayfa yüklenince projeleri çek ----
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadProjects, 1000);
    });
})();
