/* ============================================================
   ADMIN POSTS MANAGER - UPGRADED VERSION
   ============================================================ */
(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

  // ----------------------------
  // JSONP helper
  // ----------------------------
  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      window[cb] = (data) => {
        resolve(data);
        try { delete window[cb]; } catch {}
        script.remove();
      };

      const script = document.createElement("script");
      script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
      script.onerror = () => {
        reject(new Error("JSONP yüklenemedi"));
        try { delete window[cb]; } catch {}
        script.remove();
      };
      document.body.appendChild(script);
    });
  }

  // ----------------------------
  // Init
  // ----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initQuill();
    loadCategories();
    setupEventListeners();

    if (document.getElementById("posts-table-body")) {
      fetchPosts();
    }
  });

  // ----------------------------
  // Geliştirilmiş Event Dinleyiciler
  // ----------------------------
  function setupEventListeners() {
    // Resim Önizleme
    const imgInput = document.getElementById("post-image");
    if (imgInput) {
      imgInput.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        const preview = document.getElementById("img-preview-container");
        if (preview) {
          preview.innerHTML = url ? `<img src="${url}" style="max-height:100px; border-radius:8px; margin-top:10px; border: 2px solid #334155;">` : "";
        }
      });
    }

    // Arama Fonksiyonu
    const searchInput = document.getElementById("post-search");
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll("#posts-table-body tr");
        rows.forEach(row => {
          const title = row.querySelector("td:nth-child(2)")?.innerText.toLowerCase();
          row.style.display = title?.includes(term) ? "" : "none";
        });
      });
    }
  }

  // ----------------------------
  // Quill & Okuma Süresi
  // ----------------------------
  function initQuill() {
    const container = document.getElementById("editor-container");
    if (!container || typeof Quill === "undefined") return;

    if (!container.__quill) {
      const quill = new Quill(container, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['image', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ]
        },
        placeholder: "Yazı içeriğini buraya giriniz...",
      });
      container.__quill = quill;

      // Otomatik Okuma Süresi Hesaplama
      quill.on('text-change', () => {
        const text = quill.getText();
        const words = text.trim().split(/\s+/).length;
        const time = Math.ceil(words / 200); // Dakikada ortalama 200 kelime
        const timeInput = document.getElementById("post-read-time");
        if (timeInput && !timeInput.value) { // Kullanıcı elle girmemişse
            timeInput.placeholder = `Tahmini ${time} dk`;
        }
      });
    }
  }

  function getQuillHTML() {
    const container = document.getElementById("editor-container");
    const quill = container?.__quill;
    return quill ? quill.root.innerHTML : "";
  }

  // ----------------------------
  // GET: fetch posts
  // ----------------------------
  async function fetchPosts() {
    const tbody = document.getElementById("posts-table-body");
    if (!tbody) return;

    // Skeleton loading etkisi
    tbody.innerHTML = Array(3).fill(0).map(() => `
      <tr class="skeleton-row">
        <td colspan="5"><div class="skeleton-pulse" style="height:40px; background:#1e293b; border-radius:4px; margin:5px 0;"></div></td>
      </tr>
    `).join('');

    try {
      const data = await jsonp(`${API_URL}?type=posts`);
      const posts = Array.isArray(data) ? data : (data.posts || []);

      tbody.innerHTML = "";
      if (!posts.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">
          <i class="fa-regular fa-folder-open" style="font-size:2rem; display:block; margin-bottom:10px; color:#475569;"></i>
          Henüz hiç yazı eklenmemiş.
        </td></tr>`;
        return;
      }

      posts.slice().reverse().forEach((post) => {
        const tr = document.createElement("tr");
        const statusColor = post.durum === "Taslak" ? "#f59e0b" : "#10b981";

        tr.innerHTML = `
          <td>
            <div class="img-frame">
               ${post.resim ? `<img src="${post.resim}" onerror="this.src='https://placehold.co/40x40?text=!'">` : `<i class="fa-solid fa-image"></i>`}
            </div>
          </td>
          <td>
            <div style="font-weight:600; color:#f8fafc;">${escapeHtml(post.baslik)}</div>
            <div style="font-size:0.75rem; color:#64748b;">${post.tarih ? new Date(post.tarih).toLocaleDateString("tr-TR") : ''}</div>
          </td>
          <td><span class="badge-cat">${escapeHtml(post.kategori)}</span></td>
          <td><span class="status-dot" style="background:${statusColor}"></span> ${escapeHtml(post.durum || "Yayında")}</td>
          <td>
            <div class="action-group">
                <button class="action-btn view" onclick="window.open('../post.html?id=${post.id}', '_blank')"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn delete" onclick="alert('Sheet üzerinden siliniz.')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444; padding:20px;">
        <i class="fa-solid fa-triangle-exclamation"></i> Veriler alınamadı.
      </td></tr>`;
    }
  }

  // ----------------------------
  // POST: save post
  // ----------------------------
  window.savePost = async (status, btnEl) => {
    const baslik = document.getElementById("post-title")?.value.trim();
    const icerik = getQuillHTML();

    if (!baslik || icerik === "<p><br></p>") {
      alert("⚠️ Başlık ve içerik alanları zorunludur!");
      return;
    }

    const btnSubmit = btnEl || document.querySelector("#add-post-form .btn-submit");
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> İşleniyor...`;
    btnSubmit.disabled = true;

    try {
      const payload = {
        action: "add_post",
        baslik: baslik,
        icerik: icerik,
        resim: document.getElementById("post-image")?.value.trim() || "",
        tarih: document.getElementById("post-date")?.value || new Date().toISOString().slice(0, 10),
        kategori: document.getElementById("post-category")?.value || "Genel",
        ozet: document.getElementById("post-desc")?.value.trim() || "",
        durum: status || "Yayında",
        okuma_suresi: document.getElementById("post-read-time")?.value || "",
        etiketler: document.getElementById("post-tags")?.value || "",
        one_cikan: document.getElementById("post-featured")?.checked ? "true" : "false"
      };

      await postViaForm(payload);

      // Başarı animasyonu ve temizlik
      alert("🚀 Yazı başarıyla sisteme gönderildi!");
      document.getElementById("add-post-form")?.reset();
      document.getElementById("img-preview-container").innerHTML = "";
      if (document.getElementById("editor-container").__quill) {
        document.getElementById("editor-container").__quill.setContents([]);
      }
      
      // Listeye dön ve yenile
      if(window.showSection) showSection('posts');
      setTimeout(fetchPosts, 1500);

    } catch (err) {
      alert("❌ Hata oluştu: " + err.message);
    } finally {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
    }
  };

  // Helper functions
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]));
  }

  function postViaForm(fields) {
    return new Promise((resolve) => {
      const iframeName = "hidden_iframe_" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      const form = document.createElement("form");
      form.action = API_URL;
      form.method = "POST";
      form.target = iframeName;
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v == null ? "" : String(v);
        form.appendChild(input);
      });
      iframe.onload = () => {
        setTimeout(() => {
          form.remove();
          iframe.remove();
          resolve(true);
        }, 500);
      };
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  // Kategori işlemleri aynı kaldı...
  function loadCategories() { /* ... aynı ... */ }
  window.addNewCategory = () => { /* ... aynı ... */ };

})();
