document.addEventListener('DOMContentLoaded', () => {

  // --- GÖRSEL EFEKTLER (Scroll Reveal) ---
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  });
  document.querySelectorAll('.hidden').forEach((el) => scrollObserver.observe(el));

  // --- MOBİL MENÜ ---
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // --- BLOG SİSTEMİ (Google Sheets) ---
  const API_URL = "https://script.google.com/macros/s/AKfycbw7uo2RD9hF1sSBgtGq67w8bc_x2FRVkJeD9V5ZndKyeSLr0ipgIu4XxlX-gT7PlM35ng/exec"; 
  const blogContainer = document.getElementById("blog-listesi-container");

  if (blogContainer) {
      blogContainer.innerHTML = '<div style="width:100%; text-align:center; padding:40px; color:#94a3b8;">Veriler yükleniyor...</div>';

      fetch(`${API_URL}?type=posts`)
          .then(response => response.json())
          .then(data => {
              const posts = data.posts || (data.ok ? data.posts : []);
              blogContainer.innerHTML = "";
              
              if (!posts || posts.length === 0) {
                  blogContainer.innerHTML = '<div style="width:100%; text-align:center; padding:20px;">Henüz yazı eklenmemiş.</div>';
                  return;
              }

              // En yeni en üstte
              posts.reverse().forEach(yazi => {
                  const resimUrl = (yazi.resim && yazi.resim.length > 5) 
                      ? yazi.resim 
                      : 'https://placehold.co/600x400/1e293b/FFF?text=Blog';

                  const ozetMetni = yazi.ozet || stripHtml(yazi.icerik).substring(0, 120) + '...';

                  const yaziKarti = `
                      <article class="blog-card glass hidden">
                          <div class="blog-thumb">
                             <img src="${resimUrl}" alt="${yazi.baslik}" style="width:100%; height:100%; object-fit:cover;">
                          </div>
                          <div class="blog-content">
                              <div class="blog-category">${yazi.kategori || 'Genel'}</div>
                              <h3 class="blog-title">${yazi.baslik}</h3>
                              <p class="blog-desc">${ozetMetni}</p>
                              <a href="blog-detay.html?id=${yazi.id}" class="btn-read">Devamını Oku</a>
                          </div>
                      </article>
                  `;
                  blogContainer.innerHTML += yaziKarti;
              });

              // Animasyonları tetikle
              const newHiddenElements = blogContainer.querySelectorAll('.hidden');
              newHiddenElements.forEach((el) => scrollObserver.observe(el));
          })
          .catch(error => {
              console.error("Hata:", error);
              blogContainer.innerHTML = '<div style="width:100%; text-align:center; color:#ef4444;">Veri çekilemedi.</div>';
          });
  }

  function stripHtml(html) {
      let tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
  }
});
