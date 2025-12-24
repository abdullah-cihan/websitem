document.addEventListener('DOMContentLoaded', () => {

  // ======================================================
  // BÖLÜM 1: GÖRSEL EFEKTLER (Mevcut Kodlarınız)
  // ======================================================

  // 1. Scroll Reveal (Aşağı indikçe belirme efekti)
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    });
    document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));
  }, 100);

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
  // BÖLÜM 2: BLOG VERİLERİNİ ÇEKME (Yeni Kısım)
  // ======================================================

  // Lütfen Google Apps Script'ten aldığınız uzun linki buraya yapıştırın:
  const API_URL = "https://script.google.com/macros/s/AKfycbxUGvzYVuU3UG7Q_5jWSUddJ8BzeEWKNNXsyFWk4tQYqyQo36IWphxwVv-NMxg0y5rQLQ/exec"; 

  // Blog yazılarının listeleneceği HTML kutusunu seçiyoruz
  // HTML dosyanızda <div id="blog-listesi-container"></div> gibi bir alan olmalı
  const blogContainer = document.getElementById("blog-listesi-container") || document.querySelector(".blog-grid");

  if (blogContainer) {
      // Yükleniyor mesajı göster
      blogContainer.innerHTML = '<p style="text-align:center; padding:20px;">Yazılar yükleniyor...</p>';

      fetch(API_URL)
          .then(response => response.json())
          .then(data => {
              // Veriler geldi, önce kutuyu temizle
              blogContainer.innerHTML = "";
              
              if (data.length === 0) {
                  blogContainer.innerHTML = "<p>Henüz yazı eklenmemiş.</p>";
                  return;
              }

              // Yazıları tersten sırala (En yeni en üstte)
              data.reverse().forEach(yazi => {
                  // Her yazı için bir HTML kartı oluştur
                  // Sizin CSS sınıflarınıza göre buradaki class isimlerini değiştirebilirsiniz
                  const yaziKarti = `
                      <div class="blog-card hidden" style="border:1px solid #333; margin-bottom:20px; border-radius:8px; overflow:hidden; background:#1e1e1e;">
                          <div class="blog-image" style="height:200px; overflow:hidden;">
                             <img src="${yazi.resim || 'assets/img/varsayilan.jpg'}" alt="${yazi.baslik}" style="width:100%; height:100%; object-fit:cover;">
                          </div>
                          <div class="blog-content" style="padding:15px;">
                              <h3 style="color:#fff; margin-bottom:10px;">${yazi.baslik}</h3>
                              <p style="color:#ccc; font-size:0.9em;">${yazi.icerik.substring(0, 120)}...</p>
                              <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                                  <small style="color:#777;">${yazi.tarih ? yazi.tarih.split(' ')[0] : ''}</small>
                                  <a href="#" class="btn-read-more" style="color:#4a90e2; text-decoration:none;">Devamını Oku &rarr;</a>
                              </div>
                          </div>
                      </div>
                  `;
                  
                  blogContainer.innerHTML += yaziKarti;
              });

              // Sonradan eklenen kartlar için animasyonu tetikle (Scroll Reveal)
              const hiddenElements = document.querySelectorAll('.hidden');
              const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                      if(entry.isIntersecting) entry.target.classList.add('show');
                  });
              });
              hiddenElements.forEach((el) => observer.observe(el));

          })
          .catch(error => {
              console.error("Veri çekme hatası:", error);
              blogContainer.innerHTML = '<p style="text-align:center; color:red;">Yazılar yüklenirken bir hata oluştu.</p>';
          });
  }

});
