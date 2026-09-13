// Dynamic year in masthead
document.getElementById('year').textContent = new Date().getFullYear();

// Hover-preview: swap the large image and nudge the "physical" tilt
const rows = document.querySelectorAll('.contents__row');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('preview-image');

rows.forEach(row => {
  row.addEventListener('mouseenter', () => {
    const src = row.getAttribute('data-preview');
    if (!src) return;

    previewImage.classList.remove('is-loaded');
    preview.classList.add('is-active');

    // preload, then fade in once ready
    const img = new Image();
    img.onload = () => {
      previewImage.src = src;
      previewImage.classList.add('is-loaded');
    };
    img.src = src;
  });
});

// Fixed dock nav: highlight the section currently in view
const dockLinks = document.querySelectorAll('.dock__link');
const sections = ['about', 'work', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const setActive = (id) => {
  dockLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.section === id);
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    // pick the entry most visible in the viewport right now
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  },
  { rootMargin: '-40% 0px -40% 0px', threshold: [0.1, 0.25, 0.5, 0.75] }
);

sections.forEach(section => observer.observe(section));

// Gallery lightbox: click a photo to expand it, click/Escape to close
const galleryImages = document.querySelectorAll('.gallery__img');

if (galleryImages.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close">&times;</button>
    <img class="lightbox__img" src="" alt="">
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const closeBtn = lightbox.querySelector('.lightbox__close');

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('is-open');
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
  };

  galleryImages.forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightbox.addEventListener('click', (e) => {
    // close when clicking the dark background, not the image itself
    if (e.target === lightbox) closeLightbox();
  });

  closeBtn.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}
