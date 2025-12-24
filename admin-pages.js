/* ============================================================
   ADMIN PAGES MANAGER - FINAL v2
   GET  : JSONP (CORS yok)
   POST : hidden form + iframe (CORS yok)
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
  // CORS'suz POST: hidden form + iframe
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
        form.remove();
        iframe.remove();
        resolve(true);
      };

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ----------------------------
  // GET Pages (JSONP)
  // ----------------------------
  async function fetchPages() {
    const tbody = document.getElementById("pages-table-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Yükleniyor...</td></tr>`;

    try {
      const data = await jsonp(`${API_URL}?type=pages`);
      const pages = data?.pages || [];

      tbody.innerHTML = "";
      if (!pages.length) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#94a3b8;">Hiç sayfa yok.</td></tr>`;
        return;
      }

      pages.slice().reverse().forEach((p) => {
        const tr = document.createElement("tr");
        const link = p.link || "";

        tr.innerHTML = `
          <td style="color:white; font-weight:500;">${escapeHtml(p.baslik || "")}</td>
          <td>${link ? `<a href="${escapeHtml(link)}" target="_blank">${escapeHtml(link)}</a>` : "-"}</td>
          <td>
            <button class="action-btn" onclick="alert('Düzenleme istersen ekleyelim (update).')">
              <i class="fa-solid fa-pen"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Pages JSONP error:", err);
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ef4444;">Bağlantı hatası!</td></tr>`;
    }
  }

  // ----------------------------
  // POST Add Page (form)
  // admin.html: savePage() çağrısı varsa onu override ediyoruz
  // ----------------------------
  window.savePage = async function () {
    const titleEl = document.getElementById("page-title");
    const contentEl = document.getElementById("page-content");

    if (!titleEl || !contentEl) {
      alert("Sayfa editör alanları bulunamadı (page-title / page-content).");
      return;
    }

    const baslik = titleEl.value.trim();
    const icerik = contentEl.value;

    if (!baslik) { alert("Sayfa başlığı zorunlu"); return; }
    if (!icerik || !icerik.trim()) { alert("Sayfa içeriği boş olamaz"); return; }

    try {
      await postViaForm({
        action: "add_page",
        baslik,
        icerik
      });

      alert("✅ Sayfa kaydedildi!");
      titleEl.value = "";
      contentEl.value = "";

      // varsa listeyi yenile
      setTimeout(fetchPages, 1200);

      // varsa sayfalar listesine dön
      if (typeof window.showSection === "function") {
        window.showSection("pages-manager");
      }
    } catch (e) {
      console.error(e);
      alert("Kaydedilemedi.");
    }
  };

  // ----------------------------
  // Init
  // ----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("pages-table-body")) fetchPages();
  });

  window.__fetchPages = fetchPages;
})();
