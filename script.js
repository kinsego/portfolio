// Intro: the name starts centered in the viewport, fades in there, then
// moves up into its real resting position in the masthead while the teal
// backdrop fades away — all happening together. Plays every page load.
const introBackdrop = document.getElementById('introBackdrop');
const introTagline = document.getElementById('intro-tagline');

if (introBackdrop && introTagline) {
  // measure where the name naturally sits, then work out how far it needs
  // to shift to appear dead-center in the viewport instead
  const rect = introTagline.getBoundingClientRect();
  const naturalCenterX = rect.left + rect.width / 2;
  const naturalCenterY = rect.top + rect.height / 2;
  const deltaX = window.innerWidth / 2 - naturalCenterX;
  const deltaY = window.innerHeight / 2 - naturalCenterY;

  introTagline.classList.add('intro-pending', 'intro-on-backdrop');
  introTagline.style.transition = 'none';
  introTagline.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  void introTagline.offsetWidth; // force the browser to apply the line above before re-enabling transitions
  introTagline.style.transition = '';

  // hold on a blank teal screen for a second before the name starts
  // fading in — a deliberate pause, not part of the fade itself
  setTimeout(() => {
    introTagline.classList.remove('intro-pending');
  }, 1000);

  // after the (now slower, ~1.6s) fade-in finishes and a short pause,
  // push the name up toward its real position — it stays white throughout
  // this move, since the backdrop is still fully opaque
  setTimeout(() => {
    introTagline.style.transform = '';
  }, 2000);

  // only once the name has essentially arrived do the backdrop, the text
  // color, and the rest of the page all change together — so nothing is
  // teal-on-teal invisible, and the page pushes up into view at the same
  // moment the backdrop clears (matching the reference recording)
  setTimeout(() => {
    introBackdrop.classList.add('is-hidden');
    introTagline.classList.remove('intro-on-backdrop');
    document.querySelectorAll('.reveal-on-intro').forEach(el => {
      el.classList.add('is-revealed');
    });
  }, 2080);
}

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

// Fixed dock nav: highlight the section currently in view.
// Uses a fixed horizontal line partway down the viewport and checks which
// section it's currently passing through — this works correctly regardless
// of how tall any individual section is (the old percentage-visible method
// broke once Work got much taller than About/Contact).
const dockLinks = document.querySelectorAll('.dock__link');
const sections = ['about', 'work', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const setActive = (id) => {
  dockLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.section === id);
  });
};

const updateActiveSection = () => {
  const lineY = window.innerHeight * 0.35;

  // walk sections top to bottom; the active one is the last one whose
  // top has already passed the line
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= lineY) {
      current = section;
    }
  }

  // special case: within 80px of the very bottom of the page, force the
  // last section active (handles short final sections / footer padding)
  const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
  if (nearBottom) {
    current = sections[sections.length - 1];
  }

  if (current) setActive(current.id);
};

window.addEventListener('scroll', updateActiveSection);
window.addEventListener('resize', updateActiveSection);
updateActiveSection();

// Gallery: build true justified rows — every photo in a row shares the exact
// same top and bottom edge, and no photo is ever cropped. The row height is
// calculated (not forced) so the row's total width matches the container
// exactly on both edges.
const galleryEl = document.getElementById('travelogue-gallery');

if (galleryEl) {
  const buildJustifiedGallery = () => {
    const cells = Array.from(galleryEl.querySelectorAll('.gallery__cell'));
    if (!cells.length) return;

    const containerWidth = galleryEl.clientWidth;
    const gap = 5.4; // px, matches the 0.3375rem gap used elsewhere

    cells.forEach(cell => cell.remove());
    galleryEl.innerHTML = '';

    let i = 0;
    while (i < cells.length) {
      const targetHeight = 264; // baseline row height before exact-fit scaling
      const row = [];
      let widthAtTarget = 0;

      while (i < cells.length) {
        const cell = cells[i];
        const img = cell.querySelector('.gallery__img');
        const ratio = img.naturalWidth / img.naturalHeight;
        const widthContribution = ratio * targetHeight;
        const gapContribution = row.length > 0 ? gap : 0;

        if (row.length > 0 && widthAtTarget + gapContribution + widthContribution > containerWidth) {
          break;
        }

        row.push({ cell, ratio });
        widthAtTarget += gapContribution + widthContribution;
        i++;
      }

      const totalGapWidth = gap * (row.length - 1);
      const availableWidth = containerWidth - totalGapWidth;
      const sumRatios = row.reduce((sum, r) => sum + r.ratio, 0);
      let rowHeight = availableWidth / sumRatios;

      const isLastRow = i >= cells.length;
      if (isLastRow) {
        rowHeight = Math.min(rowHeight, targetHeight * 1.3);
      }

      const rowEl = document.createElement('div');
      rowEl.className = 'gallery__row';

      row.forEach(({ cell, ratio }) => {
        cell.style.width = `${ratio * rowHeight}px`;
        cell.style.height = `${rowHeight}px`;
        rowEl.appendChild(cell);
      });

      galleryEl.appendChild(rowEl);
    }
  };

  const allImages = Array.from(galleryEl.querySelectorAll('.gallery__img'));
  let loadedCount = 0;

  const onEachLoaded = () => {
    loadedCount++;
    if (loadedCount === allImages.length) buildJustifiedGallery();
  };

  allImages.forEach(img => {
    if (img.complete && img.naturalWidth) {
      onEachLoaded();
    } else {
      img.addEventListener('load', onEachLoaded);
      img.addEventListener('error', onEachLoaded);
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildJustifiedGallery, 200);
  });
}

// Gallery lightbox: click a photo to expand it, prev/next to browse, Escape to close
const galleryImages = Array.from(document.querySelectorAll('.gallery__img'));

if (galleryImages.length) {
  // uses the actual order photos appear in the page (not a fixed number baked
  // into each one) — so if you reorder blocks in the HTML, prev/next just
  // follows along automatically, no index bookkeeping needed

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close">&times;</button>
    <img class="lightbox__img" src="" alt="">
    <div class="lightbox__nav">
      <button class="lightbox__prev">prev</button>
      <span class="lightbox__divider">/</span>
      <button class="lightbox__next">next</button>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');

  let currentIndex = 0;

  const showIndex = (i) => {
    currentIndex = (i + galleryImages.length) % galleryImages.length;
    const img = galleryImages[currentIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  };

  const openLightbox = (i) => {
    showIndex(i);
    lightbox.classList.add('is-open');
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
  };

  galleryImages.forEach((img, i) => {
    img.addEventListener('click', () => openLightbox(i));
  });

  prevBtn.addEventListener('click', () => showIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => showIndex(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    // close when clicking the dark background, not the image or controls
    if (e.target === lightbox) closeLightbox();
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showIndex(currentIndex - 1);
    if (e.key === 'ArrowRight') showIndex(currentIndex + 1);
  });
}
