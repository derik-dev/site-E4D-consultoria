const WHATSAPP_NUMBER = '5521996006835';
const WHATSAPP_MESSAGE = 'Ola! Vim pelo site da E4D Consultoria e gostaria de agendar um diagnostico.';
const WHATSAPP_URL = buildWhatsAppUrl();
const EMAIL_ENDPOINT = 'send-email.php';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SCRIPT_URLS = {
  lucide: 'https://unpkg.com/lucide@latest',
  lenis: 'https://unpkg.com/@studio-freight/lenis@1.0.34/dist/lenis.min.js',
  gsap: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  scrollTrigger: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  splitType: 'https://unpkg.com/split-type',
  chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
};

const loadedScripts = new Map();

function buildWhatsAppUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function loadScript(src) {
  if (loadedScripts.has(src)) return loadedScripts.get(src);

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    const promise = new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
    loadedScripts.set(src, promise);
    return promise;
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  loadedScripts.set(src, promise);
  return promise;
}

function runWhenIdle(callback, delay = 900) {
  const run = () => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout: 2500 });
      } else {
        callback();
      }
    }, delay);
  };

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function loadLucideIcons() {
  if (window.lucide) {
    refreshIcons();
    return Promise.resolve();
  }
  return loadScript(SCRIPT_URLS.lucide).then(refreshIcons).catch(() => {});
}

