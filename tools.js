document.addEventListener('DOMContentLoaded', () => {
    // === API URL'İNİZİ BURAYA YAPIŞTIRIN ===
    const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

    const toolsContainer = document.getElementById('tools-list-container');
    if (!toolsContainer) return;

    fetch(`${API_URL}?type=tools`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                toolsContainer.innerHTML = '<div class="tool-empty">Henüz araç eklenmedi.</div>';
                return;
            }

            let html = '<div class="tools-list">';
            data.forEach(tool => {
                html += `
                <a href="${tool.link}" class="tool-item" target="${tool.link.startsWith('#') ? '_self' : '_blank'}">
                    <i class="${tool.icon || 'fa-solid fa-link'}"></i>
                    <span>${tool.title}</span>
                </a>`;
            });
            html += '</div>';
            toolsContainer.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            toolsContainer.innerHTML = '<div class="tool-empty">Yüklenemedi.</div>';
        });
});


