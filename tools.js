document.addEventListener('DOMContentLoaded', async () => {
    // API URL'niz
    const API_URL = "https://script.google.com/macros/s/AKfycbwnUnPxxwIYV0L3M0j4SBdcDec-rzb3rhqqDCieXEUWFQRyjfdJM-N0xTgG8A9gDl1z6A/exec";
    const container = document.getElementById('tools-list-container');
    
    if (!container) return;

    // Yükleniyor Göstergesi
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">Yükleniyor...</div>';

    try {
        // 🔥 KRİTİK DOKUNUŞ: Cache (Önbellek) Sorununu Çözmek İçin
        // URL'nin sonuna "&v=" ve o anki zamanı ekliyoruz.
        // Böylece tarayıcı her seferinde taze veri çekmek zorunda kalıyor.
        const cacheBuster = new Date().getTime(); 
        const res = await fetch(`${API_URL}?type=tools&v=${cacheBuster}`);
        
        const data = await res.json();
        const tools = data.tools || [];

        if (tools.length === 0) {
            container.innerHTML = '<div class="tool-empty">Henüz araç eklenmemiş.</div>';
            return;
        }

        // HTML Oluşturma
        let html = '<div class="tools-list">';
        tools.forEach(tool => {
            // Link kontrolü: tool-view sayfasına gidiyorsa aynı sekmede, dışarı gidiyorsa yeni sekmede aç
            const target = tool.link.startsWith('#') || tool.link.includes('tool-view.html') ? '_self' : '_blank';
            
            html += `
            <a href="${tool.link}" class="tool-item" target="${target}">
                <div class="tool-icon-wrapper">
                    <i class="${tool.ikon || 'fa-solid fa-link'}"></i>
                </div>
                <span>${tool.baslik}</span>
            </a>`;
        });
        html += '</div>';
        
        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="tool-empty" style="color:red;">Veriler yüklenirken hata oluştu.</div>';
    }
});
