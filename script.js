document.addEventListener('DOMContentLoaded', () => {

  // ======================================================
  // BÖLÜM 1: GÖRSEL EFEKTLER
  // ======================================================

  // 1. Scroll Reveal (Aşağı indikçe belirme efekti)
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  });
  
  // Mevcut gizli elementleri izle
  document.querySelectorAll('.hidden').forEach((el) => scrollObserver.observe(el));

  // 2. Mobil Menü (Hamburger Butonu)
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // 3. İlerleme Çubuğu ve Yukarı Çık Butonu
  window.addEventListener('scroll', () => {
    // İlerleme çubuğu
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar && scrollHeight > 0) progressBar.style.width = (scrollTop / scrollHeight) * 100 + "%";

    // Yukarı çık butonu
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      if (scrollTop > 300) backToTop.classList.add('active');
      else backToTop.classList.remove('active');
    }
  });

  // 4. Daktilo Efekti (Typewriter)
  const TxtType = function (el, toRotate, period) {
    this.toRotate = Array.isArray(toRotate) ? toRotate : [];
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.isDeleting = false;
    this.wrap = document.createElement('span');
    this.wrap.className = 'wrap';
    this.el.textContent = '';
    this.el.appendChild(this.wrap);
    this.tick();
  };

  TxtType.prototype.tick = function () {
    if (!this.toRotate.length) return;
    const i = this.loopNum % this.toRotate.length;
    const fullTxt = String(this.toRotate[i] || '');

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.wrap.textContent = this.txt;

    let delta = 200 - Math.random() * 100;
    if (this.isDeleting) delta /= 2;

    if (!this.isDeleting && this.txt === fullTxt) {
      delta = this.period;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.loopNum++;
      delta = 500;
    }

    setTimeout(() => this.tick(), delta);
  };

  const elements = document.getElementsByClassName('typewrite');
  for (let i = 0; i < elements.length; i++) {
    const toRotateStr = elements[i].getAttribute('data-type');
    const period = elements[i].getAttribute('data-period');
    if (toRotateStr) {
      try {
        const parsed = JSON.parse(toRotateStr);
        new TxtType(elements[i], parsed, period);
      } catch {}
    }
  }


  // ======================================================
  // BÖLÜM 2: BLOG VERİLERİNİ ÇEKME (Google Sheets API)
  // ======================================================

  // Senin Google Apps Script Linkin:
  const API_URL = "https://script.google.com/macros/s/AKfycbxUGvzYVuU3UG7Q_5jWSUddJ8BzeEWKNNXsyFWk4tQYqyQo36IWphxwVv-NMxg0y5rQLQ/exec"; 

  const blogContainer = document.getElementById("blog-listesi-container");

  if (blogContainer) {
      // Yükleniyor mesajı
      blogContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;">Veriler yükleniyor...</div>';

      fetch(API_URL)
          .then(response => response.json())
          .then(data => {
              // Kutuyu temizle
              blogContainer.innerHTML = "";
              
              if (!data || data.length === 0) {
                  blogContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Henüz yazı eklenmemiş.</div>';
                  return;
              }

              // En yeni yazı en üstte olsun
              data.reverse().forEach(yazi => {
                  
                  // Resim kontrolü (Yoksa varsayılan resim)
                  const resimUrl = (yazi.resim && yazi.resim.length > 10) 
                      ? yazi.resim 
                      : 'https://placehold.co/600x400/1e293b/FFF?text=Blog';

                  // İçerik temizleme (HTML etiketlerini kaldırıp özet alma)
                  const temizIcerik = stripHtml(yazi.icerik).substring(0, 120) + '...';

                  // Kart HTML'i (Senin 'glass' tasarımına uygun)
                  const yaziKarti = `
                      <article class="blog-card glass hidden" style="display:flex; flex-direction:column; overflow:hidden;">
                          <div class="blog-img" style="height:200px; width:100%; overflow:hidden;">
                             <img src="${resimUrl}" alt="${yazi.baslik}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s;">
                          </div>
                          <div class="blog-content" style="padding:20px; flex:1; display:flex; flex-direction:column;">
                              <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">
                                  <i class="fa-regular fa-calendar"></i> ${yazi.tarih ? yazi.tarih.split(' ')[0] : ''}
                              </div>
                              <h3 style="color:#fff; margin-bottom:10px; font-size:1.2rem;">${yazi.baslik}</h3>
                              <p style="color:#cbd5e1; font-size:0.95rem; line-height:1.6; flex:1;">${temizIcerik}</p>
                              <a href="#" class="read-more" style="color:#60a5fa; text-decoration:none; margin-top:15px; font-weight:500; display:inline-flex; align-items:center; gap:5px;">
                                  Devamını Oku <i class="fa-solid fa-arrow-right"></i>
                              </a>
                          </div>
                      </article>
                  `;
                  
                  blogContainer.innerHTML += yaziKarti;
              });

              // Yeni eklenen kartları animasyon sistemine tanıt (Scroll Reveal)
              const newHiddenElements = blogContainer.querySelectorAll('.hidden');
              newHiddenElements.forEach((el) => scrollObserver.observe(el));

          })
          .catch(error => {
              console.error("Veri çekme hatası:", error);
              blogContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#ef4444;">Yazılar yüklenirken bir hata oluştu.</div>';
          });
  }

  // Yardımcı Fonksiyon: HTML etiketlerini temizler (Özetin düzgün görünmesi için)
  function stripHtml(html) {
      let tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
  }

});
