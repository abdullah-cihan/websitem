/* ============================================================
   ADMIN PAGES MANAGER - SAYFA YÖNETİMİ (V-FINAL)
   ============================================================ */

// ✅ GÜNCEL API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('pages-table-body')) {
        fetchPages();
    }
});

// --- 1. SAYFA KAYDETME (ADD PAGE) ---
window.savePage = async () => {
    const btn = document.getElementById('btn-save-page');
    const originalText = btn ? btn.innerText : "Kaydet";
    
    // UI Feedback
    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
        btn.disabled = true;
    }

    try {
        const title = document.getElementById("page-title").value.trim();
        const content = document.getElementById("page-content").value;

        if (!title || !content) {
            alert("Lütfen başlık ve kod alanını doldurunuz.");
            // UI Reset
            if(btn) { btn.innerText = originalText; btn.disabled = false; }
            return;
        }

        const pageData = {
            action: "add_page",
            baslik: title,
            icerik: content
        };

        // API İsteği
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData)
        });

        alert("✅ Sayfa başarıyla oluşturuldu!\nListeden linki alabilirsiniz.");
        
        // Formu temizle
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
        
        // Yönetim ekranına geri dön
        if(typeof showSection === 'function') showSection('pages-manager');
        
        // Listeyi yenile
        setTimeout(fetchPages, 1500);

    } catch (error) {
        console.error("Page Save Error:", error);
        alert("Hata: " + error.message);
    } finally {
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
            btn.disabled = false;
        }
    }
};

// --- 2. SAYFALARI LİSTELEME ---
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

        // Yeni sayfalar en üstte görünsün
        pages.reverse().forEach(page => {
            const tr = document.createElement('tr');
            
            // Link oluşturma (Apps Script linki veriyorsa onu kullan, yoksa id'den oluştur)
            const pageLink = page.link && page.link.startsWith('http') 
                ? page.link 
                : `tool-view.html?id=${page.id}`; // tool-view.html olarak güncelledik

            // Tarih formatı
            const dateStr = page.tarih ? new Date(page.tarih).toLocaleDateString('tr-TR') : '-';

            tr.innerHTML = `
                <td style="color:white; font-weight:500;">
                    <i class="fa-regular fa-file-code" style="margin-right:8px; color:#64748b;"></i>
                    ${page.baslik}
                </td>
                <td>${dateStr}</td>
                <td>
                    <a href="${pageLink}" target="_blank" style="color:#3b82f6; text-decoration:none;">
                        Görüntüle <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </td>
                <td>
                    <button class="action-btn delete-btn" onclick="deletePage('${page.id}', this)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Fetch Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
    }
}

// --- 3. SAYFA SİLME ---
window.deletePage = async (id, btnElement) => {
    if(!confirm("Bu sayfayı silmek istediğinize emin misiniz?")) return;

    // UI Feedback
    const icon = btnElement.querySelector('i');
    const oldClass = icon.className;
    icon.className = "fa-solid fa-spinner fa-spin";
    btnElement.disabled = true;

    const formData = {
        action: "delete_row",
        type: "pages",
        id: id
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        alert("Sayfa silindi.");
        setTimeout(fetchPages, 1500);

    } catch (error) {
        console.error("Delete Error:", error);
        alert("Silinemedi: " + error);
        // İkonu geri getir
        icon.className = oldClass;
        btnElement.disabled = false;
    }
};

// --- 4. YARDIMCI: EDİTÖRÜ TEMİZLEME ---
window.openNewPageEditor = () => {
    if(typeof showSection === 'function') {
        showSection('page-editor');
        document.getElementById('page-form-title').innerText = "Yeni Sayfa Oluştur";
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
    }
};
