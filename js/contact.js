/* Contact form logic
   - Client-side validation
   - Basic spam trap ("company" hidden field)
   - Success modal (no network) — swap to Formspree/your API when ready
*/

(function () {
  const form = document.getElementById('contactForm');
  const thanks = document.getElementById('contactThanks');
  const closeThanks = document.getElementById('closeThanks');

  if (!form || !thanks) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Spam trap
    if (form.company && form.company.value.trim() !== '') return;

    // Validate required fields
    const required = ['name','email','topic','subject','message'];
    let ok = true;

    required.forEach(id => setErr(id, '')); // clear

    // Email regex (simple)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim());

    if (!form.name.value.trim()) { setErr('name', 'Please enter your name'); ok = false; }
    if (!emailOk) { setErr('email', 'Enter a valid email address'); ok = false; }
    if (!form.topic.value.trim()) { setErr('topic', 'Select a topic'); ok = false; }
    if (!form.subject.value.trim()) { setErr('subject', 'Enter a subject'); ok = false; }
    if (!form.message.value.trim()) { setErr('message', 'Write a short message'); ok = false; }

    if (!ok) return;

    /* —— Option A: Front-end only demo (shows thank-you) —— */
    openThanks();
    form.reset();

    /* —— Option B: Send to Formspree / your API —— 
    try {
      const data = new FormData(form);
      const res = await fetch('https://formspree.io/f/your-id', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) { openThanks(); form.reset(); }
      else { alert('Submission failed. Please try again.'); }
    } catch {
      alert('Network error. Please try again.');
    }
    */
  });

  function openThanks(){
    thanks.style.display = 'flex';
    thanks.setAttribute('aria-hidden', 'false');
  }
  function closeModal(){
    thanks.style.display = 'none';
    thanks.setAttribute('aria-hidden', 'true');
  }

  closeThanks?.addEventListener('click', closeModal);
  thanks.addEventListener('click', (e) => { if (e.target === thanks) closeModal(); });

  function setErr(id, msg){
    const el = document.querySelector(`[data-err="${id}"]`);
    if (el) el.textContent = msg || '';
  }
})();