function loadGoogleTagManager() {
  if (loadGoogleTagManager.done || !window.E4D_GTM_ID) return;
  loadGoogleTagManager.done = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${window.E4D_GTM_ID}`;
  document.head.appendChild(script);
}

function scheduleGoogleTagManager() {
  const loadOnce = () => {
    ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
      window.removeEventListener(eventName, loadOnce);
    });
    loadGoogleTagManager();
  };

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
    window.addEventListener(eventName, loadOnce, { once: true, passive: true });
  });

  runWhenIdle(loadGoogleTagManager, 2400);
}

scheduleGoogleTagManager();

function hasLeadConversionData(data = {}, requiredFields = []) {
  return requiredFields.every(field => data[field] && String(data[field]).trim());
}

function pushFormularioEnviadoEvent({ formName = 'contato', channel = 'formulario', data = {}, requiredFields = [] } = {}) {
  if (!hasLeadConversionData(data, requiredFields)) return;

  const payload = { formName, channel };

  if (typeof window.trackE4DLeadConversion === 'function') {
    window.trackE4DLeadConversion(payload);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'formulario_enviado',
    conversion_action: 'lead_form_submit',
    form_name: formName,
    lead_channel: channel
  });
}

/* ── Smooth scrolling (Lenis) ── */
const nativeSmoothScroll = (target) => {
  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
};

let lenis = {
  scrollTo: nativeSmoothScroll,
  stop() {},
  start() {},
  on() {},
};

function initLenis() {
  if (typeof window.Lenis !== 'function' || prefersReducedMotion || lenis.isEnabled) return;

  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });
  lenis.isEnabled = true;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
  }
}

/* ── Lead Modal → E-mail / WhatsApp ── */
const LEAD_MODAL_COPY = {
  email: {
    title: 'Fale com a E4D',
    description: 'Preencha os dados para enviar sua mensagem',
    submit: 'Enviar mensagem',
    icon: 'mail',
  },
  whatsapp: {
    title: 'Fale pelo WhatsApp',
    description: 'Preencha os dados antes de iniciar a conversa',
    submit: 'Continuar no WhatsApp',
    icon: 'message-circle',
  },
};

let leadModalChannel = 'email';

const waModal = document.getElementById('waModal');
const waModalClose = document.getElementById('waModalClose');
const waModalForm = document.getElementById('waModalForm');
const waModalIcon = document.getElementById('waModalIcon');
const waModalTitle = document.getElementById('waModalTitle');
const waModalDescription = document.getElementById('waModalDescription');
const waModalSubmitContent = document.getElementById('waModalSubmitContent');

function setLeadModalMode(channel = 'email') {
  const copy = LEAD_MODAL_COPY[channel] || LEAD_MODAL_COPY.email;
  leadModalChannel = channel;
  waModal.dataset.channel = channel;
  waModalTitle.textContent = copy.title;
  waModalDescription.textContent = copy.description;
  waModalIcon.innerHTML = `<i data-lucide="${copy.icon}" style="width:28px;height:28px;"></i>`;
  waModalSubmitContent.innerHTML = `${copy.submit} <i data-lucide="arrow-up-right"></i>`;
  loadLucideIcons();
}

function openWaModal(channel = 'email') {
  setLeadModalMode(channel);
  waModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  lenis.stop();
}

function closeWaModal() {
  waModal.classList.remove('open');
  document.body.style.overflow = '';
  lenis.start();
}

document.querySelectorAll('[data-lead-modal]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const mobileMenuEl = document.getElementById('mobileMenu');
    if (mobileMenuEl && mobileMenuEl.classList.contains('open')) mobileMenuEl.classList.remove('open');
    openWaModal(btn.dataset.leadModal || 'email');
  });
});

waModalClose.addEventListener('click', closeWaModal);

waModal.addEventListener('click', (e) => {
  if (e.target === waModal) closeWaModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && waModal.classList.contains('open')) closeWaModal();
});

function validateLeadModalForm() {
  const fields = Array.from(waModalForm.querySelectorAll('[required]'));
  let valid = true;
  let firstInvalid = null;

  fields.forEach(input => {
    if (!input.value.trim() || !input.checkValidity()) {
      input.classList.add('wa-error');
      valid = false;
      if (!firstInvalid) firstInvalid = input;
    } else {
      input.classList.remove('wa-error');
    }
  });

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.reportValidity();
  }
  return valid;
}

function getLeadModalData() {
  return {
    nome:     waModalForm.elements['nome'].value.trim(),
    email:    waModalForm.elements['email'].value.trim(),
    telefone: waModalForm.elements['telefone'].value.trim(),
    empresa:  waModalForm.elements['empresa'].value.trim(),
    mensagem: waModalForm.elements['mensagem'].value.trim(),
  };
}

function buildLeadMessage({ nome, email, telefone, empresa }) {
  return [
    'Olá Mateus,',
    '',
    'Vim pelo site da E4D Consultoria e gostaria de saber mais.',
    '',
    `Nome: ${nome}`,
    `E-mail: ${email}`,
    `Telefone: ${telefone}`,
    `Empresa: ${empresa}`,
  ].join('\n');
}

function openLeadWhatsApp(data) {
  window.open(buildWhatsAppUrl(buildLeadMessage(data)), '_blank', 'noopener');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function submitLeadToEmail(data) {
  const payload = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    payload.append(key, value || '');
  });

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetchWithTimeout(EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: payload,
      });

      const responseText = await res.text();
      let json = {};

      try {
        json = responseText ? JSON.parse(responseText) : {};
      } catch {
        json = {};
      }

      if (res.ok && (json.success === 'true' || json.success === true)) {
        return json;
      }

      lastError = new Error(json.message || json.detail || `HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < 3) await sleep(attempt * 1200);
  }

  throw lastError || new Error('Falha ao enviar formulario.');
}

