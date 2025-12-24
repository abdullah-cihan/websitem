/* ============================================================
   ADMIN POSTS MANAGER - FINAL (JSONP GET + FORM POST)
   ============================================================ */
(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyZ-HXJTkmTALCdnyOvTkrjMP3j4AffrrCPEuS7MytAx1tTsQYwYtcnzsFgrSMQLScSuA/exec";

  // ----------------------------
  // JSONP helper (CORS yok)
  // ----------------------------
  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      window[cb] = (data) => {
        resolve(data);
        try { delete window[cb]; } catch {}
        script.remove();
      };

function formatDateTR(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("tr-TR");
}


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

    if (document.getElementById("posts-table-body")) {
      fetchPosts();
    }
  });

  // ----------------------------
  // Quill
  // ----------------------------
  function initQuill() {
    const container = document.getElementById("editor-container");
    if (!container || typeof Quill === "undefined") return;

    if (!container.__quill) {
      container.__quill = new Quill(container, {
        theme: "snow",
        placeholder: "Yazı içeriğini buraya giriniz...",
      });
    }
  }

  function getQuillHTML() {
    const container = document.getElementById("editor-container");
    const quill = container?.__quill;
    return quill ? quill.root.innerHTML : "";
  }

  // ----------------------------
  // Categories (localStorage)
  // ----------------------------
  function readArrayLS(k) {
    return JSON.parse(localStorage.getItem(k) || "[]");
  }
  function writeLS(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  }

  function loadCategories() {
    const select = document.getElementById("post-category");
    if (!select) return;

    let cats = readArrayLS("categories");
    if (cats.length === 0) {
      cats = ["Genel", "Teknoloji", "Yazılım", "Hayat", "Felsefe"];
      writeLS("categories", cats);
    }

    select.innerHTML = "";
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  window.addNewCategory = () => {
    const newCat = prompt("Yeni kategori adı:");
    if (!newCat || !newCat.trim()) return;

    const clean = newCat.trim();
    const cats = readArrayLS("categories");
    if (cats.includes(clean)) {
      alert("Bu kategori zaten mevcut!");
      return;
    }
    cats.push(clean);
    writeLS("categories", cats);
    loadCategories();

    const select = document.getElementById("post-category");
    if (select) select.value = clean;
  };

  // ----------------------------
  // GET: fetch posts (JSONP)
  // ----------------------------
  async function fetchPosts() {
    const tbody = document.getElementById("posts-table-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>`;

    try {
      const data = await jsonp(`${API_URL}?type=posts`);
      const posts = Array.isArray(data) ? data : (data.posts || []);

      tbody.innerHTML = "";
      if (!posts.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Hiç yazı yok.</td></tr>`;
        return;
      }

      posts.slice().reverse().forEach((post) => {
        const tr = document.createElement("tr");

        const imgTag = post.resim
          ? `<img src="${post.resim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">`
          : `<div style="width:40px; height:40px; background:#334155; border-radius:4px;"></div>`;

        tr.innerHTML = `
          <td>${imgTag}</td>
          <td style="color:white; font-weight:500;">${escapeHtml(post.baslik || "")}</td>
          <td>${escapeHtml(post.kategori || "")}</td>
          <td><span style="padding:4px 8px; background:#10b981; border-radius:4px; font-size:0.8rem;">${escapeHtml(post.durum || "Yayında")}</span></td>
          <td>
            <button class="action-btn" onclick="alert('Silme/Güncelleme sonraki adım.')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;

        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error("JSONP Fetch Hatası:", err);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Veri çekilemedi.</td></tr>`;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ----------------------------
  // POST: add post (CORS yok) -> hidden form submit
  // ----------------------------
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
        // response'u okuyamayız (cross-origin), ama submit gerçekleşti
        form.remove();
        iframe.remove();
        resolve(true);
      };

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  window.savePost = async (status, btnEl) => {
    const btnSubmit = btnEl || document.querySelector("#add-post-form .btn-submit");
    const originalText = btnSubmit ? btnSubmit.innerText : "Yayınla";

    if (btnSubmit) {
      btnSubmit.innerText = "Gönderiliyor...";
      btnSubmit.disabled = true;
    }

    try {
      const baslik = document.getElementById("post-title")?.value.trim();
      const tarihEl = document.getElementById("post-date")?.value;
      const tarih = tarihEl || new Date().toISOString().slice(0, 10);

      const kategori = document.getElementById("post-category")?.value || "Genel";
      const resimUrl = document.getElementById("post-image")?.value.trim() || "";
      const ozet = document.getElementById("post-desc")?.value.trim() || "";

      const okumaSuresi = document.getElementById("post-read-time")?.value || "";
      const etiketler = document.getElementById("post-tags")?.value || "";
      const oneCikan = document.getElementById("post-featured")?.checked ? "true" : "false";

      const icerik = getQuillHTML();

      if (!baslik) throw new Error("Lütfen bir başlık giriniz.");
      if (!icerik || icerik === "<p><br></p>" || !icerik.trim()) throw new Error("Yazı içeriği boş olamaz.");

      // Form ile gönderilecek alanlar (Code.gs e.parameter okuyor)
      await postViaForm({
        action: "add_post",
        baslik,
        icerik,
        resim: resimUrl,
        tarih,
        kategori,
        ozet,
        durum: status || "Yayında",
        okuma_suresi: okumaSuresi,
        etiketler,
        one_cikan: oneCikan
      });

      alert("✅ Yazı gönderildi! (Sheet'e yazıldı)");

      // Form temizle
      document.getElementById("add-post-form")?.reset();
      const container = document.getElementById("editor-container");
      const quill = container?.__quill;
      if (quill) quill.setContents([]);

      // Listeyi yenile
      setTimeout(fetchPosts, 1500);

    } catch (err) {
      console.error(err);
      alert("Hata: " + err.message);
    } finally {
      if (btnSubmit) {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
      }
    }
  };

  // expose fetchPosts (istersen başka yerden çağır)
  window.__fetchPosts = fetchPosts;

})();
