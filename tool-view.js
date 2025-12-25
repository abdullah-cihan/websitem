document.addEventListener('DOMContentLoaded', async () => {
  // ✅ YENİ LİNK
  const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec"; 

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id');
  const frame = document.getElementById('tool-frame');

  if (!targetId || !frame) return;

  try {
    const response = await fetch(`${API_URL}?type=pages`);
    const data = await response.json();
    const pages = data.pages || [];

    const pageData = pages.find(p => String(p.id) === String(targetId));

    if (pageData && pageData.icerik) {
      document.title = pageData.baslik;
      frame.srcdoc = pageData.icerik;
    } else {
      document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;'>Sayfa Bulunamadı</h1>";
    }

  } catch (error) {
    console.error(error);
  }
});
