const zipInput = document.getElementById('zipInput');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');
const countsEl = document.getElementById('counts');
const resultsEl = document.getElementById('results');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
let materials = [];
let objectUrls = [];
let currentGallery = [];
let currentImageIndex = 0;

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const isImage = name => imageExtensions.includes(name.slice(name.lastIndexOf('.')).toLowerCase());
const classify = path => {
  const p = path.toLowerCase();
  if (p.includes('preview')) return 'preview';
  if (p.includes('specification')) return 'specification';
  if (p.includes('stacking dimension') || p.includes('stacking_dimension')) return 'stacking';
  return 'other';
};
const categoryName = key => ({preview:'Preview', specification:'Specification', stacking:'Stacking Dimension', other:'Other'})[key] || 'Other';
const safe = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fileName = path => path.split('/').pop();

zipInput.addEventListener('change', async () => {
  const file = zipInput.files && zipInput.files[0];
  if (!file) return;
  clearObjectUrls();
  materials = [];
  resultsEl.innerHTML = '';
  emptyState.style.display = 'block';
  statusEl.textContent = 'Reading ZIP file…';
  countsEl.textContent = 'Loading…';
  try {
    if (typeof JSZip === 'undefined') throw new Error('ZIP reader did not load. Check your internet connection and refresh the page.');
    const archive = await JSZip.loadAsync(file);
    const grouped = new Map();
    const entries = Object.values(archive.files).filter(entry => !entry.dir);
    for (const entry of entries) {
      const parts = entry.name.split('/').filter(Boolean);
      if (parts.length < 2) continue;
      const code = parts[0];
      const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
      if (!grouped.has(code)) grouped.set(code, {code, images:[], documents:[]});
      const material = grouped.get(code);
      if (isImage(entry.name)) {
        const blob = await entry.async('blob');
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        material.images.push({path:entry.name, name:fileName(entry.name), category:classify(entry.name), url});
      } else if (ext === '.docx' || ext === '.pdf') {
        material.documents.push({path:entry.name, name:fileName(entry.name), category:classify(entry.name)});
      }
    }
    materials = [...grouped.values()].filter(m => m.images.length || m.documents.length)
      .sort((a,b) => a.code.localeCompare(b.code));
    for (const m of materials) m.images.sort((a,b) => a.path.localeCompare(b.path, undefined, {numeric:true}));
    searchInput.disabled = false;
    categoryFilter.disabled = false;
    statusEl.textContent = `Loaded ${file.name}. Images are processed locally in your browser; nothing is uploaded.`;
    countsEl.textContent = `${materials.length} materials · ${materials.reduce((n,m)=>n+m.images.length,0)} images`;
    render();
  } catch (error) {
    statusEl.textContent = `Could not read ZIP: ${error.message}`;
    countsEl.textContent = '0 materials';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'Unable to load ZIP file';
    emptyState.querySelector('p').textContent = 'Please try selecting the ZIP again. If the ZIP is very large, wait a moment and try once more.';
  }
});

function clearObjectUrls() {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls = [];
}
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const matches = materials.filter(m => {
    const textMatch = m.code.toLowerCase().includes(query) ||
      m.images.some(img => img.name.toLowerCase().includes(query) || img.path.toLowerCase().includes(query)) ||
      m.documents.some(doc => doc.name.toLowerCase().includes(query));
    const categoryMatch = category === 'all' || m.images.some(img => img.category === category);
    return textMatch && categoryMatch;
  });
  countsEl.textContent = `${matches.length} of ${materials.length} materials`;
  resultsEl.innerHTML = '';
  emptyState.style.display = matches.length ? 'none' : 'block';
  if (!matches.length) {
    emptyState.querySelector('h3').textContent = materials.length ? 'No matching materials found' : 'Your material library will appear here';
    emptyState.querySelector('p').textContent = materials.length ? 'Try another material code or choose a different reference type.' : 'Select the ZIP file. The gallery reads the images directly in your browser; it does not upload them to a server.';
    return;
  }
  const fragment = document.createDocumentFragment();
  matches.forEach(material => {
    const card = document.createElement('article');
    card.className = 'material-card';
    const total = material.images.length + material.documents.length;
    card.innerHTML = `<div class="material-head"><div><div class="material-code">${safe(material.code)}</div><div class="material-meta">Material reference folder</div></div><span class="file-count">${total} file${total===1?'':'s'}</span></div>`;
    const visibleImages = category === 'all' ? material.images : material.images.filter(img => img.category === category);
    const groups = ['preview','specification','stacking','other'];
    groups.forEach(groupKey => {
      const groupImages = visibleImages.filter(img => img.category === groupKey);
      if (!groupImages.length) return;
      const section = document.createElement('section');
      section.className = 'group';
      section.innerHTML = `<h4 class="group-title">${categoryName(groupKey)} · ${groupImages.length}</h4><div class="image-grid"></div>`;
      const grid = section.querySelector('.image-grid');
      groupImages.forEach(img => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'image-tile';
        tile.innerHTML = `<img src="${img.url}" alt="${safe(img.name)}" loading="lazy"><span class="image-label">${safe(img.name)}</span>`;
        tile.addEventListener('click', () => openLightbox(groupImages, groupImages.indexOf(img)));
        grid.appendChild(tile);
      });
      card.appendChild(section);
    });
    if (category === 'all' && material.documents.length) {
      const section = document.createElement('section');
      section.className = 'group';
      section.innerHTML = `<h4 class="group-title">Documents · ${material.documents.length}</h4><div class="file-list">${material.documents.map(d=>`<span class="file-chip">▤ ${safe(d.name)}</span>`).join('')}</div>`;
      card.appendChild(section);
    }
    fragment.appendChild(card);
  });
  resultsEl.appendChild(fragment);
}
function openLightbox(images, index) {
  currentGallery = images;
  currentImageIndex = index;
  updateLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
}
function updateLightbox() {
  const img = currentGallery[currentImageIndex];
  if (!img) return;
  lightboxImage.src = img.url;
  lightboxCaption.textContent = `${img.path} · ${currentImageIndex + 1} of ${currentGallery.length}`;
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  lightboxImage.removeAttribute('src');
}
function moveLightbox(step) {
  if (!currentGallery.length) return;
  currentImageIndex = (currentImageIndex + step + currentGallery.length) % currentGallery.length;
  updateLightbox();
}
searchInput.addEventListener('input', render);
categoryFilter.addEventListener('change', render);
clearBtn.addEventListener('click', () => { searchInput.value=''; categoryFilter.value='all'; render(); searchInput.focus(); });
document.getElementById('closeLightbox').addEventListener('click', closeLightbox);
document.getElementById('prevImage').addEventListener('click', () => moveLightbox(-1));
document.getElementById('nextImage').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') moveLightbox(-1);
  if (e.key === 'ArrowRight') moveLightbox(1);
});
