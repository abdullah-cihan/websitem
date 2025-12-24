

/* ============================================================
   ADMIN TOOLS MANAGER - ARAÇ YÖNETİMİ
   ============================================================ */

// 👇👇 BURAYA YENİ ALDIĞINIZ GÜNCEL LİNKİ YAPIŞTIRIN 👇👇
const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";
document.addEventListener('DOMContentLoaded', () => {
    // Eğer araçlar tablosu varsa verileri çek
    if(document.getElementById('tools-table-body')) {
        fetchTools();
    }
});

// ==========================================
// 1. ARAÇ EKLEME
// ==========================================
async function addTool() {
    const btn = document.querySelector('#tools-manager .btn-submit');
    const originalText = btn.innerText;
    
    btn.innerText = "Ekleniyor...";
    btn.disabled = true;

    try {
        const title = document.getElementById("tool-title").value;
        const icon = document.getElementById("tool-icon").value;
        const link = document.getElementById("tool-link").value;

        if (!title || !link) {
            alert("Başlık ve Link alanları zorunludur.");
            return;
        }

        const toolData = {
            action: "add_tool",
            baslik: title,
            ikon: icon || "fa-solid fa-toolbox",
            link: link
        };

        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolData)
        });

        alert("✅ Araç başarıyla eklendi!");
        
        // Formu temizle
        document.getElementById("tool-title").value = "";
        document.getElementById("tool-link").value = "";
        document.getElementById("tool-icon").value = "";
        
        // Listeyi yenile
        setTimeout(fetchTools, 1000);

    } catch (error) {
        console.error(error);
        alert("Hata: " + error);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// 2. ARAÇLARI LİSTELEME
// ==========================================
async function fetchTools() {
    const tbody = document.getElementById('tools-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const res = await fetch(`${API_URL}?type=tools`);
        const data = await res.json();
        const tools = data.tools || [];

        tbody.innerHTML = '';
        if (tools.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">Henüz araç eklenmedi.</td></tr>';
            return;
        }

        tools.forEach(tool => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;"><i class="${tool.ikon}"></i></td>
                <td style="color:white;">${tool.baslik}</td>
                <td style="font-size:0.8rem; color:#94a3b8; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${tool.link}</td>
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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
    }
}

