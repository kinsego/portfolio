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

// Gallery: build true justified rows (real image proportions, no cropping),
// with every row's total width exactly matching the container's edges.
// Some slots hold a single photo; others hold a vertical stack of two —
// that's what creates size variation *within* a row, not just between rows.
const galleryEl = document.getElementById('travelogue-gallery');

if (galleryEl) {
  const buildJustifiedGallery = () => {
    const cells = Array.from(galleryEl.querySelectorAll('.gallery__cell'));
    if (!cells.length) return;

    const containerWidth = galleryEl.clientWidth;

    cells.forEach(cell => cell.remove());
    galleryEl.innerHTML = '';

    const getRatio = (cell) => {
      const img = cell.querySelector('.gallery__img');
      return img.naturalWidth / img.naturalHeight;
    };

    let i = 0;
    while (i < cells.length) {
      const targetHeight = 60 + Math.random() * 440; // ~60–500px, wider spread
      const rowGap = 5 + Math.random() * 18;
      const innerStackGap = 4 + Math.random() * 10;
      // how likely this specific row is to use stacked pairs — varies row to row
      const stackChance = 0.15 + Math.random() * 0.45; // ~15%–60%

      // each "slot" is either { type: 'single', cell } or { type: 'stack', cells: [a, b] }
      const slots = [];
      let widthAtTarget = 0;

      while (i < cells.length) {
        const makeStack = Math.random() < stackChance && i + 1 < cells.length;

        let slotRatio, slot;
        if (makeStack) {
          const a = cells[i];
          const b = cells[i + 1];
          const ratioA = getRatio(a);
          const ratioB = getRatio(b);
          // heuristic: a stacked pair takes roughly half the width a single
          // full-height photo would, since it's two photos tall instead of one
          slotRatio = ((ratioA + ratioB) / 2) * 0.55;
          slot = { type: 'stack', cells: [a, b], ratioA, ratioB };
        } else {
          const a = cells[i];
          slotRatio = getRatio(a);
          slot = { type: 'single', cell: a, ratio: slotRatio };
        }

        const widthContribution = slotRatio * targetHeight;
        const gapContribution = slots.length > 0 ? rowGap : 0;

        if (slots.length > 0 && widthAtTarget + gapContribution + widthContribution > containerWidth) {
          break;
        }

        slots.push(slot);
        widthAtTarget += gapContribution + widthContribution;
        i += slot.type === 'stack' ? 2 : 1;
      }

      const totalGapWidth = rowGap * (slots.length - 1);
      const availableWidth = containerWidth - totalGapWidth;
      const sumRatios = slots.reduce((sum, s) => sum + (s.type === 'stack' ? ((s.ratioA + s.ratioB) / 2) * 0.55 : s.ratio), 0);
      let rowBaseHeight = availableWidth / sumRatios;

      const isLastRow = i >= cells.length;
      if (isLastRow) {
        rowBaseHeight = Math.min(rowBaseHeight, targetHeight * 1.6);
      }

      const rowEl = document.createElement('div');
      rowEl.className = 'gallery__row';
      rowEl.style.gap = `${rowGap}px`;
      rowEl.style.marginBottom = `${6 + Math.random() * 14}px`;
      rowEl.style.alignItems = 'flex-start'; // let stacked slots be taller/shorter than singles

      slots.forEach(slot => {
        if (slot.type === 'single') {
          const width = slot.ratio * rowBaseHeight;
          slot.cell.style.width = `${width}px`;
          slot.cell.style.height = `${rowBaseHeight}px`;
          slot.cell.style.flexShrink = '0';
          rowEl.appendChild(slot.cell);
        } else {
          const unitRatio = ((slot.ratioA + slot.ratioB) / 2) * 0.55;
          const unitWidth = unitRatio * rowBaseHeight;

          const stackEl = document.createElement('div');
          stackEl.style.display = 'flex';
          stackEl.style.flexDirection = 'column';
          stackEl.style.flexShrink = '0';
          stackEl.style.width = `${unitWidth}px`;
          stackEl.style.gap = `${innerStackGap}px`;

          [slot.cells[0], slot.cells[1]].forEach((cell, idx) => {
            const ratio = idx === 0 ? slot.ratioA : slot.ratioB;
            const h = unitWidth / ratio; // each sub-photo keeps its own true ratio — no crop
            cell.style.width = `${unitWidth}px`;
            cell.style.height = `${h}px`;
            stackEl.appendChild(cell);
          });

          rowEl.appendChild(stackEl);
        }
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
  // sort by the data-index we assigned when building the page, so prev/next
  // moves through photos in the same left-to-right, top-to-bottom reading order
  galleryImages.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

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
