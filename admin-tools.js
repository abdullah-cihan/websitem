/* ============================================================
   ADMIN TOOLS MANAGER - ARAÇ YÖNETİMİ (V-FINAL CORRECTIONS)
   ============================================================ */

// ✅ YENİ LİNK
const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

let isEditMode = false;
let currentEditingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tools-table-body')) fetchTools();
});

// --- ARAÇ EKLE/GÜNCELLE (DÜZELTİLDİ) ---
async function handleToolSubmit() {
    const btn = document.querySelector('#tools-manager .btn-submit');
    const title = document.getElementById("tool-title").value.trim();
    const icon = document.getElementById("tool-icon").value.trim();
    const link = document.getElementById("tool-link").value.trim();

    if (!title || !link) { alert("Başlık ve Link alanları zorunludur."); return; }

    const originalText = btn ? btn.innerText : "Ekle";
    if(btn) { btn.innerText = "İşleniyor..."; btn.disabled = true; }

    const toolData = {
        action: isEditMode ? "update_tool" : "add_tool",
        index: currentEditingIndex,
        baslik: title,
        ikon: icon || "fa-solid fa-toolbox",
        link: link
    };

    try {
        // ⚠️ DÜZELTME: text/plain
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(toolData)
        });

        alert(isEditMode ? "✅ Güncelleme gönderildi!" : "✅ Ekleme gönderildi!");
        resetToolForm();
        document.getElementById('tools-table-body').innerHTML = '<tr><td colspan="4" style="text-align:center;">Liste yenileniyor...</td></tr>';
        setTimeout(fetchTools, 2000);

    } catch (error) {
        console.error(error);
        alert("Hata: " + error);
    } finally {
        if(btn) { btn.innerText = isEditMode ? "Güncelle" : "Ekle"; btn.disabled = false; }
    }
}
window.addTool = handleToolSubmit;

// --- ARAÇ SİLME (DÜZELTİLDİ) ---
window.deleteTool = async (index, event) => {
    if(event) event.stopPropagation();
    if(!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;

    const btn = event.target.closest('button');
    if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const formData = { action: "delete_row", type: "tools", id: index };

    try {
        // ⚠️ DÜZELTME
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(formData)
        });

        alert("Silme işlemi gönderildi.");
        setTimeout(fetchTools, 2000);

    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Silinemedi: " + error);
        if(btn) btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    }
};

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
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Henüz araç yok.</td></tr>';
            return;
        }

        tools.forEach((tool, index) => {
            const tr = document.createElement('tr');
            tr.onclick = (e) => {
                if(!e.target.closest('.delete-btn')) editTool(index, tool.baslik, tool.ikon, tool.link);
            };
            tr.style.cursor = "pointer";
            tr.innerHTML = `
                <td style="text-align:center;"><i class="${tool.ikon}"></i></td>
                <td style="color:white;">${tool.baslik}</td>
                <td style="font-size:0.8rem; color:#94a3b8;">${tool.link}</td>
                <td style="text-align:center;">
                    <button class="action-btn delete-btn" onclick="deleteTool(${index}, event)"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>';
    }
}

function editTool(index, title, icon, link) {
    isEditMode = true;
    currentEditingIndex = index;
    document.getElementById("tool-title").value = title;
    document.getElementById("tool-icon").value = icon;
    document.getElementById("tool-link").value = link;
    const btn = document.querySelector('#tools-manager .btn-submit');
    if(btn) btn.innerText = "Güncelle";
}

function resetToolForm() {
    isEditMode = false;
    currentEditingIndex = null;
    document.getElementById("tool-title").value = "";
    document.getElementById("tool-icon").value = "";
    document.getElementById("tool-link").value = "";
    const btn = document.querySelector('#tools-manager .btn-submit');
    if(btn) btn.innerText = "Ekle";
}
