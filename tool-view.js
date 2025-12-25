document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
    const container = document.getElementById('tools-list-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}?type=tools`);
        const data = await res.json();
        const tools = data.tools || [];

        if (tools.length === 0) {
            container.innerHTML = '<div class="tool-empty">Araç yok.</div>';
            return;
        }

        let html = '<div class="tools-list">';
        tools.forEach(tool => {
            const target = tool.link.startsWith('#') || tool.link.includes('tool-view.html') ? '_self' : '_blank';
            html += `
            <a href="${tool.link}" class="tool-item" target="${target}">
                <i class="${tool.ikon || 'fa-solid fa-link'}"></i>
                <span>${tool.baslik}</span>
            </a>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="tool-empty">Hata.</div>';
    }
});
