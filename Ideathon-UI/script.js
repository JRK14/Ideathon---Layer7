// Quotes for student view
const STUDENT_QUOTES = [
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Education is the most powerful weapon which you can use to change the world.",
  "The mind is not a vessel to be filled, but a fire to be kindled.",
  "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
  "Knowledge is power. Information is liberating. Education is the premise of progress.",
  "The expert in anything was once a beginner.",
  "Learning is not attained by chance; it must be sought for with ardor and attended to with diligence.",
  "Change is the end result of all true learning.",
  "Intellectual growth should commence at birth and cease only at death."
];

// Quotes for teacher view
const TEACHER_QUOTES = [
  "The art of teaching is the art of assisting discovery.",
  "To world-class teachers, teaching is not a job; it is a service to humanity.",
  "A teacher takes a hand, opens a mind, and touches a heart.",
  "Great teachers empathize with kids, respect them, and believe that each one has something special.",
  "Teaching is the one profession that creates all other professions.",
  "The best teachers are those who show you where to look but don't tell you what to see.",
  "If you have to put someone on a pedestal, put teachers. They are the heroes of society.",
  "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.",
  "Teaching is the greatest act of optimism.",
  "The influence of a good teacher can never be erased."
];

const welcomeQuoteEl = document.getElementById('welcomeQuote');
const welcomeSubEl = document.getElementById('welcomeSub');
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.auth-form');

let studentQuoteIndex = 0;
let teacherQuoteIndex = 0;
let quoteInterval = null;

function getCurrentType() {
  const activeTab = document.querySelector('.tab.active');
  return activeTab ? activeTab.dataset.tab.includes('student') ? 'student' : 'teacher' : 'student';
}

function showQuote(type) {
  const quotes = type === 'student' ? STUDENT_QUOTES : TEACHER_QUOTES;
  const idx = type === 'student' ? studentQuoteIndex : teacherQuoteIndex;
  const quote = quotes[idx % quotes.length];

  welcomeQuoteEl.textContent = `"${quote}"`;
  welcomeSubEl.textContent = type === 'student'
    ? 'Keep learning, keep growing.'
    : 'Shape minds. Change lives.';

  if (type === 'student') {
    studentQuoteIndex = (studentQuoteIndex + 1) % STUDENT_QUOTES.length;
  } else {
    teacherQuoteIndex = (teacherQuoteIndex + 1) % TEACHER_QUOTES.length;
  }
}

function startQuoteRotation(type) {
  if (quoteInterval) clearInterval(quoteInterval);
  showQuote(type);
  quoteInterval = setInterval(() => showQuote(type), 6000);
}

function switchTo(tabId) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  forms.forEach(f => {
    f.classList.toggle('active', f.id === tabId);
  });
  const type = tabId.includes('student') ? 'student' : 'teacher';
  startQuoteRotation(type);
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTo(tab.dataset.tab));
});

const API = window.location.origin;

function showMessage(form, message, isError = false) {
  let el = form.querySelector('.form-message');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-message';
    form.appendChild(el);
  }
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.classList.toggle('success', !isError);
  el.hidden = false;
}

forms.forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = form.dataset.type;
    const isSignup = form.id.includes('signup');
    const nameInput = form.querySelector('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const btn = form.querySelector('.btn-primary');

    const payload = {
      email: emailInput?.value?.trim(),
      password: passwordInput?.value || '',
      role: type,
    };
    if (isSignup && nameInput) payload.name = nameInput.value.trim();

    const url = isSignup ? `${API}/api/signup` : `${API}/api/login`;
    btn.disabled = true;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showMessage(form, data.message || (isSignup ? 'Account created.' : 'Signed in.'), false);
        if (data.user) console.log('User:', data.user);
      } else {
        showMessage(form, data.message || 'Something went wrong.', true);
      }
    } catch (err) {
      showMessage(form, 'Network error. Is the server running?', true);
    }
    btn.disabled = false;
  });
});

// Initial load
switchTo('student-login');