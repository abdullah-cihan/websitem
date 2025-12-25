/* ADMIN PAGES MANAGER */
const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('pages-table-body')) fetchPages();
});

window.savePage = async () => {
    const btn = document.getElementById('btn-save-page');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
    btn.disabled = true;
    
    const pageData = {
        action: "add_page",
        baslik: document.getElementById("page-title").value,
        icerik: document.getElementById("page-content").value
    };

    if(!pageData.baslik || !pageData.icerik) { 
        alert("Başlık ve içerik eksik."); 
        btn.innerText = originalText; 
        btn.disabled = false;
        return; 
    }

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(pageData)
        });

        alert("✅ Sayfa oluşturuldu!");
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
        if(typeof showSection === 'function') showSection('pages-manager');
        setTimeout(fetchPages, 2000);
    } catch(e) {
        alert("Hata: " + e);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

async function fetchPages() {
    const tbody = document.getElementById('pages-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}?type=pages`);
        const data = await res.json();
        const pages = data.pages || [];
        
        tbody.innerHTML = '';
        if(pages.length === 0) { tbody.innerHTML = '<tr><td colspan="4">Kayıt yok.</td></tr>'; return; }

        pages.reverse().forEach(p => {
            const link = p.link.includes('http') || p.link.includes('.html') ? p.link : `tool-view.html?id=${p.id}`;
            const dateStr = p.tarih ? new Date(p.tarih).toLocaleDateString('tr-TR') : '-';
            tbody.innerHTML += `
                <tr>
                    <td>${p.baslik}</td>
                    <td>${dateStr}</td>
                    <td><a href="${link}" target="_blank">Görüntüle</a></td>
                    <td><button onclick="deletePage('${p.id}', this)" class="action-btn"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
        });
    } catch(e) { console.error(e); }
}

window.deletePage = async (id, btn) => {
    if(!confirm("Silinsin mi?")) return;
    if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete_row", type: "pages", id: id })
    });
    
    alert("Silindi.");
    setTimeout(fetchPages, 2000);
};

window.openNewPageEditor = () => {
    if(typeof showSection === 'function') {
        showSection('page-editor');
        document.getElementById('page-form-title').innerText = "Yeni Sayfa Oluştur";
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
    }
};
