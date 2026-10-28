(() => {
  'use strict';
  const materials = Array.isArray(window.MATERIALS) ? window.MATERIALS : [];
  const photoMap = window.MATERIAL_PHOTOS || {};
  const pageSize = 25;
  let page = 1;
  let filtered = [...materials];
  let toastTimer;

  const $ = (id) => document.getElementById(id);
  const searchInput = $('searchInput');
  const body = $('materialsBody');
  const summary = $('resultsSummary');
  const pageSummary = $('pageSummary');
  const emptyState = $('emptyState');
  const prevPage = $('prevPage');
  const nextPage = $('nextPage');
  const dialog = $('photoDialog');
  const photoGallery = $('photoGallery');
  const noPhotos = $('noPhotos');
  const photoTitle = $('photoTitle');
  const photoSubtitle = $('photoSubtitle');
  const photoCount = $('photoCount');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalized = (value) => String(value ?? '').toLocaleLowerCase().trim();

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function applyFilters() {
    const term = normalized(searchInput.value);
    const sort = $('sortSelect').value;
    filtered = materials.filter(item => !term || [item.code, item.name, item.uom, item.project, item.folder].some(value => normalized(value).includes(term)));
    filtered.sort((a,b) => normalized(sort === 'name' ? a.name : a.code).localeCompare(normalized(sort === 'name' ? b.name : b.code), undefined, {numeric:true}));
    page = 1;
    render();
    $('clearSearch').hidden = !searchInput.value;
  }

  function render() {
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const shown = filtered.slice(start, start + pageSize);
    body.innerHTML = shown.map(item => {
      const code = String(item.code || '').trim();
      const photoCountForCode = Array.isArray(photoMap[code]) ? photoMap[code].length : 0;
      const sourceLabel = photoCountForCode ? `SOURCE <span>(${photoCountForCode})</span>` : 'SOURCE';
      const noSourceClass = photoCountForCode ? '' : ' no-source';
      return `<tr>
        <td><div class="material-code">${escapeHtml(code || '—')}</div></td>
        <td><div class="material-name">${escapeHtml(item.name || '—')}</div></td>
        <td><span class="uom-pill">${escapeHtml(item.uom || '—')}</span></td>
        <td><button type="button" class="source-button${noSourceClass}" data-code="${escapeHtml(code)}" aria-label="View photos for ${escapeHtml(code)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 20"></path></svg>${sourceLabel}</button></td>
      </tr>`;
    }).join('');
    summary.textContent = `${filtered.length.toLocaleString()} material${filtered.length === 1 ? '' : 's'} found`;
    pageSummary.textContent = filtered.length ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length.toLocaleString()}` : 'No results';
    emptyState.hidden = filtered.length !== 0;
    $('materialsBody').parentElement.hidden = filtered.length === 0;
    prevPage.disabled = page <= 1;
    nextPage.disabled = page >= pages;
  }

  function openPhotos(code) {
    const item = materials.find(entry => String(entry.code || '').trim() === code);
    const photos = Array.isArray(photoMap[code]) ? photoMap[code] : [];
    photoTitle.textContent = code || 'Material photos';
    photoSubtitle.textContent = item ? `${item.name || ''}${item.uom ? ` · ${item.uom}` : ''}` : 'Material photo source';
    photoGallery.innerHTML = '';
    noPhotos.hidden = photos.length > 0;
    photoGallery.hidden = photos.length === 0;
    photos.forEach((photo, index) => {
      const src = typeof photo === 'string' ? photo : photo.src;
      const label = typeof photo === 'string' ? photo.split('/').pop() : (photo.name || photo.src.split('/').pop());
      const figure = document.createElement('figure');
      figure.className = 'photo-card';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${code} photo ${index + 1}`;
      img.loading = 'lazy';
      img.addEventListener('click', () => {
        if (img.requestFullscreen) img.requestFullscreen().catch(() => showToast('Your browser could not open fullscreen view.'));
      });
      const caption = document.createElement('figcaption');
      caption.textContent = label;
      figure.append(img, caption);
      photoGallery.append(figure);
    });
    photoCount.textContent = photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : 'No indexed photos';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  searchInput.addEventListener('input', applyFilters);
  $('sortSelect').addEventListener('change', applyFilters);
  $('clearSearch').addEventListener('click', () => { searchInput.value = ''; searchInput.focus(); applyFilters(); });
  document.querySelectorAll('.example-search').forEach(button => button.addEventListener('click', () => { searchInput.value = button.dataset.search || ''; applyFilters(); searchInput.focus(); }));
  body.addEventListener('click', event => {
    const button = event.target.closest('.source-button');
    if (!button) return;
    const code = button.dataset.code || '';
    if (!(photoMap[code] || []).length) showToast(`No photos indexed for ${code}. Extract GALLERY.zip and run build_photo_index.py.`);
    openPhotos(code);
  });
  prevPage.addEventListener('click', () => { if (page > 1) { page--; render(); } });
  nextPage.addEventListener('click', () => { if (page < Math.ceil(filtered.length / pageSize)) { page++; render(); } });
  $('closeDialog').addEventListener('click', () => dialog.close());
  $('closeDialogBottom').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  render();
  if (!materials.length) showToast('Material directory data was not loaded.');
})();
