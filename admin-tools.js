/* ADMIN TOOLS MANAGER */
let isEditMode = false;
let currentEditingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tools-table-body')) fetchTools();
});

window.addTool = async () => { // handleToolSubmit
    const btn = document.querySelector('#tools-manager .btn-submit');
    const baslik = document.getElementById("tool-title").value;
    const ikon = document.getElementById("tool-icon").value;
    const link = document.getElementById("tool-link").value;

    if(!baslik || !link) { alert("Başlık ve link zorunlu"); return; }
    
    const originalText = btn.innerText;
    btn.innerText = "İşleniyor...";
    btn.disabled = true;

    const toolData = {
        action: isEditMode ? "update_tool" : "add_tool",
        index: currentEditingIndex,
        baslik: baslik,
        ikon: ikon || "fa-solid fa-toolbox",
        link: link
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(toolData)
        });

        alert(isEditMode ? "✅ Güncellendi!" : "✅ Eklendi!");
        resetToolForm();
        setTimeout(fetchTools, 2000);
    } catch(e) {
        alert("Hata: " + e);
    } finally {
        btn.innerText = isEditMode ? "Güncelle" : "Ekle";
        btn.disabled = false;
    }
};

async function fetchTools() {
    const tbody = document.getElementById('tools-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Yükleniyor...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}?type=tools`);
        const data = await res.json();
        const tools = data.tools || [];
        
        tbody.innerHTML = '';
        if(tools.length === 0) { tbody.innerHTML = '<tr><td colspan="4">Araç yok.</td></tr>'; return; }

        tools.forEach((t, i) => {
            tbody.innerHTML += `
                <tr>
                    <td style="text-align:center"><i class="${t.ikon}"></i></td>
                    <td>${t.baslik}</td>
                    <td style="font-size:0.8rem">${t.link}</td>
                    <td style="text-align:center">
                        <button onclick="editTool(${i}, '${t.baslik}', '${t.ikon}', '${t.link}')" class="action-btn" style="color:#3b82f6"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTool(${i}, this)" class="action-btn"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } catch(e) { console.error(e); }
}

window.deleteTool = async (index, btn) => {
    if(!confirm("Silinsin mi?")) return;
    if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete_row", type: "tools", id: index })
    });
    
    alert("Silindi.");
    setTimeout(fetchTools, 2000);
};

window.editTool = (index, title, icon, link) => {
    isEditMode = true;
    currentEditingIndex = index;
    document.getElementById("tool-title").value = title;
    document.getElementById("tool-icon").value = icon;
    document.getElementById("tool-link").value = link;
    document.querySelector('#tools-manager .btn-submit').innerText = "Güncelle";
};

function resetToolForm() {
    isEditMode = false;
    currentEditingIndex = null;
    document.getElementById("tool-title").value = "";
    document.getElementById("tool-icon").value = "";
    document.getElementById("tool-link").value = "";
    document.querySelector('#tools-manager .btn-submit').innerText = "Ekle";
}

