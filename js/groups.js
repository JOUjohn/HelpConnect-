/* Groups page logic
   - Loads /data/groups.json if available, otherwise uses seeds.
   - Renders cards.
   - Filters by type, location, date range, and search.
   - "Share an Update" modal creates new items in localStorage (key: hc_groups).
*/

const listEl = document.getElementById('groupList');

const typeEl = document.getElementById('filterType');
const locEl = document.getElementById('filterLocation');
const fromEl = document.getElementById('filterFromDate');
const toEl = document.getElementById('filterToDate');
const searchEl = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearFilters');

const createModal = document.getElementById('createModal');
const openCreateBtn = document.getElementById('openCreateModal');
const closeCreateBtn = document.getElementById('closeCreateModal');
const createForm = document.getElementById('createForm');

let ITEMS = [];
let LOCAL = loadLocal();

init();

async function init() {
  const base = await loadBase();
  ITEMS = merge(base, LOCAL);
  render(ITEMS);
  wireUI();
}

function wireUI() {
  [typeEl, locEl, fromEl, toEl].forEach(el => el.addEventListener('change', applyFilters));
  searchEl.addEventListener('input', debounce(applyFilters, 200));
  clearBtn.addEventListener('click', () => {
    typeEl.value = '';
    locEl.value = '';
    fromEl.value = '';
    toEl.value = '';
    searchEl.value = '';
    render(ITEMS);
  });

  openCreateBtn.addEventListener('click', () => openModal());
  closeCreateBtn.addEventListener('click', closeModal);
  createModal.addEventListener('click', (e) => { if (e.target === createModal) closeModal(); });

  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      id: 'g_' + Date.now(),
      type: createForm.type.value,
      title: createForm.title.value.trim(),
      group: createForm.group.value.trim(),
      date: createForm.date.value || null,
      location: createForm.location.value.trim(),
      details: createForm.details.value.trim(),
      contact: createForm.contact.value.trim(),
      createdAt: new Date().toISOString()
    };
    if (!payload.type || !payload.title || !payload.group || !payload.details) return;

    LOCAL.push(payload);
    saveLocal(LOCAL);
    ITEMS = merge(ITEMS, [payload]); // append
    render(ITEMS);
    closeModal();
    createForm.reset();
  });
}

async function loadBase() {
  try {
    const res = await fetch('data/groups.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no groups.json');
    return await res.json();
  } catch {
    return [
      {
        id: 'g1',
        type: 'Health',
        title: 'Free Vaccination Drive',
        group: 'Central Clinic Outreach',
        date: isoDayOffset(3),
        location: 'Ikeja, Lagos',
        details: 'MMR and tetanus boosters available. Bring ID if possible.',
        contact: 'clinic@health.org'
      },
      {
        id: 'g2',
        type: 'Job',
        title: 'Junior Frontend Developer (Intern)',
        group: 'GreenTech Solutions',
        date: isoDayOffset(10),
        location: 'Remote / Lagos',
        details: 'HTML/CSS/JS required. Stipend provided.',
        contact: 'jobs@greentech.ng'
      },
      {
        id: 'g3',
        type: 'Event',
        title: 'Community Clean-Up',
        group: 'Youth Action Group',
        date: isoDayOffset(5),
        location: 'Ajah Waterfront',
        details: 'Gloves and bags provided. Meet 8:00 AM at the main gate.',
        contact: '0803-000-0000'
      }
    ];
  }
}

/* Render */
function render(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<p>No group posts found.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    const dateLabel = item.date ? formatDate(item.date) : 'No date';
    card.innerHTML = `
      <span class="type-badge">${escapeHTML(item.type || 'Info')}</span>
      <h4>${escapeHTML(item.title)}</h4>
      <div class="meta">
        <span>${escapeHTML(item.group || '—')}</span>
        <span>•</span>
        <span>${escapeHTML(item.location || '—')}</span>
        <span>•</span>
        <span>${escapeHTML(dateLabel)}</span>
      </div>
      <p class="details">${escapeHTML(item.details || '')}</p>
      ${item.contact ? `<div class="contact">Contact: ${escapeHTML(item.contact)}</div>` : ''}
    `;
    listEl.appendChild(card);
  });
}

/* Filters */
function applyFilters() {
  const t = typeEl.value.trim().toLowerCase();
  const loc = locEl.value.trim().toLowerCase();
  const q = searchEl.value.trim().toLowerCase();
  const from = fromEl.value ? new Date(fromEl.value) : null;
  const to = toEl.value ? new Date(toEl.value) : null;

  const filtered = ITEMS.filter(i => {
    const matchType = !t || (i.type || '').toLowerCase() === t;
    const matchLoc = !loc || (i.location || '').toLowerCase().includes(loc);
    const blob = `${i.title} ${i.group} ${i.details} ${i.location}`.toLowerCase();
    const matchQ = !q || blob.includes(q);

    let matchDate = true;
    if (from || to) {
      const d = i.date ? new Date(i.date) : null;
      if (from && (!d || d < normalizeDate(from))) matchDate = false;
      if (to && (!d || d > endOfDay(to))) matchDate = false;
    }
    return matchType && matchLoc && matchQ && matchDate;
  });

  render(filtered);
}

/* Modal helpers */
function openModal() {
  createModal.style.display = 'flex';
  createModal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  createModal.style.display = 'none';
  createModal.setAttribute('aria-hidden', 'true');
}

/* Local storage */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem('hc_groups') || '[]'); }
  catch { return []; }
}
function saveLocal(data) {
  localStorage.setItem('hc_groups', JSON.stringify(data));
}
function merge(base, extra) {
  const map = new Map();
  [...base, ...extra].forEach(i => map.set(i.id, i));
  return [...map.values()];
}

/* Utils */
function escapeHTML(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? 'No date' : d.toLocaleDateString();
}
function isoDayOffset(n) {
  const d = new Date(); d.setDate(d.getDate()+n);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function normalizeDate(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a),ms); }; }
