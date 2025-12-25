document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = "https://script.google.com/macros/s/AKfycbwtiUrv7lemb76DBO7AYjGDchwu1SDB-B7l2QA1FHI3ruG1FfS56Z-qrxvBkaba1KeMpg/exec";
  
  const container = document.getElementById('standard-container');
  const featuredContainer = document.getElementById('featured-container');

  if(container) container.innerHTML = "<p style='color:white;text-align:center'>Yükleniyor...</p>";

  try {
    const res = await fetch(`${API_URL}?type=posts`);
    const data = await res.json();
    const posts = data.posts || [];

    // Sadece Yayında olanlar
    const activePosts = posts.filter(p => p.durum === "Yayında");
    
    if(container) container.innerHTML = "";
    if(featuredContainer) featuredContainer.innerHTML = "";
    
    if(activePosts.length === 0 && container) {
        container.innerHTML = "<p style='color:#94a3b8;text-align:center'>Henüz yazı yok.</p>";
        return;
    }

    activePosts.forEach(post => {
      const isFeatured = (String(post.one_cikan).toLowerCase() === "true");
      const target = isFeatured && featuredContainer ? featuredContainer : container;
      if(!target) return;

      const dateStr = post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : '';
      
      // Resim URL mi yoksa FontAwesome Class mı?
      let mediaHtml = "";
      if(post.resim && post.resim.startsWith("http")) {
         mediaHtml = `<img src="${post.resim}" alt="${post.baslik}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
      } else {
         mediaHtml = `<i class="${post.resim || 'fa-solid fa-pen'}" style="font-size:2rem; color:#3b82f6;"></i>`;
      }
      
      // Kategori Rengi
      let catColor = "cat-blue";
      if(post.kategori === "Felsefe") catColor = "cat-purple";
      if(post.kategori === "Teknoloji") catColor = "cat-green";

      const html = `
        <article class="blog-card glass ${!isFeatured ? '' : 'featured-card'}">
            <div class="blog-thumb" style="${post.resim.startsWith('http')?'padding:0; background:none':''}">
                ${mediaHtml}
            </div>
            <div class="blog-content">
                <div class="meta">
                    <span class="category ${catColor}">${post.kategori}</span>
                    <span class="date">${dateStr}</span>
                </div>
                <h3>${post.baslik}</h3>
                ${isFeatured ? `<p>${post.ozet || ''}</p>` : ''}
                <a href="blog-detay.html?id=${post.id}" class="btn-read-modern">Oku <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        </article>
      `;
      target.innerHTML += html;
    });

    // Scroll Animasyonu
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('show'); });
    });
    document.querySelectorAll('.blog-card').forEach(el => observer.observe(el));

  } catch(e) {
    console.error(e);
    if(container) container.innerHTML = "<p style='color:red;text-align:center'>Veriler yüklenemedi.</p>";
  }
});
