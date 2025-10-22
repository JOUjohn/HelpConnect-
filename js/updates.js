/* Updates page:
   - Loads posts (/data/posts.json) and groups (/data/groups.json) or uses seeds
   - Merges into a single feed with consistent fields
   - Filters by kind, category/type, date range, search; sorts by date
   - Local actions: Follow (per item), Helpful (counter) via localStorage
*/

const feedEl = document.getElementById('feed');

const kindEl = document.getElementById('filterKind');
const postCatEl = document.getElementById('filterCategory');
const groupTypeEl = document.getElementById('filterGroupType');
const qEl = document.getElementById('searchInput');
const fromEl = document.getElementById('fromDate');
const toEl = document.getElementById('toDate');
const sortEl = document.getElementById('sortBy');
const clearBtn = document.getElementById('clearFilters');

let ITEMS = [];
let FOLLOW = loadJSON('hc_follow', {});
let HELPFUL = loadJSON('hc_helpful', {});

init();

async function init() {
  const posts = await loadPosts();
  const groups = await loadGroups();

  ITEMS = [
    ...posts.map(p => normalizePost(p)),
    ...groups.map(g => normalizeGroup(g))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  render(ITEMS);
  wireUI();
}

function wireUI() {
  [kindEl, postCatEl, groupTypeEl, fromEl, toEl, sortEl].forEach(el => el.addEventListener('change', applyFilters));
  qEl.addEventListener('input', debounce(applyFilters, 200));
  clearBtn.addEventListener('click', () => {
    kindEl.value = '';
    postCatEl.value = '';
    groupTypeEl.value = '';
    qEl.value = '';
    fromEl.value = '';
    toEl.value = '';
    sortEl.value = 'newest';
    render(ITEMS);
  });
}

async function loadPosts() {
  try {
    const res = await fetch('data/posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no posts.json');
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [
      { id:'p1', title:'Need help with groceries', description:'Caring for my mom, can’t get to the market this week.', category:'Financial Support', contact:'chioma@example.com', createdAt: isoNow() },
      { id:'p2', title:'Looking for entry-level IT job', description:'Fresh graduate seeking internship or junior role.', category:'Job Opportunity', contact:'0803-000-0000', createdAt: isoNow(-1) },
      { id:'p3', title:'Free blood pressure checks', description:'Community clinic Saturday 10am–2pm.', category:'Community Event', contact:'clinic@health.org', createdAt: isoNow(-2) }
    ];
  }
}

async function loadGroups() {
  try {
    const res = await fetch('data/groups.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no groups.json');
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [
      { id:'g1', type:'Health', title:'Vaccination Drive', group:'Central Clinic', date: dayOffsetISO(3), location:'Ikeja, Lagos', details:'MMR + tetanus boosters.', contact:'clinic@health.org' },
      { id:'g2', type:'Job', title:'Frontend Intern', group:'GreenTech', date: dayOffsetISO(10), location:'Remote / Lagos', details:'HTML/CSS/JS. Stipend.', contact:'jobs@greentech.ng' },
      { id:'g3', type:'Event', title:'Community Clean-Up', group:'Youth Action', date: dayOffsetISO(5), location:'Ajah Waterfront', details:'Meet 8:00 AM main gate.', contact:'0803-000-0000' }
    ];
  }
}

/* Normalizers -> unified schema */
function normalizePost(p) {
  return {
    uid: `post:${p.id || Date.now()+Math.random()}`,
    kind: 'Post',
    title: p.title || 'Untitled Post',
    body: p.description || '',
    category: p.category || 'Other',
    type: null,
    contact: p.contact || '',
    location: null,
    origin: 'Help Posts',
    date: p.createdAt || isoNow(),
    extra: {}
  };
}
function normalizeGroup(g) {
  return {
    uid: `group:${g.id || Date.now()+Math.random()}`,
    kind: 'Group',
    title: g.title || 'Untitled',
    body: g.details || '',
    category: null,
    type: g.type || 'Event',
    contact: g.contact || '',
    location: g.location || '',
    origin: g.group || 'Group',
    date: g.date || isoNow(),
    extra: {}
  };
}

/* Render */
function render(items) {
  feedEl.innerHTML = '';
  if (!items.length) {
    feedEl.innerHTML = '<p>No updates found.</p>';
    return;
  }

  items.forEach(it => {
    const helpfulCount = HELPFUL[it.uid] || 0;
    const isFollow = !!FOLLOW[it.uid];

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge">
        <span class="pill">${it.kind === 'Post' ? 'Help Post' : it.type || 'Group'}</span>
        ${it.category ? `<span class="pill">${escapeHTML(it.category)}</span>` : ''}
      </div>
      <h4>${escapeHTML(it.title)}</h4>
      <div class="meta">
        <span>${escapeHTML(it.origin)}</span>
        <span>•</span>
        <span>${formatDate(it.date)}</span>
        ${it.location ? `<span>•</span><span class="location">${escapeHTML(it.location)}</span>` : ''}
      </div>
      <p class="content">${escapeHTML(it.body)}</p>
      ${it.contact ? `<div class="contact">Contact: ${escapeHTML(it.contact)}</div>` : ''}
      <div class="actions">
        <button class="btn-primary" data-action="view" data-uid="${it.uid}">View details</button>
        <div class="right">
          <button class="icon-btn ${isFollow ? 'active' : ''}" data-action="follow" data-uid="${it.uid}">
            ${isFollow ? 'Following ✓' : 'Follow'}
          </button>
          <button class="icon-btn" data-action="helpful" data-uid="${it.uid}">Helpful • <span data-helpful="${it.uid}">${helpfulCount}</span></button>
        </div>
      </div>
    `;
    feedEl.appendChild(card);
  });

  // Wire actions
  feedEl.querySelectorAll('button[data-action]').forEach(btn => {
    const uid = btn.dataset.uid;
    const action = btn.dataset.action;
    if (action === 'follow') {
      btn.addEventListener('click', () => toggleFollow(uid, btn));
    } else if (action === 'helpful') {
      btn.addEventListener('click', () => addHelpful(uid));
    } else if (action === 'view') {
      // For now, route to appropriate page
      if (uid.startsWith('post:')) window.location.href = 'support-replies.html';
      else window.location.href = 'groups.html';
    }
  });
}

/* Filters & sort */
function applyFilters() {
  const kind = kindEl.value;
  const postCat = postCatEl.value.trim().toLowerCase();
  const gType = groupTypeEl.value.trim().toLowerCase();
  const q = qEl.value.trim().toLowerCase();
  const from = fromEl.value ? startOfDay(new Date(fromEl.value)) : null;
  const to = toEl.value ? endOfDay(new Date(toEl.value)) : null;
  const sort = sortEl.value;

  let arr = ITEMS.filter(it => {
    if (kind && it.kind !== kind) return false;
    if (kind === 'Post' && postCat && (it.category || '').toLowerCase() !== postCat) return false;
    if (kind === 'Group' && gType && (it.type || '').toLowerCase() !== gType) return false;

    const blob = `${it.title} ${it.body} ${it.origin} ${it.location || ''}`.toLowerCase();
    if (q && !blob.includes(q)) return false;

    const d = new Date(it.date);
    if (from && d < from) return false;
    if (to && d > to) return false;

    return true;
  });

  arr.sort((a,b) => sort === 'newest'
    ? new Date(b.date) - new Date(a.date)
    : new Date(a.date) - new Date(b.date)
  );

  render(arr);
}

/* Actions */
function toggleFollow(uid, btn) {
  FOLLOW[uid] = !FOLLOW[uid];
  saveJSON('hc_follow', FOLLOW);
  btn.classList.toggle('active', !!FOLLOW[uid]);
  btn.textContent = FOLLOW[uid] ? 'Following ✓' : 'Follow';
}
function addHelpful(uid) {
  HELPFUL[uid] = (HELPFUL[uid] || 0) + 1;
  saveJSON('hc_helpful', HELPFUL);
  const span = document.querySelector(`[data-helpful="${uid}"]`);
  if (span) span.textContent = HELPFUL[uid];
}

/* Utils */
function escapeHTML(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString();
}
function isoNow(offsetDays=0) {
  const d = new Date(); d.setDate(d.getDate()+offsetDays); return d.toISOString();
}
function dayOffsetISO(n){ const d=new Date(); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d.toISOString(); }
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a),ms); }; }
function loadJSON(key, fallback){ try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }catch{ return fallback; } }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
