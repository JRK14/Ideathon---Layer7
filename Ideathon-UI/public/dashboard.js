document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch User Data to Populate Dashboard
    try {
        const userDataStr = localStorage.getItem('user');

        if (userDataStr) {
            const user = JSON.parse(userDataStr);
            setUserProfile(user);
        } else {
            // Unauthenticated - Redirect to login
            window.location.href = '/';
        }
    } catch (err) {
        console.error("Error loading user profile", err);
        window.location.href = '/';
    }

    // 2. Setup Navigation Tab Switching
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.style.display = 'none');

            // Set active to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';

            // Special handling for loading Planning dynamically
            if (targetId === 'planning-tab' && !window.planningLoaded) {
                loadPlanningApplication();
            }
        });
    });

    // 3. Handle Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    });
});

function setUserProfile(user) {
    document.getElementById('navUserName').textContent = user.name || 'User Name';
    document.getElementById('navUserRole').textContent = user.role || 'Role';

    // Initials logic
    if (user.name) {
        const parts = user.name.split(' ');
        let initials = parts[0][0];
        if (parts.length > 1) initials += parts[1][0];
        document.getElementById('navUserInitials').textContent = initials.toUpperCase();
    }

    document.getElementById('dashboardWelcome').textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
}

// 4. Dynamically load planning.html content and planning.js
async function loadPlanningApplication() {
    try {
        // Fetch raw HTML of the planning app
        const res = await fetch('/planning.html');
        const htmlText = await res.text();

        // Extract just the inner parts (ignore html/head/body tags)
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Grab the app container
        const appContainer = doc.querySelector('.app-container');

        // Grab the modals
        const addEventModal = doc.getElementById('addEventModal');
        const detailsModal = doc.getElementById('eventDetailsModal');

        // Inject into dashboard
        const injectionTarget = document.getElementById('planningAppInjectionPlaceholder');
        injectionTarget.appendChild(appContainer);

        const modalsContainer = document.getElementById('modalsContainer');
        if (addEventModal) modalsContainer.appendChild(addEventModal);
        if (detailsModal) modalsContainer.appendChild(detailsModal);

        // Load planning.js script manually so it executes AFTER dom insertion
        if (!window.planningScriptInjected) {
            const scriptEl = document.createElement('script');
            scriptEl.src = 'planning.js';
            scriptEl.onload = () => {
                if (window.initPlanningApp) {
                    window.initPlanningApp();
                    window.planningLoaded = true;
                }
            };
            document.body.appendChild(scriptEl);
            window.planningScriptInjected = true;
        } else if (window.initPlanningApp && !window.planningLoaded) {
            window.initPlanningApp();
            window.planningLoaded = true;
        }
    } catch (err) {
        console.error("Failed to load planning tab:", err);
    }
}
