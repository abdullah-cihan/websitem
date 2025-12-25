/* ============================================================
   ADMIN PAGES MANAGER - SAYFA YÖNETİMİ
   ============================================================ */

(function () {
    // 👇 GÜNCEL API LİNKİNİZ (Backend düzeltmesinden sonraki link)
   const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";
    // ==========================================
    // 1. BAŞLANGIÇ (INIT)
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // Eğer sayfalar tablosu varsa verileri çekmeye başla
        if(document.getElementById('pages-table-body')) {
            fetchPages();
        }
    });

    // ==========================================
    // 2. SAYFA KAYDETME (SAVE PAGE)
    // ==========================================
    window.savePage = async () => {
        const btn = document.querySelector('#page-editor .btn-submit');
        const originalText = btn ? btn.innerText : "Kaydet";
        
        // Butonu kilitle
        if(btn) {
            btn.innerText = "Kaydediliyor...";
            btn.disabled = true;
        }

        try {
            // Form verilerini al
            const title = document.getElementById("page-title").value.trim();
            const content = document.getElementById("page-content").value; // Kod olduğu için trim yapmıyoruz

            // Basit doğrulama
            if (!title || !content) {
                alert("Lütfen 'Sayfa Başlığı' ve 'Kod' alanlarını doldurunuz.");
                return;
            }

            // Backend'e gidecek veri paketi
            const pageData = {
                action: "add_page",
                baslik: title,
                icerik: content
            };

            // Gönderim işlemi
            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageData)
            });

            // Başarılı
            alert("✅ Sayfa başarıyla oluşturuldu!\nLink üretildi, listeyi kontrol ediniz.");
            
            // Formu temizle
            document.getElementById("page-title").value = "";
            document.getElementById("page-content").value = "";
            
            // Listeye geri dön ve yenile
            if(typeof showSection === 'function') showSection('pages-manager');
            setTimeout(fetchPages, 1000);

        } catch (error) {
            console.error("Page Save Error:", error);
            alert("Bir hata oluştu: " + error.message);
        } finally {
            // Butonu eski haline getir
            if(btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    };

    // ==========================================
    // 3. SAYFALARI LİSTELEME (FETCH PAGES)
    // ==========================================
    async function fetchPages() {
        const tbody = document.getElementById('pages-table-body');
        if (!tbody) return;

        // Yükleniyor mesajı
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Veriler yükleniyor...</td></tr>';

        try {
            // Backend'den veriyi çek (?type=pages)
            const res = await fetch(`${API_URL}?type=pages`);
            const data = await res.json();
            const pages = data.pages || [];

            tbody.innerHTML = ''; // Tabloyu temizle

            // Veri yoksa
            if (pages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#94a3b8;">Henüz hiç sayfa oluşturulmadı.</td></tr>';
                return;
            }

            // Verileri tersten sırala (En yeni en üstte) ve listele
            pages.reverse().forEach(page => {
                const tr = document.createElement('tr');
                
                // Linkin güvenli olup olmadığını kontrol et
                const pageLink = page.link.startsWith('http') ? page.link : `page-view.html?id=${page.id}`;

                tr.innerHTML = `
                    <td style="color:white; font-weight:500;">
                        <i class="fa-regular fa-file-code" style="margin-right:8px; color:#64748b;"></i>
                        ${page.baslik}
                    </td>
                    <td>
                        <a href="${pageLink}" target="_blank" class="table-link">
                            Linke Git <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.7em; margin-left:5px;"></i>
                        </a>
                    </td>
                    <td>
                        <button class="action-btn" onclick="alert('Güvenlik nedeniyle silme işlemini lütfen Google Sheets üzerinden yapınız.')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error("Fetch Pages Error:", err);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Veri çekilemedi. Bağlantınızı kontrol edin.</td></tr>';
        }
    }

    // ==========================================
    // 4. YARDIMCI FONKSİYONLAR
    // ==========================================
    
    // Yeni sayfa ekleme ekranını aç
    window.openNewPageEditor = () => {
        if(typeof showSection === 'function') {
            showSection('page-editor');
            const titleEl = document.getElementById('page-form-title');
            if(titleEl) titleEl.innerText = "Yeni Sayfa Oluştur";
            
            // Editörü temizle
            document.getElementById("page-title").value = "";
            document.getElementById("page-content").value = "";
        } else {
            console.error("showSection fonksiyonu bulunamadı. admin.js yüklü mü?");
        }
    };

})();
