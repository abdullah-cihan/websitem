/**
 * Modern Admin Tools Manager
 * Özellikler: CRUD, Sürükle-Bırak Sıralama, Modern UI Bildirimleri
 */
class ToolsManager {
    constructor() {
        this.API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec"; // Buraya kendi URL'ni yazabilirsin veya window.API_URL kullanabilirsin
        this.API_KEY = window.API_KEY || "YOUR_SECRET_KEY"; 
        
        this.state = {
            tools: [],
            isEditMode: false,
            editingIndex: null
        };

        this.elements = {
            tbody: document.getElementById('tools-table-body'),
            formTitle: document.getElementById("tool-title"),
            formIcon: document.getElementById("tool-icon"),
            formLink: document.getElementById("tool-link"),
            submitBtn: document.querySelector('#tools-manager .btn-submit'),
            formContainer: document.getElementById('tools-manager')
        };

        this.init();
    }

    init() {
        if (!this.elements.tbody) return;
        
        // İlk yükleme
        this.fetchTools();
        
        // Event Listeners
        this.elements.submitBtn.addEventListener('click', () => this.handleToolSubmit());
        
        // Sürükle Bırak Başlatıcı
        this.initSortable();
    }

    // --- Sürükle Bırak Mantığı (SortableJS) ---
    initSortable() {
        new Sortable(this.elements.tbody, {
            animation: 150,
            handle: '.drag-handle', // Sadece ikonundan tutunca sürüklenir
            ghostClass: 'sortable-ghost', // Sürüklenen öğenin arkasındaki gölge stili
            onEnd: (evt) => this.handleReorder(evt)
        });
    }

    async handleReorder(evt) {
        // Yeni sıralamayı algıla
        const itemEl = evt.item;
        const newIndex = evt.newIndex;
        const oldIndex = evt.oldIndex;

        if (newIndex === oldIndex) return;

        // UI'da diziyi güncelle (Optimistic UI)
        const movedItem = this.state.tools.splice(oldIndex, 1)[0];
        this.state.tools.splice(newIndex, 0, movedItem);

        this.showNotification("Sıralama güncelleniyor...", "info");

        // Backend'e yeni sırayı gönder
        try {
            await this.sendRequest({
                action: "reorder_tools",
                oldIndex: oldIndex,
                newIndex: newIndex,
                // Alternatif olarak tüm listeyi gönderebilirsin: order: this.state.tools
            });
            this.showNotification("✅ Sıralama kaydedildi!", "success");
        } catch (e) {
            console.error(e);
            this.showNotification("⚠️ Sıralama kaydedilemedi.", "error");
            // Hata olursa listeyi eski haline getirmek için tekrar çek
            this.fetchTools(); 
        }
    }

    // --- Veri Çekme ---
    async fetchTools() {
        this.renderLoading();
        try {
            const url = this.API_URL.startsWith('http') ? this.API_URL : window.API_URL;
            const res = await fetch(`${url}?type=tools`);
            const data = await res.json();
            this.state.tools = data.tools || [];
            this.renderTable();
        } catch (e) {
            console.error(e);
            this.elements.tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Veri yüklenemedi.</td></tr>';
        }
    }

    // --- Render İşlemleri ---
    renderLoading() {
        this.elements.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Veriler Yükleniyor...</td></tr>';
    }

