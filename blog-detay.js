document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec"; 
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) { document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px'>Yazı bulunamadı</h1>"; return; }

    const titleEl = document.getElementById('detail-title');
    if(titleEl) titleEl.textContent = "Yükleniyor...";

    try {
        const res = await fetch(`${API_URL}?type=posts`);
        const data = await res.json();
        const posts = data.posts || [];
        const post = posts.find(p => String(p.id) === String(id));

        if (!post) {
            if(titleEl) titleEl.textContent = "Yazı Bulunamadı";
            return;
        }

        // Doldur
        document.title = post.baslik;
        if(titleEl) titleEl.textContent = post.baslik;
        document.getElementById('detail-category').textContent = post.kategori;
        document.getElementById('detail-date').textContent = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR', {year:'numeric', month:'long', day:'numeric'}) : '';
        document.getElementById('detail-content').innerHTML = post.icerik;

        // Görsel
        const imgEl = document.getElementById('detail-img');
        const iconContainer = document.querySelector('.cover-placeholder');
        
        if (post.resim && post.resim.startsWith('http')) {
            imgEl.src = post.resim;
            imgEl.style.display = 'block';
            if(iconContainer) iconContainer.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            if(iconContainer) {
                iconContainer.style.display = 'flex';
                iconContainer.innerHTML = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:4rem; color:#3b82f6;"></i>`;
            }
        }
        
        // Code highlight
        if(window.hljs) hljs.highlightAll();

    } catch (e) {
        console.error(e);
        if(titleEl) titleEl.textContent = "Hata oluştu";
    }
});
