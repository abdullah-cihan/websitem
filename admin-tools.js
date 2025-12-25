/* ============================================================
   ADMIN TOOLS MANAGER - ARAÇ YÖNETİMİ (GÜNCELLENMİŞ)
   ============================================================ */

const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

let isEditMode = false;
let currentEditingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tools-table-body')) {
        fetchTools();
    }
});

// ==========================================
// 1. ARAÇ EKLEME VEYA GÜNCELLEME
// ==========================================
async function handleToolSubmit() {
    const btn = document.querySelector('#tools-manager .btn-submit');
    const originalText = btn.innerText;
    
    const title = document.getElementById("tool-title").value.trim();
    const icon = document.getElementById("tool-icon").value.trim();
    const link = document.getElementById("tool-link").value.trim();

    if (!title || !link) {
        alert("Başlık ve Link alanları zorunludur.");
        return;
    }

    btn.innerText = "İşleniyor...";
    btn.disabled = true;

    const toolData = {
        action: isEditMode ? "update_tool" : "add_tool",
        index: currentEditingIndex, // Güncelleme için satır numarası
        baslik: title,
        ikon: icon || "fa-solid fa-toolbox",
        link: link
    };

    try {
        // Not: update_tool fonksiyonu Kod.gs tarafında yoksa eklenmelidir.
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolData)
        });

        alert(isEditMode ? "✅ Araç güncellendi!" : "✅ Araç başarıyla eklendi!");
        resetToolForm();
        
        // Listeyi yenile
        setTimeout(fetchTools, 1500);

    } catch (error) {
        console.error(error);
        alert("Hata: " + error);
    } finally {
        btn.innerText = "Ekle";
        btn.disabled = false;
    }
}

// ==========================================
// 2. DÜZENLEME MODUNU AÇMA
// ==========================================
function editTool(index, title, icon, link) {
    isEditMode = true;
    currentEditingIndex = index;

    // Formu doldur
    document.getElementById("tool-title").value = title;
    document.getElementById("tool-icon").value = icon;
    document.getElementById("tool-link").value = link;

    // Butonu güncelle
    const btn = document.querySelector('#tools-manager .btn-submit');
    btn.innerText = "Güncelle";
    btn.classList.add("edit-mode-btn"); // CSS ile renk değiştirebilirsin
    
    // Sayfayı yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Formu Sıfırla
function resetToolForm() {
    isEditMode = false;
    currentEditingIndex = null;
    document.getElementById("tool-title").value = "";
    document.getElementById("tool-icon").value = "";
    document.getElementById("tool-link").value = "";
    document.querySelector('#tools-manager .btn-submit').innerText = "Ekle";
}

// ==========================================
// 3. ARAÇLARI LİSTELEME
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

        tools.forEach((tool, index) => {
            const tr = document.createElement('tr');
            tr.style.cursor = "pointer"; // Tıklanabilir hissi
            tr.title = "Düzenlemek için tıkla";
            
            // Satıra tıklandığında düzenleme modunu aç (Silme butonuna tıklanmadığı sürece)
            tr.onclick = (e) => {
                if(!e.target.closest('.action-btn')) {
                    editTool(index + 1, tool.baslik, tool.ikon, tool.link);
                }
            };

            tr.innerHTML = `
                <td style="text-align:center;"><i class="${tool.ikon}"></i></td>
                <td style="color:white; font-weight:500;">${tool.baslik}</td>
                <td style="font-size:0.8rem; color:#94a3b8;">${tool.link}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="alert('Google Sheet üzerinden siliniz.')">
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