const waModalSubmitBtn = waModalForm.querySelector('button[type="submit"]');
if (waModalSubmitBtn) {
  waModalSubmitBtn.addEventListener('click', (e) => {
    if (!validateLeadModalForm()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
}

waModalForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const valid = validateLeadModalForm();
  if (!valid) return;

  const data = getLeadModalData();

  if (leadModalChannel === 'whatsapp') {
    openLeadWhatsApp(data);
    pushFormularioEnviadoEvent({
      formName: 'modal_lead',
      channel: 'whatsapp',
      data,
      requiredFields: ['nome', 'email', 'telefone', 'empresa']
    });
    closeWaModal();
    waModalForm.reset();
    return;
  }

  const submitBtn = waModalForm.querySelector('button[type="submit"]');
  const originalHTML = submitBtn.innerHTML;
  const restoreSubmitButton = () => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
    loadLucideIcons();
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Enviando…</span>';

  try {
    await submitLeadToEmail(data);
    pushFormularioEnviadoEvent({
      formName: 'modal_lead',
      channel: 'email',
      data,
      requiredFields: ['nome', 'email', 'telefone', 'empresa']
    });
    submitBtn.innerHTML = '<span>Enviado ✓</span>';
    setTimeout(() => {
      closeWaModal();
      waModalForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      loadLucideIcons();
    }, 1500);
  } catch (error) {
    console.error('Falha ao enviar formulario de lead por e-mail:', error);

    const useWhatsApp = window.confirm(
      'Nao foi possivel enviar por e-mail agora. Deseja continuar pelo WhatsApp?'
    );

    if (useWhatsApp) {
      openLeadWhatsApp(data);
      pushFormularioEnviadoEvent({
        formName: 'modal_lead',
        channel: 'whatsapp_fallback',
        data,
        requiredFields: ['nome', 'email', 'telefone', 'empresa']
      });
      closeWaModal();
      waModalForm.reset();
    }

    restoreSubmitButton();
  }
});

/* ── WhatsApp float button ── */
const waFloat = document.getElementById('waFloat');
if (waFloat) {
  waFloat.href = WHATSAPP_URL;
  waFloat.target = '_blank';
  waFloat.rel = 'noopener';
  waFloat.addEventListener('click', (e) => {
    e.preventDefault();
    openWaModal('whatsapp');
  });
}

/* ── Anchor scroll via Lenis ── */
document.querySelectorAll('a[href^="#"]:not([data-lead-modal])').forEach(link => {
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
function initMagneticButtons() {
  if (!window.gsap || prefersReducedMotion || initMagneticButtons.done) return;
  initMagneticButtons.done = true;

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
}

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
      if (window.gsap && !prefersReducedMotion) {
        gsap.fromTo(target.querySelectorAll('.panel-block'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'power3.out' }
        );
      }
    }
  });
});

/* ═══════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════ */

function initAnimations() {
  if (initAnimations.done) return;
  initAnimations.done = true;

  if (!window.gsap || prefersReducedMotion) {
    document.querySelectorAll('.hero-title .line-inner').forEach(el => { el.style.transform = 'translateY(0)'; });
    document.querySelectorAll('.reveal-title').forEach(el => { el.style.opacity = '1'; });
    return;
  }

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

  if (!window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  if (lenis && lenis.isEnabled) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  /* ── Section titles: split + reveal on scroll ── */
  if (window.SplitType) {
    document.querySelectorAll('.reveal-title').forEach(el => {
      const split = new SplitType(el, { types: 'lines,words', lineClass: 'st-line', wordClass: 'st-word' });

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
  } else {
    gsap.set('.reveal-title', { opacity: 1 });
  }



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
  gsap.from('.pilares-left', {
    scrollTrigger: { trigger: '.pilares', start: 'top 80%' },
    x: -40, opacity: 0, duration: 1, ease: 'power3.out'
  });

  gsap.from('.pilar-row', {
    scrollTrigger: { trigger: '.pilares-right', start: 'top 85%' },
    y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
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
  gsap.from('.contato-desc, .contato-meta, .contato-form-card', {
    scrollTrigger: { trigger: '.contato', start: 'top 75%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out'
  });

  /* ── Footer fade in ── */
  gsap.from('.footer-top > *, .footer-bottom > *', {
    scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    y: 20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out'
  });

  // Refresh ScrollTrigger after everything renders
  setTimeout(() => ScrollTrigger.refresh(), 200);
}

function renderLineChart() {
  const canvas = document.getElementById('chart-linha');
  if (!canvas || !window.Chart || renderLineChart.done) return;
  renderLineChart.done = true;

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(201,168,76,0.22)');
  grad.addColorStop(1, 'rgba(201,168,76,0)');

  const linhaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['', 'Formação', '', 'Confronto', '', '', 'Normalização', '', '', '', 'Alta Performance', ''],
      datasets: [{
        label: 'Maturidade da equipe',
        data: [34, 38, 41, 32, 24, 30, 44, 58, 71, 84, 94, 98],
        borderColor: '#C9A84C',
        backgroundColor: grad,
        borderWidth: 2,
        fill: true,
        tension: 0.46,
        pointBackgroundColor: '#C9A84C',
        pointRadius: 3,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` Maturidade da equipe: ${c.parsed.y}/100` } }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tempo',
            color: 'rgba(13,24,46,0.65)',
            font: { family: 'Poppins', size: 11, weight: '600' },
            padding: { top: 10 }
          },
          grid: { display: false },
          ticks: { font: { family: 'Poppins', size: 10 }, color: 'rgba(13,24,46,0.45)' }
        },
        y: {
          min: 10,
          max: 100,
          title: {
            display: true,
            text: 'Resultado',
            color: 'rgba(13,24,46,0.65)',
            font: { family: 'Poppins', size: 11, weight: '600' },
            padding: { bottom: 10 }
          },
          grid: { color: 'rgba(13,24,46,0.05)' },
          ticks: { font: { family: 'Poppins', size: 10 }, color: 'rgba(13,24,46,0.45)', stepSize: 15, callback: v => v }
        }
      },
      animation: prefersReducedMotion ? false : { duration: 1200, easing: 'easeInOutQuart' }
    }
  });

  requestAnimationFrame(() => linhaChart.resize());
}

