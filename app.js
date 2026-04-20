lucide.createIcons();

/* ── Smooth scrolling (Lenis) ── */
const lenis = new Lenis({
  duration: 1.25,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Sync Lenis with ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

/* ── Anchor scroll via Lenis ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -40, duration: 1.4 });
    const mm = document.getElementById('mobileMenu');
    if (mm && mm.classList.contains('open')) mm.classList.remove('open');
  });
});

/* ── Navbar scroll state ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}, { passive: true });

/* ── Scroll progress bar ── */
const progress = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  progress.style.width = pct + '%';
}, { passive: true });

/* ── Mobile menu ── */
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}



/* ── Magnetic buttons ── */
document.querySelectorAll('.magnetic').forEach(el => {
  const strength = 18;
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x / rect.width * strength, y: y / rect.height * strength, duration: 0.4, ease: 'power3.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  });
});

/* ── Entregáveis tabs ── */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    if (btn.classList.contains('active')) return;
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      // re-animate panel blocks on tab change
      gsap.fromTo(target.querySelectorAll('.panel-block'),
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'power3.out' }
      );
    }
  });
});

/* ═══════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {

  /* ── Hero title reveal (line-by-line) ── */
  const heroLines = document.querySelectorAll('.hero-title .line-inner');
  gsap.to(heroLines, {
    y: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'power4.out',
    delay: 0.2,
  });

  /* ── Other hero reveals ── */
  gsap.fromTo('.reveal',
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.5 }
  );

  /* ── Section titles: split + reveal on scroll ── */
  document.querySelectorAll('.reveal-title').forEach(el => {
    const split = new SplitType(el, { types: 'lines,words', lineClass: 'st-line', wordClass: 'st-word' });

    // wrap lines in overflow hidden containers
    split.lines.forEach(line => {
      const wrap = document.createElement('span');
      wrap.style.display = 'block';
      wrap.style.overflow = 'hidden';
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
    });

    gsap.set(el, { opacity: 1 });
    gsap.fromTo(split.lines,
      { y: '110%' },
      {
        y: '0%',
        duration: 1.1,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        }
      }
    );
  });



  /* ── Hero preview parallax + float tilt ── */
  const heroPreview = document.querySelector('.hero-preview');
  if (heroPreview) {
    gsap.from('.hero-preview-frame', {
      y: 60, opacity: 0, duration: 1.4, ease: 'power3.out', delay: 0.9
    });
    gsap.from('.hero-preview-float', {
      y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 1.3
    });
    // subtle float tilt on mouse move
    heroPreview.addEventListener('mousemove', (e) => {
      const rect = heroPreview.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to('.hero-preview-frame', {
        rotationY: x * 4,
        rotationX: -y * 4,
        transformPerspective: 1200,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
    heroPreview.addEventListener('mouseleave', () => {
      gsap.to('.hero-preview-frame', {
        rotationY: 0, rotationX: 0, duration: 0.8, ease: 'power3.out'
      });
    });
    // Parallax entrance for floats on scroll
    gsap.to('.hero-float-1', {
      y: -20, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-float-2', {
      y: 20, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── Processo timeline ── */
  gsap.from('.processo-step', {
    scrollTrigger: { trigger: '.processo-timeline', start: 'top 80%' },
    y: 50, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out'
  });
  gsap.from('.processo-step-num', {
    scrollTrigger: { trigger: '.processo-timeline', start: 'top 80%' },
    scale: 0.7, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'back.out(1.2)'
  });

  /* ── Posicionamento body ── */
  gsap.from('.pos-body .desc, .pos-body .traits .trait', {
    scrollTrigger: { trigger: '.posicionamento', start: 'top 70%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out'
  });

  gsap.from('.pos-quote', {
    scrollTrigger: { trigger: '.pos-quote', start: 'top 80%' },
    scale: 0.96, opacity: 0, duration: 1.1, ease: 'power3.out'
  });

  gsap.from('.pos-signal', {
    scrollTrigger: { trigger: '.pos-signal-grid', start: 'top 85%' },
    y: 24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out'
  });

  /* ── Pilares ── */
  gsap.from('.pilar-card', {
    scrollTrigger: { trigger: '.pilar-grid', start: 'top 80%' },
    y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out'
  });

  /* ── Entregáveis background parallax ── */
  gsap.to('#entregaveis-bg-img', {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.entregaveis',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });

  /* ── Entregáveis tabs + panel fade ── */
  gsap.from('.entregaveis-tabs .tab-btn', {
    scrollTrigger: { trigger: '.entregaveis-tabs', start: 'top 85%' },
    y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out'
  });

  gsap.from('.panel.active .panel-block', {
    scrollTrigger: { trigger: '.entregaveis-panels', start: 'top 80%' },
    y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out'
  });

  /* ── Filosofia visual reveal ── */
  gsap.from('.filosofia-visual', {
    scrollTrigger: { trigger: '.filosofia', start: 'top 75%' },
    scale: 0.94, opacity: 0, duration: 1.2, ease: 'power3.out'
  });
  gsap.to('.filosofia-img', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: '.filosofia',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
  gsap.from('.filosofia-content .desc, .filosofia-content .principio', {
    scrollTrigger: { trigger: '.filosofia', start: 'top 70%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out'
  });

  /* ── Mentoria items ── */
  gsap.from('.mentoria-item', {
    scrollTrigger: { trigger: '.mentoria-grid', start: 'top 80%' },
    y: 50, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out'
  });
  gsap.from('.mentoria-intro, .mentoria-header .btn', {
    scrollTrigger: { trigger: '.mentoria', start: 'top 75%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out'
  });

  /* ── Resultados cards ── */
  gsap.from('.resultado-card', {
    scrollTrigger: { trigger: '.resultados-grid', start: 'top 80%' },
    y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out'
  });

  gsap.from('.resultados-quote', {
    scrollTrigger: { trigger: '.resultados-quote', start: 'top 80%' },
    y: 30, opacity: 0, duration: 1.1, ease: 'power3.out'
  });

  /* ── Contato ── */
  gsap.from('.contato-desc, .contato-actions, .contato-meta-item', {
    scrollTrigger: { trigger: '.contato', start: 'top 75%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out'
  });

  /* ── Footer fade in ── */
  gsap.from('.footer-top > *, .footer-bottom > *', {
    scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    y: 20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out'
  });

  // Refresh ScrollTrigger after everything renders
  setTimeout(() => ScrollTrigger.refresh(), 200);
});

// Recreate lucide icons for anything injected later
window.addEventListener('load', () => {
  lucide.createIcons();
});
