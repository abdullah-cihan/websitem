document.addEventListener('DOMContentLoaded', () => {
    
    // ✅ GÜNCEL API LİNKİ
    const API_URL = "https://script.google.com/macros/s/AKfycbxWHYm0AZ7lgq1R1tel5ziBBCFVF7D-20GYEfefj33Fm35tKttOIR8_dymGtB_Z7UYWMA/exec";

    const toolsContainer = document.getElementById('tools-list-container');
    // Eğer bu container sayfada yoksa (örn: detay sayfasındasındır) çalışmasın
    if (!toolsContainer) return;

    fetch(`${API_URL}?type=tools`)
        .then(res => res.json())
        .then(data => {
            // Code.gs { tools: [...] } döndürüyor.
            const tools = data.tools || (data.ok ? data.tools : []);

            if (!tools || tools.length === 0) {
                toolsContainer.innerHTML = '<div class="tool-empty" style="padding:10px; color:rgba(255,255,255,0.5); font-size:0.9rem;">Henüz araç eklenmedi.</div>';
                return;
            }

            let html = '<div class="tools-list">';
            
            tools.forEach(tool => {
                // Link kontrolü (İç link mi dış link mi)
                const target = tool.link.startsWith('#') || tool.link.includes('tool-view.html') ? '_self' : '_blank';
                
                // Code.gs'den gelen veriler: baslik, ikon, link
                html += `
                <a href="${tool.link}" class="tool-item" target="${target}">
                    <i class="${tool.ikon || 'fa-solid fa-link'}"></i>
                    <span>${tool.baslik}</span>
                </a>`;
            });
            
            html += '</div>';
            toolsContainer.innerHTML = html;
        })
        .catch(err => {
            console.error("Tools Sidebar Error:", err);
            toolsContainer.innerHTML = '<div class="tool-empty" style="color:#ef4444; padding:10px;">Yüklenemedi.</div>';
        });
});
