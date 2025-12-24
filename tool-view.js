/* tool-view.js - Google Sheets Versiyonu */

document.addEventListener('DOMContentLoaded', async () => {
  // === API URL'İNİZİ BURAYA YAPIŞTIRIN ===
  const API_URL = "https://script.google.com/macros/s/AKfycbywMO77KzYzCJWFhlyru8_YVaE8QBmOj-7n5FK0m1lL6BCSt4oEBcxOuxedJeNSbUBg7w/exec"; 

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id');

  // Hata gösterme fonksiyonu
  const showError = (msg) => {
    const frame = document.getElementById('tool-frame');
    if (frame) frame.style.display = 'none';
    
    if (document.querySelector('.error-container')) return;
    
    const wrap = document.createElement('div');
    wrap.className = 'error-container';
    wrap.innerHTML = `
      <div class="error-icon">⚠️</div>
      <h1 class="error-title">Sayfa Bulunamadı</h1>
      <p class="error-text">${msg}</p>
      <a href="index.html" class="back-home-btn" style="position:static; display:inline-flex;">Ana Sayfaya Dön</a>
    `;
    document.body.appendChild(wrap);
  };

  // Geri butonu ekle
  if (!document.querySelector('.back-home-btn')) {
    const backBtn = document.createElement('a');
    backBtn.href = 'index.html';
    backBtn.className = 'back-home-btn';
    backBtn.innerHTML = '← Siteye Dön';
    document.body.appendChild(backBtn);
  }

  if (!targetId) {
    showError('Geçersiz bağlantı ID\'si.');
    return;
  }

  const frame = document.getElementById('tool-frame');
  if(!frame) return;

  try {
    // 1. Veriyi Çek (Sadece Pages tipi verileri isteyebiliriz veya hepsini çekip filtreleriz)
    // Hız için sadece pages çekelim: ?type=pages
    const response = await fetch(`${API_URL}?type=pages`);
    const pages = await response.json();

    // 2. Eşleşen ID'yi bul
    // Google Sheet'ten gelen ID number veya string olabilir, stringe çevirip karşılaştır.
    const pageData = pages.find(p => String(p.id) === String(targetId));

    if (pageData && pageData.code) {
      document.title = pageData.baslik || 'Araç Görüntüleme';
      // Iframe içine kodu bas
      frame.srcdoc = pageData.code;
    } else {
      showError('Bu araç veya sayfa bulunamadı.');
    }

  } catch (error) {
    console.error(error);
    showError('Veri sunucudan çekilemedi. İnternet bağlantınızı kontrol edin.');
  }
});

