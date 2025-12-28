/**
 * MODERN ADMIN TOOLS MANAGER (V-FINAL FIXED)
 * Entegrasyon: admin.js (Core) ve Yeni Code.gs ile tam uyumlu
 */

class ToolsManager {
    constructor() {
        // admin.js tarafından tanımlanan global değişkenleri al
        this.API_URL = window.API_URL;
        this.API_KEY = window.API_KEY;

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

        // Eğer admin.js yüklenmemişse veya URL yoksa uyar
        if (!this.API_URL) {
            console.error("HATA: API_URL bulunamadı! Lütfen önce admin.js dosyasının yüklendiğinden emin olun.");
            return;
        }

        this.init();
    }

    init() {
        if (!this.elements.tbody) return;

        // Olay Dinleyicileri
        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', () => this.handleToolSubmit());
        }

        // Sürükle Bırak Başlatıcı (SortableJS)
        if (typeof Sortable !== 'undefined') {
            this.initSortable();
        } else {
            console.warn("SortableJS kütüphanesi eksik. Sürükle-bırak çalışmayacak.");
        }
    }

    // --- Sürükle Bırak Mantığı ---
    initSortable() {
        new Sortable(this.elements.tbody, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => this.handleReorder(evt)
        });
    }

    async handleReorder(evt) {
        const newIndex = evt.newIndex;
        const oldIndex = evt.oldIndex;

        if (newIndex === oldIndex) return;

        // Optimistic UI Update (Arayüzü hemen güncelle)
        const movedItem = this.state.tools.splice(oldIndex, 1)[0];
        this.state.tools.splice(newIndex, 0, movedItem);

        this.showNotification("Sıralama güncelleniyor...", "info");

        try {
            // AUTH parametresi burada otomatik olarak sendRequest içinde ekleniyor
            await this.sendRequest({
                action: "reorder_tools",
                oldIndex: oldIndex,
                newIndex: newIndex
            });
            this.showNotification("✅ Sıralama kaydedildi!", "success");
            
            // Veri bütünlüğü için listeyi yenile (1 saniye sonra)
            setTimeout(() => this.fetchTools(), 1000);

        } catch (e) {
            console.error(e);
            this.showNotification("⚠️ Sıralama kaydedilemedi.", "error");
            // Hata olursa veriyi geri çek
            this.fetchTools();
        }
    }

    // --- Veri Çekme (admin.js tarafından tetiklenir) ---
    async fetchTools() {
        this.renderLoading();
        try {
            // GET isteği yaparken API_KEY gerekmez, sadece URL
            const res = await fetch(`${this.API_URL}?type=tools`);
            const data = await res.json();
            this.state.tools = data.tools || [];
            this.renderTable();
        } catch (e) {
            console.error(e);
            this.elements.tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:#ef4444; padding:20px;">Veri yüklenemedi.</td></tr>';
        }
    }

    // --- Render İşlemleri ---
    renderLoading() {
        this.elements.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#aaa;">Veriler Yükleniyor...</td></tr>';
    }

    renderTable() {
        this.elements.tbody.innerHTML = '';
        if (this.state.tools.length === 0) {
            this.elements.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#aaa;">Henüz araç eklenmemiş.</td></tr>';
            return;
        }

        this.state.tools.forEach((t, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="drag-handle" style="cursor:grab; text-align:center; color:#64748b; width: 50px;">
                    <i class="fa-solid fa-grip-lines"></i>
                </td>
                <td style="text-align:center; width: 60px; font-size: 1.2rem;">
                    <i class="${t.ikon}"></i>
                </td>
                <td>
                    <strong style="color: #e2e8f0;">${t.baslik}</strong>
                </td>
                <td style="font-size:0.85rem; color:#94a3b8;">${t.link}</td>
                <td style="text-align:center; white-space:nowrap; width: 100px;">
                    <button class="btn-edit action-btn" style="color:#3b82f6; margin-right:5px;"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete action-btn" style="color:#ef4444;"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            // Butonlara event bağlama
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
        const originalText = btn.innerHTML;
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
                this.state.isEditMode ? "✅ Güncellendi" : "✅ Eklendi",
                "success"
            );
            this.resetForm();
            setTimeout(() => this.fetchTools(), 1000); // Gecikmeli yenileme
        } catch (e) {
            this.showNotification("İşlem başarısız: " + e, "error");
        } finally {
            this.setLoadingState(btn, false, originalText);
        }
    }

    // --- Silme ---
    async deleteTool(index, btnElement) {
        if (!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;

        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

        try {
            await this.sendRequest({
                action: "delete_row",
                type: "tools",
                id: index
            });
            this.showNotification("🗑️ Silindi", "success");
            
            // UI'dan hemen sil
            const row = this.elements.tbody.children[index];
            if(row) row.style.display = 'none';

            setTimeout(() => this.fetchTools(), 1000);
        } catch (e) {
            this.showNotification("Hata oluştu.", "error");
            btnElement.innerHTML = originalHTML;
        }
    }

    // --- Yardımcılar ---
    prepareEdit(index) {
        const tool = this.state.tools[index];
        this.state.isEditMode = true;
        this.state.editingIndex = index;

        this.elements.formTitle.value = tool.baslik;
        this.elements.formIcon.value = tool.ikon;
        this.elements.formLink.value = tool.link;

        this.elements.submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle';
        this.elements.submitBtn.classList.add('btn-warning');
        this.elements.formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // API İsteği (POST)
    async sendRequest(data) {
        // admin.js'den gelen API_KEY'i 'auth' parametresi olarak ekle
        // BU KISIM KRİTİK: Code.gs'deki yeni güvenlik duvarı bu 'auth' parametresini bekliyor
        return fetch(this.API_URL, {
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
            btn.innerHTML = this.state.isEditMode ? '<i class="fa-solid fa-floppy-disk"></i> Güncelle' : "Ekle";
        }
    }

    showNotification(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `toast-msg toast-${type}`;
        div.innerText = msg;
        Object.assign(div.style, {
            position: 'fixed', bottom: '20px', right: '20px', padding: '12px 24px',
            borderRadius: '8px', color: '#fff', zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.3s ease',
            opacity: '0', transform: 'translateY(20px)',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
        });
        document.body.appendChild(div);
        requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
        setTimeout(() => {
            div.style.opacity = '0'; div.style.transform = 'translateY(20px)';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }
}

// BAŞLATMA VE ENTEGRASYON
document.addEventListener('DOMContentLoaded', () => {
    // Sınıfı başlat
    window.toolsManager = new ToolsManager();

    // admin.js'nin aradığı global fonksiyonu tanımla
    window.fetchTools = () => {
        if (window.toolsManager) {
            window.toolsManager.fetchTools();
        }
    };
});
