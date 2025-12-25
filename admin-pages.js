/* ============================================================
   ADMIN PAGES MANAGER - SAYFA YÖNETİMİ (V-FINAL CORRECTIONS)
   ============================================================ */

// ✅ YENİ LİNK
const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('pages-table-body')) fetchPages();
});

// --- SAYFA KAYDETME (DÜZELTİLDİ) ---
window.savePage = async () => {
    const btn = document.getElementById('btn-save-page');
    const originalText = btn ? btn.innerText : "Kaydet";
    if(btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...'; btn.disabled = true; }

    try {
        const title = document.getElementById("page-title").value.trim();
        const content = document.getElementById("page-content").value;

        if (!title || !content) {
            alert("Lütfen başlık ve kod alanını doldurunuz.");
            if(btn) { btn.innerText = originalText; btn.disabled = false; }
            return;
        }

        const pageData = { action: "add_page", baslik: title, icerik: content };

        // ⚠️ DÜZELTME: text/plain
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(pageData)
        });

        alert("✅ Sayfa Google Sheets'e gönderildi!");
        
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
        if(typeof showSection === 'function') showSection('pages-manager');
        setTimeout(fetchPages, 2000);

    } catch (error) {
        console.error("Page Save Error:", error);
        alert("Hata: " + error.message);
    } finally {
        if(btn) { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet'; btn.disabled = false; }
    }
};

window.deletePage = async (id, btnElement) => {
    if(!confirm("Bu sayfayı silmek istediğinize emin misiniz?")) return;
    const icon = btnElement.querySelector('i');
    const oldClass = icon.className;
    icon.className = "fa-solid fa-spinner fa-spin";
    btnElement.disabled = true;

    const formData = { action: "delete_row", type: "pages", id: id };

    try {
        // ⚠️ DÜZELTME
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(formData)
        });

        alert("Silme isteği gönderildi.");
        setTimeout(fetchPages, 2000);

    } catch (error) {
        console.error("Delete Error:", error);
        alert("Silinemedi: " + error);
        icon.className = oldClass;
        btnElement.disabled = false;
    }
};

async function fetchPages() {
    const tbody = document.getElementById('pages-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const res = await fetch(`${API_URL}?type=pages`);
        const data = await res.json();
        const pages = data.pages || [];

        tbody.innerHTML = '';
        if (pages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Henüz sayfa oluşturulmadı.</td></tr>';
            return;
        }

        pages.reverse().forEach(page => {
            const tr = document.createElement('tr');
            const pageLink = page.link && page.link.startsWith('http') ? page.link : `tool-view.html?id=${page.id}`;
            const dateStr = page.tarih ? new Date(page.tarih).toLocaleDateString('tr-TR') : '-';

            tr.innerHTML = `
                <td style="color:white; font-weight:500;">
                    <i class="fa-regular fa-file-code" style="margin-right:8px; color:#64748b;"></i>
                    ${page.baslik}
                </td>
                <td>${dateStr}</td>
                <td><a href="${pageLink}" target="_blank" style="color:#3b82f6; text-decoration:none;">Görüntüle <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
                <td><button class="action-btn delete-btn" onclick="deletePage('${page.id}', this)"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Fetch Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
    }
}
window.openNewPageEditor = () => {
    if(typeof showSection === 'function') {
        showSection('page-editor');
        document.getElementById('page-form-title').innerText = "Yeni Sayfa Oluştur";
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
    }
};
