// ==========================================
// ADMIN PANELİ - SAYFA YÖNETİMİ
// ==========================================

// 👇👇 BURAYA YENİ ALDIĞINIZ LİNKİ YAPIŞTIRIN 👇👇
const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec"; 

// AdminCore kütüphanesine erişim
function core() {
    return window.AdminCore || { 
        readArrayLS: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
        writeLS: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('pages-table-body')) {
        fetchPages();
    }
});

// --- SAYFA KAYDETME ---
async function savePage() {
    const btn = document.querySelector('#page-editor .btn-submit');
    const originalText = btn.innerText;
    
    btn.innerText = "Kaydediliyor...";
    btn.disabled = true;

    try {
        const title = document.getElementById("page-title").value;
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

        alert("✅ Sayfa başarıyla oluşturuldu!");
        document.getElementById("page-title").value = "";
        document.getElementById("page-content").value = "";
        
        showSection('pages-manager');
        setTimeout(fetchPages, 1000);

    } catch (error) {
        console.error(error);
        alert("Hata oluştu: " + error);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- SAYFALARI LİSTELEME ---
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
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Henüz sayfa yok.</td></tr>';
            return;
        }

        pages.reverse().forEach(page => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:white; font-weight:500;">${page.baslik}</td>
                <td><a href="${page.link}" target="_blank" style="color:#3b82f6; text-decoration:none;">Görüntüle <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
                <td>
                    <button class="action-btn" onclick="alert('Google Sheet üzerinden siliniz.')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Veri çekilemedi.</td></tr>';
    }
}

// --- YARDIMCI FONKSİYONLAR ---
function openNewPageEditor() {
    showSection('page-editor');
    document.getElementById('page-form-title').innerText = "Yeni Sayfa Oluştur";
}
