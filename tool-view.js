document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
    const id = new URLSearchParams(window.location.search).get('id');
    const frame = document.getElementById('tool-frame');

    if (!id || !frame) return;

    try {
        const res = await fetch(`${API_URL}?type=pages`);
        const data = await res.json();
        const pages = data.pages || [];
        const page = pages.find(p => String(p.id) === String(id));

        if (page && page.icerik) {
            document.title = page.baslik;
            frame.srcdoc = page.icerik;
        } else {
            document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px'>Sayfa Bulunamadı (404)</h1>";
        }
    } catch (e) {
        console.error(e);
    }
});