    renderTable() {
        this.elements.tbody.innerHTML = '';
        if (this.state.tools.length === 0) {
            this.elements.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Araç bulunamadı.</td></tr>';
            return;
        }

        this.state.tools.forEach((t, i) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', i); // Satır takibi için
            tr.innerHTML = `
                <td class="drag-handle" style="cursor:grab; text-align:center; color:#aaa;">
                    <i class="fa-solid fa-grip-lines"></i>
                </td>
                <td style="text-align:center"><i class="${t.ikon}"></i></td>
                <td><strong>${t.baslik}</strong></td>
                <td style="font-size:0.85rem; color:#666;">${t.link}</td>
                <td style="text-align:center; white-space:nowrap;">
                    <button class="btn-edit action-btn" data-index="${i}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete action-btn" data-index="${i}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            
            // Event Delegation yerine doğrudan elemente bind (daha güvenli döngüler için)
            tr.querySelector('.btn-edit').onclick = () => this.prepareEdit(i);
            tr.querySelector('.btn-delete').onclick = (e) => this.deleteTool(i, e.currentTarget);
            
            this.elements.tbody.appendChild(tr);
        });
    }

    // --- Ekleme / Güncelleme ---
    async handleToolSubmit() {
        const baslik = this.elements.formTitle.value.trim();
        const ikon = this.elements.formIcon.value.trim();
        const link = this.elements.formLink.value.trim();

        if (!baslik || !link) {
            this.showNotification("Başlık ve Link alanları zorunludur!", "error");
            return;
        }

        const btn = this.elements.submitBtn;
        const originalText = btn.innerText;
        
        this.setLoadingState(btn, true);

        const payload = {
            action: this.state.isEditMode ? "update_tool" : "add_tool",
            index: this.state.editingIndex,
            baslik: baslik,
            ikon: ikon || "fa-solid fa-toolbox",
            link: link
        };

        try {
            await this.sendRequest(payload);
            this.showNotification(
                this.state.isEditMode ? "✅ Başarıyla Güncellendi" : "✅ Başarıyla Eklendi", 
                "success"
            );
            this.resetForm();
            // Hafif bir gecikme ile listeyi yenile (Apps Script gecikmesi için)
            setTimeout(() => this.fetchTools(), 1500); 
        } catch (e) {
            this.showNotification("İşlem başarısız: " + e, "error");
        } finally {
            this.setLoadingState(btn, false, originalText);
        }
    }

    // --- Silme ---
    async deleteTool(index, btnElement) {
        if (!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;

        btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'; // Spinner ikonu

        try {
            await this.sendRequest({
                action: "delete_row",
                type: "tools",
                id: index
            });
            this.showNotification("🗑️ Araç silindi.", "success");
            setTimeout(() => this.fetchTools(), 1500);
        } catch (e) {
            this.showNotification("Silme başarısız oldu.", "error");
            btnElement.innerHTML = '<i class="fa-solid fa-trash"></i>';
        }
    }

    // --- Yardımcı Metodlar ---
    prepareEdit(index) {
        const tool = this.state.tools[index];
        this.state.isEditMode = true;
        this.state.editingIndex = index;

        this.elements.formTitle.value = tool.baslik;
        this.elements.formIcon.value = tool.ikon;
        this.elements.formLink.value = tool.link;
        this.elements.submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle';
        this.elements.submitBtn.classList.add('btn-warning'); // Görsel fark için
        
        // Form alanına scroll yap
        this.elements.formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    resetForm() {
        this.state.isEditMode = false;
        this.state.editingIndex = null;
        this.elements.formTitle.value = "";
        this.elements.formIcon.value = "";
        this.elements.formLink.value = "";
        this.elements.submitBtn.innerText = "Ekle";
        this.elements.submitBtn.classList.remove('btn-warning');
    }

    async sendRequest(data) {
        const url = this.API_URL.startsWith('http') ? this.API_URL : window.API_URL;
        return fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ ...data, auth: this.API_KEY })
        });
    }

    setLoadingState(btn, isLoading, originalText = "") {
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
        } else {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }

    // Basit Toast Bildirim Sistemi
    showNotification(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `toast-msg toast-${type}`;
        div.innerText = msg;
        
        // Stil atamaları (CSS dosyasında da yapılabilir)
        Object.assign(div.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            padding: '12px 24px', borderRadius: '8px', color: '#fff',
            zIndex: 10000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease', opacity: '0', transform: 'translateY(20px)',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
        });

        document.body.appendChild(div);
        
        // Animasyon
        requestAnimationFrame(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateY(20px)';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', () => {
    window.toolsManager = new ToolsManager();
});
