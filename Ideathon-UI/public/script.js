const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const regRole = document.getElementById('regRole');
const overlayTitle = document.getElementById('overlayTitle');
const overlayQuote = document.getElementById('overlayQuote');

const studentQuotes = [
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The mind is not a vessel to be filled, but a fire to be kindled."
];

const teacherQuotes = [
    "The art of teaching is the art of assisting discovery.",
    "To world-class teachers, teaching is not a job; it is a service to humanity.",
    "A teacher takes a hand, opens a mind, and touches a heart.",
    "Great teachers empathize with kids, respect them, and believe that each one has something special."
];

if (regRole) {
    regRole.addEventListener('change', (e) => {
        const role = e.target.value;
        if (role === 'student') {
            overlayTitle.textContent = "Hello student";
            overlayQuote.textContent = studentQuotes[Math.floor(Math.random() * studentQuotes.length)];
        } else if (role === 'teacher') {
            overlayTitle.textContent = "Hello teacher";
            overlayQuote.textContent = teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)];
        } else {
            overlayTitle.textContent = "Hello, Friend!";
        }
    });
}

// Logic for Login email typing to update quote
const loginEmailInput = document.getElementById('loginEmail');
let typingTimer;

if (loginEmailInput) {
    loginEmailInput.addEventListener('input', (e) => {
        clearTimeout(typingTimer);
        const email = e.target.value.trim();

        if (email.length > 5 && email.includes('@')) {
            typingTimer = setTimeout(async () => {
                try {
                    const res = await fetch('/api/auth/check-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();

                    if (data.role === 'student') {
                        overlayTitle.textContent = "Hello student";
                        overlayQuote.textContent = studentQuotes[Math.floor(Math.random() * studentQuotes.length)];
                    } else if (data.role === 'teacher') {
                        overlayTitle.textContent = "Hello teacher";
                        overlayQuote.textContent = teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)];
                    } else {
                        overlayTitle.textContent = "Hello, Friend!";
                        overlayQuote.textContent = "Enter your personal details and start your learning journey with us";
                    }
                } catch (err) {
                    console.error("Could not check role", err);
                }
            }, 600); // 600ms debounce
        } else {
            // Revert back to default immediately if they backspace the whole email
            overlayTitle.textContent = "Hello, Friend!";
            overlayQuote.textContent = "Enter your personal details and start your learning journey with us";
        }
    });
}

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

const toast = document.getElementById('toast');

// Custom notification system
function showToast(message, type = 'success') {
    toast.textContent = message;

    // Reset classes
    toast.className = 'toast';

    // Force DOM reflow to restart animation if triggered again quickly
    void toast.offsetWidth;

    toast.classList.add('show', type);

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Handle Registration Flow
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Registration successful! Please check your email to verify your account.', 'success');
            setTimeout(() => {
                container.classList.remove("right-panel-active");
                document.getElementById('registerForm').reset();
            }, 3000);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Server error during registration', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Handle Login Flow
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Authenticating...';
    submitBtn.disabled = true;

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(`Welcome back, ${data.user.name}! (${data.user.role})`, 'success');

            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(data.user));

            // Transform the login form to show logged-in state
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 800);
        } else {
            showToast(data.message || 'Login failed Check your credentials.', 'error');
        }
    } catch (err) {
        showToast('Server error during login', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
});
