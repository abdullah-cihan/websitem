document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // SİTE GÖRÜNÜM AYARLARI (Gerekli Kısım)
  // ==========================================

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
});
