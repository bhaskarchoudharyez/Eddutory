/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO — script.js
   Handles: lightbox · filters · scroll effects · counter · nav
   ═══════════════════════════════════════════════════════════════ */

/* ── HELPERS ─────────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── NAV — scroll shadow + hamburger ────────────────────────── */
const navbar   = $('#navbar');
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link is clicked
$$('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* ── SCROLL-REVEAL ───────────────────────────────────────────── */
const revealEls = $$('.reveal');
const revealObs = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }),
  { threshold: 0.12 }
);
revealEls.forEach(el => revealObs.observe(el));

/* ── ANIMATED STAT COUNTERS ──────────────────────────────────── */
const statEls = $$('.stat-num[data-target]');

function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current);
  }, step);
}

const counterObs = new IntersectionObserver(
  (entries) => entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); counterObs.unobserve(e.target); }
  }),
  { threshold: 0.5 }
);
statEls.forEach(el => counterObs.observe(el));

/* ── PROJECT FILTER ──────────────────────────────────────────── */
const filterBtns = $$('.filter-btn');
const projectCards = $$('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    projectCards.forEach(card => {
      const types = card.dataset.type || '';           // e.g. "video commercial"
      const match = filter === 'all' || types.split(' ').includes(filter);
      card.classList.toggle('hidden', !match);

      // Featured card: if hidden, it would leave a gap — handle gracefully
      if (filter !== 'all') card.classList.remove('featured');
      else card.classList.toggle('featured', card.dataset.featured !== undefined || [...card.classList].includes('featured'));
    });
  });
});

// Re-apply featured class properly on init
$$('.project-card.featured').forEach(c => c.dataset.wasFeatured = 'true');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    projectCards.forEach(card => {
      if (filter === 'all' && card.dataset.wasFeatured) card.classList.add('featured');
    });
  });
});

/* ── LIGHTBOX ────────────────────────────────────────────────── */
const lightbox      = $('#lightbox');
const lightboxInner = $('#lightboxInner');
const lightboxClose = $('#lightboxClose');

/**
 * Convert any YouTube / Vimeo URL → embeddable iframe src.
 * Falls back to the raw URL (for direct .mp4 links).
 */
function toEmbedUrl(url) {
  if (!url) return null;

  // YouTube formats:
  //   https://www.youtube.com/watch?v=ID
  //   https://youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Vimeo formats:
  //   https://vimeo.com/ID
  //   https://player.vimeo.com/video/ID
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) {
    return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
  }

  // Direct video file
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return url;

  return url; // unknown — pass through
}

function openLightbox(card) {
  const videoUrl = card.dataset.video;
  const imageUrl = card.dataset.image;

  lightboxInner.innerHTML = '';

  if (videoUrl) {
    const embedUrl = toEmbedUrl(videoUrl);
    if (embedUrl && !embedUrl.match(/\.(mp4|webm|ogg)/i)) {
      // Iframe (YouTube / Vimeo)
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      lightboxInner.appendChild(iframe);
    } else {
      // Native <video> for direct files
      const video = document.createElement('video');
      video.src = embedUrl || videoUrl;
      video.controls = true;
      video.autoplay = true;
      lightboxInner.appendChild(video);
    }
  } else if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = card.querySelector('.project-title')?.textContent || 'Project image';
    lightboxInner.appendChild(img);
  } else {
    lightboxInner.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--muted)">
        <p style="font-size:2rem;margin-bottom:1rem">🎬</p>
        <p>No media URL set for this project.</p>
        <p style="font-size:.8rem;margin-top:.5rem">Add a URL to the <code>data-video</code> or <code>data-image</code> attribute in index.html</p>
      </div>`;
  }

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxInner.innerHTML = '';          // stops video/audio
  document.body.style.overflow = '';
}

// Open on card click
projectCards.forEach(card => {
  card.addEventListener('click', () => openLightbox(card));
});

// Close buttons / outside click
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

/* ── CONTACT FORM ────────────────────────────────────────────── */
const contactForm   = $('#contactForm');
const formSuccess   = $('#formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Simple validation
  let valid = true;
  ['fname', 'femail', 'fmessage'].forEach(id => {
    const el = $(`#${id}`);
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });
  const emailEl = $('#femail');
  if (emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  /*
    TO ACTUALLY SEND EMAILS:
    Replace the block below with a fetch() call to your backend or a
    service like Formspree, EmailJS, or Netlify Forms.

    Example with Formspree:
      const data = new FormData(contactForm);
      fetch('https://formspree.io/f/YOUR_FORM_ID', { method:'POST', body: data });

    Example with EmailJS:
      emailjs.sendForm('SERVICE_ID','TEMPLATE_ID', contactForm);
  */

  // Simulated success for demo
  contactForm.reset();
  formSuccess.classList.add('show');
  setTimeout(() => formSuccess.classList.remove('show'), 5000);
});

// Remove error state on input
$$('.form-group input, .form-group textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});

/* ── ADD reveal CLASS TO SECTIONS ON LOAD ────────────────────── */
// Sections and cards auto-animate on scroll
document.addEventListener('DOMContentLoaded', () => {
  const toReveal = [
    '.hero-content',
    '.about-inner',
    '.project-card',
    '.skill-card',
    '.gear-item',
    '.cta-section h2',
    '.cta-section .cta-sub',
    '.contact-form',
  ];
  toReveal.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.07}s`;
      revealObs.observe(el);
    });
  });
});
