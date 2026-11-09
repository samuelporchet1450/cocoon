/* =========================================================
   COCOON · compte à rebours, animations, motifs
   ========================================================= */

/* ---- Date de l'événement : samedi 28 novembre 2026, 9h00 (heure suisse) ---- */
const EVENT_START = new Date('2026-11-28T09:00:00+01:00');
const EVENT_END   = new Date('2026-11-28T17:00:00+01:00');

/* ---------- Compte à rebours ---------- */
(() => {
  const root = document.getElementById('countdown');
  const done = document.getElementById('countdown-done');
  const els = {};
  root.querySelectorAll('.cd-num').forEach(n => (els[n.dataset.unit] = n));
  const pad = n => String(n).padStart(2, '0');

  function setNum(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove('tick');
    void el.offsetWidth; // relance l'animation
    el.classList.add('tick');
  }

  function update() {
    const now = Date.now();
    let diff = EVENT_START - now;

    if (diff <= 0) {
      root.hidden = true;
      done.hidden = false;
      done.textContent = now < EVENT_END ? 'C’est aujourd’hui !' : 'Merci pour votre visite !';
      return false;
    }

    const s = Math.floor(diff / 1000);
    setNum(els.d, pad(Math.floor(s / 86400)));
    setNum(els.h, pad(Math.floor((s % 86400) / 3600)));
    setNum(els.m, pad(Math.floor((s % 3600) / 60)));
    setNum(els.s, pad(s % 60));
    return true;
  }

  if (update()) {
    // Cale chaque mise à jour sur le début de la seconde suivante
    const loop = () => { if (update()) setTimeout(loop, 1000 - (Date.now() % 1000) + 5); };
    setTimeout(loop, 1000 - (Date.now() % 1000) + 5);
  }
})();

/* ---------- Barre du haut : fond au scroll ---------- */
(() => {
  const bar = document.querySelector('.topbar');
  const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Apparition des blocs au scroll ---------- */
(() => {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  items.forEach(i => io.observe(i));
})();

/* ---------- Motif « mascotte » de la charte (section équipe) ---------- */
(() => {
  const host = document.querySelector('.team__pattern');
  if (!host) return;
  const D = 'M0 0 C9.626 0 16.22 -6.788 16.22 -15.83 C16.22 -24.872 9.626 -31.661 0 -31.661 C-9.626 -31.661 -16.192 -24.872 -16.192 -15.83 C-16.192 -6.788 -9.626 0 0 0 M-17.75 -36.655 C-15.765 -38.531 -15.77 -41.806 -17.763 -43.674 C-23.037 -48.614 -26.18 -55.879 -26.18 -64.295 C-26.18 -67.514 -25.761 -70.532 -24.945 -73.296 C-23.976 -76.576 -20.191 -77.904 -17.34 -76.016 C-17.301 -75.99 -17.262 -75.965 -17.223 -75.939 C-15.341 -74.705 -14.684 -72.301 -15.387 -70.162 C-15.921 -68.539 -16.192 -66.806 -16.192 -64.963 C-16.192 -55.476 -9.543 -48.743 0 -48.743 C9.571 -48.743 16.22 -55.476 16.22 -64.963 C16.22 -66.801 15.95 -68.538 15.419 -70.164 C14.719 -72.312 15.373 -74.726 17.261 -75.967 C17.29 -75.986 17.319 -76.005 17.348 -76.024 C20.197 -77.912 23.98 -76.6 24.958 -73.325 C25.781 -70.568 26.208 -67.566 26.208 -64.378 C26.208 -55.897 23.048 -48.601 17.766 -43.664 C15.776 -41.803 15.769 -38.532 17.752 -36.663 C23.019 -31.696 26.18 -24.355 26.18 -15.83 C26.18 0.167 15.051 11.88 0 11.88 C-15.051 11.88 -26.18 0.167 -26.18 -15.83 C-26.18 -24.351 -23.006 -31.687 -17.75 -36.655';
  // [x %, y %, taille px, rotation°]
  const spots = [[-4, 4, 150, -24], [86, 2, 120, 32], [92, 46, 170, 140], [-6, 58, 130, 70], [70, 86, 140, -40], [18, 92, 110, 200]];
  host.innerHTML = spots.map(([x, y, s, r]) =>
    `<svg viewBox="-30 -16 60 98" style="left:${x}%;top:${y}%;width:${s}px;height:${s * 1.63}px;transform:rotate(${r}deg)">` +
    `<path d="${D}" transform="scale(1 -1)"/></svg>`).join('');
})();

/* ---------- Secours : si la 3D ne se charge pas, on montre la photo ---------- */
setTimeout(() => {
  const ball = document.getElementById('ball');
  if (ball && !ball.classList.contains('is-3d')) ball.classList.add('no-3d');
}, 4000);
