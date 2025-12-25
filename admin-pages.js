/* ============================================================
   ADMIN PAGES MANAGER - SAYFA YÖNETİMİ (V-FINAL)
   ============================================================ */

(function () {
    const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec";

    document.addEventListener('DOMContentLoaded', () => {
        if(document.getElementById('pages-table-body')) {
            fetchPages();
        }
    });

    // --- SAYFA KAYDETME ---
    window.savePage = async () => {
        const btn = document.querySelector('#page-editor .btn-submit');
        const originalText = btn ? btn.innerText : "Kaydet";
        
        if(btn) {
            btn.innerText = "Kaydediliyor...";
            btn.disabled = true;
        }

        try {
            const title = document.getElementById("page-title").value.trim();
            const content = document.getElementById("page-content").value;

            if (!title || !content) {
                alert("Lütfen başlık ve kod alanını doldurunuz.");
                return;
            }

            const pageData = {
                action: "add_page",
                baslik: title,
                icerik: content
            };

            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageData)
            });

            alert("✅ Sayfa başarıyla oluşturuldu!\nListeden linki alabilirsiniz.");
            
            document.getElementById("page-title").value = "";
            document.getElementById("page-content").value = "";
            
            if(typeof showSection === 'function') showSection('pages-manager');
            setTimeout(fetchPages, 1000);

        } catch (error) {
            console.error("Page Save Error:", error);
            alert("Hata: " + error.message);
        } finally {
            if(btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    };

    // --- LİSTELEME ---
    async function fetchPages() {
        const tbody = document.getElementById('pages-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Yükleniyor...</td></tr>';

        try {
            const res = await fetch(`${API_URL}?type=pages`);
            const data = await res.json();
            const pages = data.pages || [];

            tbody.innerHTML = '';
            if (pages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Henüz sayfa yok.</td></tr>';
                return;
            }

            pages.reverse().forEach(page => {
                const tr = document.createElement('tr');
                const pageLink = page.link.startsWith('http') ? page.link : `page-view.html?id=${page.id}`;

                tr.innerHTML = `
                    <td style="color:white; font-weight:500;">
                        <i class="fa-regular fa-file-code" style="margin-right:8px; color:#64748b;"></i>
                        ${page.baslik}
                    </td>
                    <td>
                        <a href="${pageLink}" target="_blank" style="color:#3b82f6;">
                            Linke Git <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </td>
                    <td><button class="action-btn"><i class="fa-solid fa-trash"></i></button></td>
                `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error("Fetch Error:", err);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Veri çekilemedi.</td></tr>';
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
})();
