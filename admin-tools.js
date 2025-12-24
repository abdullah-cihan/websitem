/* admin-tools.js - Google Sheets Versiyonu */

(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyfxBUq0d-sj315o5a_tgS76h0hDMvJKwFhrGzdnGJXKHDKp9oabootgeyCn9QQJ_2fdw/exec"; 

  // --- Araçları Listele ---
  async function fetchTools() {
    const tbody = document.getElementById('tools-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
      const res = await fetch(`${API_URL}?type=tools`);
      const data = await res.json();
      
      // Backend yapısına göre array kontrolü
      const tools = Array.isArray(data) ? data : (data.tools || []);

      tbody.innerHTML = '';
      if(tools.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Araç bulunamadı.</td></tr>';
        return;
      }

      tools.forEach(tool => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align:center; font-size:1.2rem;"><i class="${tool.icon}"></i></td>
          <td style="font-weight:600;">${tool.title}</td>
          <td style="color:#94a3b8; font-size:0.9rem;">${tool.link}</td>
          <td>
            <button class="action-btn btn-delete" onclick="alert('Silmek için Google Sheet > Tools sayfasını kullanın.')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch(err) {
      console.error(err);
    }
  }

  // --- Yeni Araç Ekle ---
  window.addTool = async () => {
    const title = document.getElementById('tool-title').value;
    const icon = document.getElementById('tool-icon').value;
    const link = document.getElementById('tool-link').value;

    if (!title || !link) {
      alert('Başlık ve Link zorunludur.');
      return;
    }

    const btn = document.querySelector('#tools-manager button[onclick*="addTool"]');
    const oldText = btn.textContent;
    btn.textContent = "Ekleniyor...";
    btn.disabled = true;

    try {
      const toolData = {
        action: "add_tool",
        title: title,
        icon: icon,
        link: link
      };

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolData)
      });

      alert("✅ Araç Eklendi!");
      
      // Formu temizle
      document.getElementById('tool-title').value = '';
      document.getElementById('tool-icon').value = '';
      document.getElementById('tool-link').value = '';

      // Listeyi yenile
      setTimeout(fetchTools, 1500);

    } catch (error) {
      alert("Hata: " + error);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  };

  // Başlangıçta listele
  document.addEventListener('DOMContentLoaded', fetchTools);
})();
