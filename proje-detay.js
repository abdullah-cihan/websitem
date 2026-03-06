// ==========================================
// DARK / LIGHT MODE TOGGLE (Sayfa yüklenmeden önce, FOUC önleme)
// ==========================================
(function () {
    const saved = localStorage.getItem('siteTheme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const icon = themeToggleBtn.querySelector('i');
        if (currentTheme === 'light' && icon) {
            icon.className = 'fa-solid fa-sun';
        }

        themeToggleBtn.addEventListener('click', () => {
            const icon = themeToggleBtn.querySelector('i');
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';

            if (isLight) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('siteTheme', 'dark');
                if (icon) icon.className = 'fa-solid fa-moon';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('siteTheme', 'light');
                if (icon) icon.className = 'fa-solid fa-sun';
            }
        });
    }

    // ============================
    // Helpers (XSS azaltma)
    // ============================
    function escapeHTML(str) {
        return String(str ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // ==========================================
    // SHARE (X / LinkedIn / WhatsApp / Kopyala)
    // ==========================================
    const pageUrl = encodeURIComponent(window.location.href);
    let pageTitle = "Proje İncele | Abdullah Cihan";

    const setupShareButtons = (customTitle) => {
        pageTitle = encodeURIComponent(customTitle || 'Proje İncele');

        const xBtn = document.getElementById('share-x');
        const liBtn = document.getElementById('share-linkedin');
        const waBtn = document.getElementById('share-whatsapp');

        if (xBtn) xBtn.href = `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`;
        if (liBtn) liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
        if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${pageTitle}%20-%20${pageUrl}`;
    };

    const copyBtn = document.getElementById('share-copy');
    const toast = document.getElementById('share-toast');
    const showShareToast = (msg) => {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(window.__share_toast_t);
        window.__share_toast_t = setTimeout(() => toast.classList.remove('show'), 1600);
    };

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const unencodedUrl = decodeURIComponent(pageUrl);
            navigator.clipboard.writeText(unencodedUrl).then(() => {
                showShareToast('Link kopyalandı!');
            }).catch(err => {
                console.error('Kopyalama Hatası:', err);
                showShareToast('Kopyalanamadı!');
            });
        });
    }

    // ==========================================
    // URL'DEN "id" OKUMA VE PROJEYİ BULMA
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const projectIdStr = urlParams.get('id');

    if (!projectIdStr) {
        document.getElementById('detail-title').textContent = "Proje Bulunamadı!";
        document.getElementById('detail-content').innerHTML = "<p>Gösterilecek proje ID'si eksik.</p>";
        document.getElementById('detail-icon').className = "fa-solid fa-triangle-exclamation";
        return;
    }

    const renderProjectDetails = (project) => {
        document.title = `${project.baslik} | Abdullah Cihan`;

        // Header Data
        document.getElementById('detail-title').textContent = escapeHTML(project.baslik);
        document.getElementById('detail-date').innerHTML = `<i class="fa-regular fa-calendar" style="color:var(--primary);"></i> ${escapeHTML(project.tarih) || 'Belirtilmedi'}`;

        // Tag Data (Badges)
        const tagContainer = document.getElementById('detail-tags');
        if (project.etiketler) {
            const tags = String(project.etiketler).split(',').filter(Boolean);
            tagContainer.innerHTML = tags.map(t => `<span class="badge" style="margin-bottom:0;"><i class="fa-solid fa-code"></i> ${escapeHTML(t.trim())}</span>`).join('');
        }

        // Cover Icon & Description
        const iconEl = document.getElementById('detail-icon');
        iconEl.className = escapeHTML(project.ikon || 'fa-solid fa-code');
        iconEl.style.color = escapeHTML(project.renk || 'var(--primary)');
        document.getElementById('project-header').style.background = `linear-gradient(135deg, rgba(7, 11, 25, 1) 40%, ${escapeHTML(project.renk || 'var(--primary)')}33 100%)`;

        document.getElementById('detail-content').innerHTML = `<p>${escapeHTML(project.aciklama || 'Bu proje için bir açıklama girilmemiş.')}</p>`;

        // Action Links
        const linksContainer = document.getElementById('project-action-links');
        let linksHtml = '';
        if (project.demo_link) linksHtml += `<a href="${escapeHTML(project.demo_link)}" class="btn-read-modern" target="_blank" style="padding: 12px 25px; font-size: 1.1rem; text-decoration: none; border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-main);">Canlı Demo <i class="fa-solid fa-arrow-right"></i></a>`;
        if (project.github_link) linksHtml += `<a href="${escapeHTML(project.github_link)}" class="btn-read-modern" target="_blank" style="padding: 12px 25px; font-size: 1.1rem; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: var(--text-main);"><i class="fa-brands fa-github"></i> Kaynak Kodu</a>`;
        linksContainer.innerHTML = linksHtml;

        // Update Share Buttons with specific project title
        setupShareButtons(project.baslik);
    };

    const renderSidebar = (allProjects) => {
        const sidebarContainer = document.getElementById('sidebar-projects-list');
        const filtered = allProjects.filter(p => String(p.id) !== String(projectIdStr)).slice(0, 5); // Exclude current and limit

        if (filtered.length === 0) {
            sidebarContainer.innerHTML = '<li><span style="color:var(--text-muted)">Başka proje yok.</span></li>';
            return;
        }

        sidebarContainer.innerHTML = filtered.map(p => `
        <li style="margin-bottom: 10px;">
            <a href="proje-detay.html?id=${escapeHTML(p.id)}" style="display: flex; align-items: center; gap: 10px;">
                <i class="${escapeHTML(p.ikon || 'fa-solid fa-code')}" style="color:${escapeHTML(p.renk || 'var(--primary)')}"></i>
                ${escapeHTML(p.baslik)}
            </a>
        </li>
      `).join('');
    };

    // ==========================================
    // FETCH VE GÖSTER (Projeler API'si)
    // ==========================================
    const fetchProjects = async () => {
        try {
            const apiUrl = localStorage.getItem("SYSTEM_API_URL") || "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
            const res = await fetch(`${apiUrl}?type=projects`);
            const data = await res.json();

            if (data.ok && data.projects && data.projects.length > 0) {
                renderSidebar(data.projects);

                // Find the specific project
                const project = data.projects.find(p => String(p.id) === String(projectIdStr));
                if (project) {
                    renderProjectDetails(project);
                } else {
                    document.getElementById('detail-title').textContent = "Proje Bulunamadı!";
                    document.getElementById('detail-content').innerHTML = "<p>Aradığınız proje sistemde mevcut değil.</p>";
                    document.getElementById('detail-icon').className = "fa-solid fa-triangle-exclamation";
                }
            } else {
                throw new Error("Boş veri döndü.");
            }
        } catch (err) {
            console.warn("Projeler çekilemedi:", err);
            document.getElementById('detail-title').textContent = "Bağlantı Hatası!";
            document.getElementById('detail-content').innerHTML = "<p>Projeler yüklenirken bir sorun oluştu.</p>";
            document.getElementById('detail-icon').className = "fa-solid fa-triangle-exclamation";
        }
    };

    fetchProjects();

});
