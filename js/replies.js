/* Demo data loader:
   - Tries /data/posts.json (optional)
   - Falls back to seeds
   - Stores replies in localStorage: key "hc_replies"
*/

const listEl = document.getElementById('postsList');
const filterEl = document.getElementById('filterCategory');
const searchEl = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearFilters');

const modal = document.getElementById('replyModal');
const closeModalBtn = document.getElementById('closeModal');
const replyForm = document.getElementById('replyForm');
const postIdInput = document.getElementById('postId');
const modalPostTitle = document.getElementById('modalPostTitle');

let POSTS = [];
let REPLIES = loadReplies();

init();

async function init() {
  POSTS = await loadPosts();
  render(POSTS);
  wireUI();
}

function wireUI() {
  filterEl.addEventListener('change', applyFilters);
  searchEl.addEventListener('input', debounce(applyFilters, 200));
  clearBtn.addEventListener('click', () => {
    filterEl.value = '';
    searchEl.value = '';
    render(POSTS);
  });

  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  replyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = postIdInput.value;
    const name = replyForm.name.value.trim();
    const contact = replyForm.contact.value.trim();
    const message = replyForm.message.value.trim();
    if (!name || !contact || !message) return;

    const newReply = {
      postId: id,
      name,
      contact,
      message,
      createdAt: new Date().toISOString()
    };
    REPLIES.push(newReply);
    saveReplies(REPLIES);
    closeModal();
    render(POSTS); // refresh counts and lists
  });
}

async function loadPosts() {
  try {
    const res = await fetch('data/posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No posts.json');
    return await res.json();
  } catch {
    // Seed data for demo
    return [
      {
        id: 'p1',
        title: 'Need help with groceries',
        description: 'I’m caring for my mom and can’t get to the market this week.',
        category: 'Financial Support',
        contact: 'chioma@example.com'
      },
      {
        id: 'p2',
        title: 'Looking for entry-level IT job',
        description: 'Fresh graduate seeking internship or junior role.',
        category: 'Job Opportunity',
        contact: '0803-000-0000'
      },
      {
        id: 'p3',
        title: 'Free blood pressure checks',
        description: 'Community event at Local Clinic on Saturday 10am–2pm.',
        category: 'Community Event',
        contact: 'clinic@health.org'
      }
    ];
  }
}

function render(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<p>No posts found.</p>';
    return;
  }

  items.forEach(post => {
    const repliesForPost = REPLIES.filter(r => r.postId === post.id);
    const card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML = `
      <h4>${escapeHTML(post.title)}</h4>
      <div class="meta">
        <span>${escapeHTML(post.category || 'Other')}</span>
        <span>Contact: ${escapeHTML(post.contact || 'N/A')}</span>
      </div>
      <p>${escapeHTML(post.description)}</p>
      <div class="actions">
        <button class="btn-primary" data-reply="${post.id}" data-title="${escapeHTML(post.title)}">Offer Support</button>
        <span class="reply-count">${repliesForPost.length} repl${repliesForPost.length === 1 ? 'y' : 'ies'}</span>
      </div>
      <div class="reply-list" id="replies-${post.id}">
        ${repliesForPost.map(r => `
          <div class="reply-item">
            <div class="by">${escapeHTML(r.name)}</div>
            <div class="msg">${escapeHTML(r.message)}</div>
            <div class="meta">Contact: ${escapeHTML(r.contact)} • ${formatTime(r.createdAt)}</div>
          </div>
        `).join('')}
      </div>
      <button class="toggle-replies" data-toggle="${post.id}">
        ${repliesForPost.length ? 'Show replies' : 'No replies yet'}
      </button>
    `;
    listEl.appendChild(card);
  });

  // Wire per-card buttons
  listEl.querySelectorAll('[data-reply]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.reply, btn.dataset.title));
  });
  listEl.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => toggleReplies(btn.dataset.toggle, btn));
  });
}

function applyFilters() {
  const cat = filterEl.value.trim().toLowerCase();
  const q = searchEl.value.trim().toLowerCase();

  const filtered = POSTS.filter(p => {
    const matchCat = !cat || (p.category || '').toLowerCase() === cat;
    const blob = `${p.title} ${p.description} ${p.category} ${p.contact}`.toLowerCase();
    const matchQ = !q || blob.includes(q);
    return matchCat && matchQ;
  });
  render(filtered);
}

function toggleReplies(postId, btn) {
  const panel = document.getElementById(`replies-${postId}`);
  if (!panel) return;
  const isOpen = panel.style.display === 'block';
  panel.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? 'Show replies' : 'Hide replies';
}

function openModal(id, title) {
  postIdInput.value = id;
  modalPostTitle.textContent = title;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  replyForm.reset();
}

/* Storage helpers */
function loadReplies() {
  try {
    return JSON.parse(localStorage.getItem('hc_replies') || '[]');
  } catch { return []; }
}
function saveReplies(data) {
  localStorage.setItem('hc_replies', JSON.stringify(data));
}

/* Utils */
function escapeHTML(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return ''; }
}
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this,args), ms); };
}
