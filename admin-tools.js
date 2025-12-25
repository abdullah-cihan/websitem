/* ============================================================
   ADMIN TOOLS MANAGER - ARAÇ YÖNETİMİ (V-FINAL)
   ============================================================ */

// ✅ GÜNCEL API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

let isEditMode = false;
let currentEditingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    // Eğer araçlar tablosu varsa verileri çek
    if(document.getElementById('tools-table-body')) {
        fetchTools();
    }
});

// --- 1. ARAÇ KAYDET / GÜNCELLE ---
async function handleToolSubmit() {
    const btn = document.querySelector('#tools-manager .btn-submit');
    
    // Inputları al
    const title = document.getElementById("tool-title").value.trim();
    const icon = document.getElementById("tool-icon").value.trim();
    const link = document.getElementById("tool-link").value.trim();

    // Basit doğrulama
    if (!title || !link) {
        alert("Başlık ve Link alanları zorunludur.");
        return;
    }

    // Butonu kilitle
    const originalText = btn ? btn.innerText : "Ekle";
    if(btn) {
        btn.innerText = "İşleniyor...";
        btn.disabled = true;
    }

    // Gönderilecek Veri
    const toolData = {
        action: isEditMode ? "update_tool" : "add_tool",
        index: currentEditingIndex, // Güncelleme için gerekli
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

        // no-cors modunda yanıt içeriğini okuyamayız ama hata fırlatmazsa başarılı sayarız
        alert(isEditMode ? "✅ Araç güncellendi!" : "✅ Araç eklendi!");
        
        resetToolForm();
        
        // Listeyi yenile (biraz bekle ki Google Sheet güncellensin)
        document.getElementById('tools-table-body').innerHTML = '<tr><td colspan="4" style="text-align:center;">Liste yenileniyor...</td></tr>';
        setTimeout(fetchTools, 1500);

    } catch (error) {
        console.error(error);
        alert("Hata oluştu: " + error);
    } finally {
        if(btn) {
            btn.innerText = isEditMode ? "Güncelle" : "Ekle";
            btn.disabled = false;
        }
    }
}

// --- 2. ARAÇ EKLEME FONKSİYONU (HTML'den çağrılan) ---
// Admin.html içindeki button onclick="addTool()" buraya yönlendirilmeli
// Eğer html'de onclick="handleToolSubmit()" yazmıyorsa, bu köprüyü kuralım:
window.addTool = handleToolSubmit;


// --- 3. LİSTELEME ---
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
            
            // Satıra tıklayınca düzenleme modunu aç
            tr.onclick = (e) => {
                // Eğer silme butonuna tıklandıysa düzenlemeyi açma
                if(!e.target.closest('.delete-btn')) {
                    editTool(index, tool.baslik, tool.ikon, tool.link);
                }
            };
            tr.style.cursor = "pointer";
            tr.title = "Düzenlemek için tıklayın";

            tr.innerHTML = `
                <td style="text-align:center;"><i class="${tool.ikon}"></i></td>
                <td style="color:white;">${tool.baslik}</td>
                <td style="font-size:0.8rem; color:#94a3b8;">${tool.link}</td>
                <td style="text-align:center;">
                    <button class="action-btn delete-btn" onclick="deleteTool(${index}, event)">
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

// --- 4. DÜZENLEME MODU ---
function editTool(index, title, icon, link) {
    isEditMode = true;
    currentEditingIndex = index;

    document.getElementById("tool-title").value = title;
    document.getElementById("tool-icon").value = icon;
    document.getElementById("tool-link").value = link;

    const btn = document.querySelector('#tools-manager .btn-submit');
    if(btn) btn.innerText = "Güncelle";
    
    // Formun olduğu yere kaydır
    const formContainer = document.querySelector('.settings-container');
    if(formContainer) formContainer.scrollIntoView({ behavior: 'smooth' });
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

// --- 5. SİLME İŞLEMİ ---
window.deleteTool = async (index, event) => {
    // Satırın onclick olayını durdur (Edit modu açılmasın)
    if(event) event.stopPropagation();

    if(!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;

    // UI'da siliniyor göstergesi (ikonu spinner yapabiliriz veya satırı silebiliriz)
    const btn = event.target.closest('button');
    if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const formData = {
        action: "delete_row",
        type: "tools",
        id: index // Code.gs tarafında bu index kullanılarak satır silinecek
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        alert("Silme işlemi gönderildi.");
        // Listeyi yenile
        setTimeout(fetchTools, 1500);

    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Silinemedi: " + error);
        if(btn) btn.innerHTML = '<i class="fa-solid fa-trash"></i>'; // Geri al
    }
};