function initChartWhenVisible() {
  const canvas = document.getElementById('chart-linha');
  if (!canvas || initChartWhenVisible.done) return;
  initChartWhenVisible.done = true;

  const loadAndRender = () => loadScript(SCRIPT_URLS.chart).then(renderLineChart).catch(() => {});

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadAndRender();
    }, { rootMargin: '520px 0px' });
    observer.observe(canvas);
    return;
  }

  runWhenIdle(loadAndRender, 1800);
}

async function initEnhancements() {
  await loadLucideIcons();
  initChartWhenVisible();

  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal-title').forEach(el => { el.style.opacity = '1'; });
    return;
  }

  try {
    await loadScript(SCRIPT_URLS.lenis);
    initLenis();
    await loadScript(SCRIPT_URLS.gsap);
    await loadScript(SCRIPT_URLS.scrollTrigger);
    await loadScript(SCRIPT_URLS.splitType);
    initMagneticButtons();
    initAnimations();
  } catch {
    document.querySelectorAll('.reveal-title').forEach(el => { el.style.opacity = '1'; });
  }
}

runWhenIdle(initEnhancements, 1400);

/* ── Formulário de contato → E-mail ── */
const contatoForm = document.getElementById('contato-form');
if (contatoForm) {
  const submitBtn = contatoForm.querySelector('button[type="submit"]');
  const originalBtnHTML = submitBtn.innerHTML;

  submitBtn.addEventListener('click', (e) => {
    if (!contatoForm.checkValidity()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      contatoForm.reportValidity();
    }
  });

  contatoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contatoForm.checkValidity()) {
      contatoForm.reportValidity();
      return;
    }

    const servicos = Array.from(contatoForm.querySelectorAll('input[name="servico"]:checked'))
      .map(cb => cb.value).join(', ') || '—';

    const nome     = contatoForm.elements['nome'].value.trim();
    const email    = contatoForm.elements['email'].value.trim();
    const telefone = contatoForm.elements['telefone'].value.trim();
    const cargo    = contatoForm.elements['cargo'].value.trim();
    const website  = contatoForm.elements['website'].value.trim();
    const segmento = contatoForm.elements['segmento'].value.trim();
    const mensagem = contatoForm.elements['mensagem'].value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Enviando…</span>';

    try {
      await submitLeadToEmail({ nome, email, telefone, cargo, website, segmento, servicos, mensagem });
      pushFormularioEnviadoEvent({
        formName: 'formulario_contato',
        channel: 'email',
        data: { nome, email, telefone, cargo, segmento },
        requiredFields: ['nome', 'email', 'telefone', 'cargo', 'segmento']
      });
      submitBtn.innerHTML = '<span>Enviado ✓</span>';
      contatoForm.reset();
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    } catch (error) {
      console.error('Falha ao enviar formulario de contato por e-mail:', error);
      window.alert('Nao foi possivel enviar sua mensagem agora. Tente novamente em alguns minutos ou fale pelo WhatsApp.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
