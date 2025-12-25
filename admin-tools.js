/* ============================================================
   ADMIN TOOLS MANAGER - ARAÇ YÖNETİMİ (V-FINAL)
   ============================================================ */

const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec";

let isEditMode = false;
let currentEditingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tools-table-body')) {
        fetchTools();
    }
});

// --- ARAÇ KAYDET / GÜNCELLE ---
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
        index: currentEditingIndex,
        baslik: title,
        ikon: icon || "fa-solid fa-toolbox",
        link: link
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolData)
        });

        alert(isEditMode ? "✅ Araç güncellendi!" : "✅ Araç eklendi!");
        resetToolForm();
        setTimeout(fetchTools, 1500);

    } catch (error) {
        console.error(error);
        alert("Hata: " + error);
    } finally {
        btn.innerText = "Ekle / Güncelle";
        btn.disabled = false;
    }
}

// --- DÜZENLEME MODU ---
function editTool(index, title, icon, link) {
    isEditMode = true;
    currentEditingIndex = index;
    document.getElementById("tool-title").value = title;
    document.getElementById("tool-icon").value = icon;
    document.getElementById("tool-link").value = link;
    document.querySelector('#tools-manager .btn-submit').innerText = "Güncelle";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetToolForm() {
    isEditMode = false;
    currentEditingIndex = null;
    document.getElementById("tool-title").value = "";
    document.getElementById("tool-icon").value = "";
    document.getElementById("tool-link").value = "";
    document.querySelector('#tools-manager .btn-submit').innerText = "Ekle";
}

// --- LİSTELEME ---
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
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Henüz araç yok.</td></tr>';
            return;
        }

        tools.forEach((tool, index) => {
            const tr = document.createElement('tr');
            tr.onclick = (e) => {
                if(!e.target.closest('.action-btn')) editTool(index, tool.baslik, tool.ikon, tool.link);
            };
            tr.style.cursor = "pointer";

            tr.innerHTML = `
                <td style="text-align:center;"><i class="${tool.ikon}"></i></td>
                <td style="color:white;">${tool.baslik}</td>
                <td style="font-size:0.8rem; color:#94a3b8;">${tool.link}</td>
                <td><button class="action-btn"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Veri çekilemedi.</td></tr>';
    }
}
