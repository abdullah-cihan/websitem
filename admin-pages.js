/* admin-pages.js */

(function () {
  // ==========================================
  // AYARLAR
  // ==========================================
  // Google Apps Script Linkini BURAYA YAPIŞTIRIN:
  const API_URL = "https://script.google.com/macros/s/AKfycbwIoaGtrRzwpIe0avxruvqzHBiqxco7bz1Yb3mD9RHVyBrpJoLoaF62G4YnTXfOSmhS/exec"; 

  // ----------------------------
  // Core erişimi
  // ----------------------------
  function core() {
    return window.AdminCore; // Eğer admin.js içinde tanımlıysa
  }

  // ----------------------------
  // State
  // ----------------------------
  let customPages = [];
  let editPageIndex = null;

  // ----------------------------
  // Helpers
  // ----------------------------
  function getCodeEl() {
    return document.getElementById('page-content') || document.getElementById('page-code-editor');
  }

  function getCodeValue() {
    const el = getCodeEl();
    return el ? el.value : '';
  }

  function setCodeValue(val) {
    const el = getCodeEl();
    if (el) el.value = val ?? '';
  }

  function pageLinkForId(id) {
    // Sayfaları görüntülemek için tool-view.html kullanılıyor
    const safe = encodeURIComponent(String(id ?? '').trim());
    return `tool-view.html?id=${safe}`;
  }

  // ----------------------------
  // VERİ ÇEKME (FETCH)
  // ----------------------------
  async function fetchPages() {
    const tbody = document.getElementById('pages-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Yükleniyor...</td></tr>';

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      // Sadece "kategori"si "Sayfa" olanları veya genel yapıyı filtreleyebiliriz.
      // Şimdilik tüm veriyi alıp, sadece bizim oluşturduğumuz sayfaları göstermek için
      // kategorisi "Sayfa" olanları filtreliyoruz.
      customPages = data.filter(item => item.kategori === 'Sayfa').reverse();

      renderPagesTable();
    } catch (error) {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Bağlantı hatası!</td></tr>';
    }
  }

  // ----------------------------
  // Render
  // ----------------------------
  function renderPagesTable() {
    const tbody = document.getElementById('pages-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!customPages.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">Henüz oluşturulmuş bir sayfa yok.</td></tr>';
      return;
    }

    customPages.forEach((page, index) => {
      // Google Sheet sütunları: id, baslik, icerik, tarih
      const link = pageLinkForId(page.id);
      
      // XSS Koruması için basit escape
      const safeTitle = String(page.baslik || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeDate = String(page.tarih || '');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600; color:white;">${safeTitle}</td>
        <td><span style="font-size:0.85rem; color:#94a3b8;">${safeDate}</span></td>
        <td>
          <div class="link-box" style="width:fit-content; background:#0f172a; padding:5px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
            <input type="text" value="${link}" readonly style="background:transparent; border:none; color:#94a3b8; width:180px; font-size:0.8rem;">
            <button type="button" class="action-btn btn-copy" title="Kopyala">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </td>
        <td style="display:flex; gap:5px;">
          <a href="${link}" target="_blank" rel="noopener noreferrer"
            class="action-btn btn-view" title="Görüntüle"
            style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
            <i class="fa-solid fa-eye"></i>
          </a>
          <button type="button" class="action-btn btn-edit" title="Kopyala ve Yeni Oluştur">
            <i class="fa-solid fa-clone"></i>
          </button>
        </td>
      `;

      // KOPYALA
      tr.querySelector('.btn-copy')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(link);
          alert('Link kopyalandı!');
        } catch {
          alert('Kopyalama başarısız.');
        }
      });

      // DÜZENLE (Aslında veriyi forma çeker)
      tr.querySelector('.btn-edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.loadPageToEdit(index);
      });

      tbody.appendChild(tr);
    });
  }

  // ----------------------------
  // Global API (Window Functions)
  // ----------------------------
  window.savePage = async () => {
    const title = (document.getElementById('page-title')?.value || '').trim();
    const code = (getCodeValue() || '').trim();

    if (!title || !code) {
      alert('Lütfen başlık ve içerik alanlarını doldurun!');
      return;
    }

    const btnSave = document.getElementById('btn-save-page');
    const oldText = btnSave.innerHTML;
    btnSave.innerHTML = "Kaydediliyor...";
    btnSave.disabled = true;

    // Google Sheet Yapısına Uygun Veri Paketi
    const pageData = {
      baslik: title,
      icerik: code,       // Sayfa kodlarını 'icerik' sütununa basıyoruz
      kategori: 'Sayfa',  // Ayırt etmek için kategori sabit 'Sayfa'
      resim: '',          // Sayfada resim yok
      ozet: 'Özel HTML Sayfası',
      tarih: new Date().toLocaleDateString('tr-TR'),
      durum: 'published'
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData)
        });

        alert("✅ Sayfa Oluşturuldu!");
        window.resetPageForm();
        fetchPages(); // Tabloyu yenile

    } catch (error) {
        alert("Hata: " + error);
    } finally {
        btnSave.innerHTML = oldText;
        btnSave.disabled = false;
    }
  };

  window.loadPageToEdit = (index) => {
    const page = customPages[index];
    if (!page) return;

    // Formu doldur
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.value = page.baslik || '';

    setCodeValue(page.icerik || '');

    const formTitle = document.getElementById('page-form-title');
    if (formTitle) formTitle.textContent = 'Sayfayı Kopyala/Düzenle';
    
    // Kullanıcıyı editör sekmesine götür
    if(window.showSection) window.showSection('page-editor');
  };

  window.deletePage = (index) => {
    // Google Apps Script basit modda silmeyi desteklemiyor.
    alert("Google Sheet API basit modda çalıştığı için silme işlemi sadece Tablo üzerinden manuel yapılabilir. Lütfen Google Sheet'i açıp ilgili satırı siliniz.");
  };

  window.resetPageForm = () => {
    editPageIndex = null;
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.value = '';
    setCodeValue('');
    const formTitle = document.getElementById('page-form-title');
    if (formTitle) formTitle.textContent = 'Yeni Sayfa Oluştur';
  };

  window.openNewPageEditor = () => {
    window.resetPageForm();
    if(window.showSection) window.showSection('page-editor');
  };

  // ----------------------------
  // INIT
  // ----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    fetchPages();
  });

})();
