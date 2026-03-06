// Expose initialization globally so dashboard can trigger it after injection
window.initPlanningApp = function () {
    // Current System State (Mocked to match screenshots)
    const TODAY = new Date();

    // View State
    let currentView = 'Month';
    let viewDate = new Date(TODAY); // The date we are currently looking at
    let currentMiniMonthDate = new Date(TODAY); // Independent state for mini-calendar

    // Day & Month Names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Events Data Placeholder
    let events = [];

    // Get user from localStorage
    let user = null;
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
        user = JSON.parse(userDataStr);
    }

    init();

    async function init() {
        if (!user) {
            console.warn("User not logged in, cannot fetch events.");
            return;
        }

        try {
            const res = await fetch(`/api/events/${user.id}`);
            if (res.ok) {
                const dbEvents = await res.json();
                // Map _id to id for local usage
                events = dbEvents.map(e => ({ ...e, id: e._id }));
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        }

        setupViewToggles();
        setupModals();
        setupNavigation();
        updateAllViews();
        setupDayTimelineStructure(); // Set up the empty timeslots for Day View once
    }

    // === UTILS ===
    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d;
    }

    // === NAVIGATION AND EVENTS ===
    function setupNavigation() {
        // Main view navigation
        document.querySelectorAll('.header-nav .nav-btn, .header-nav .today-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.textContent;
                if (text === 'Today') {
                    viewDate = new Date(TODAY);
                } else if (text === '<') {
                    navigateView(-1);
                } else if (text === '>') {
                    navigateView(1);
                }
                updateAllViews();
            });
        });

        // Search fake button
        document.querySelector('.search-icon-wrapper').addEventListener('click', () => {
            alert('Search functionality coming soon!');
        });

        // Settings checkboxes dummy
        document.querySelectorAll('.checkbox-container input').forEach(box => {
            box.addEventListener('change', (e) => {
                // In a real app this would filter the events array and call updateAllViews()
                updateAllViews();
            });
        });
    }

    function navigateView(direction) {
        if (currentView === 'Day') {
            viewDate.setDate(viewDate.getDate() + direction);
        } else if (currentView === 'Week') {
            viewDate.setDate(viewDate.getDate() + (direction * 7));
        } else if (currentView === 'Month') {
            viewDate.setMonth(viewDate.getMonth() + direction);
        } else if (currentView === 'Year') {
            viewDate.setFullYear(viewDate.getFullYear() + direction);
        }
    }

    // === VIEW TOGGLING ===
    function setupViewToggles() {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        const viewContainers = {
            'Day': document.getElementById('view-day'),
            'Week': document.getElementById('view-week'),
            'Month': document.getElementById('view-month'),
            'Year': document.getElementById('view-year')
        };

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentView = btn.dataset.view;

                Object.values(viewContainers).forEach(container => {
                    if (container) container.style.display = 'none';
                });

                if (viewContainers[currentView]) {
                    viewContainers[currentView].style.display = 'flex';
                    viewContainers[currentView].style.flexDirection = 'column';
                    updateAllViews();
                }
            });
        });
    }

    // === MASTER RENDER ===
    function updateAllViews() {
        // Sync mini calendar to main view date only if we navigated month/year in main views
        if (currentMiniMonthDate.getFullYear() !== viewDate.getFullYear() ||
            currentMiniMonthDate.getMonth() !== viewDate.getMonth()) {
            currentMiniMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        }

        renderMiniCalendar(currentMiniMonthDate);

        if (currentView === 'Day') renderDayView(viewDate);
        if (currentView === 'Week') renderWeekView(viewDate);
        if (currentView === 'Month') renderMonthGrid(viewDate);
        if (currentView === 'Year') renderYearView(viewDate);
    }

    // === YEAR VIEW ===
    function renderYearView(date) {
        const year = date.getFullYear();
        document.getElementById('yearDateDisplay').textContent = year;

        const container = document.getElementById('yearCalendarGrid');
        container.innerHTML = '';

        for (let m = 0; m < 12; m++) {
            const monthWrapper = document.createElement('div');
            monthWrapper.style.display = 'flex';
            monthWrapper.style.flexDirection = 'column';

            const monthTitle = document.createElement('div');
            monthTitle.textContent = monthNames[m];
            monthTitle.style.color = (m === TODAY.getMonth() && year === TODAY.getFullYear()) ? 'var(--accent-red)' : 'var(--text-primary)';
            monthTitle.style.fontWeight = '600';
            monthTitle.style.fontSize = '14px';
            monthTitle.style.marginBottom = '8px';
            monthWrapper.appendChild(monthTitle);

            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            grid.style.textAlign = 'center';
            grid.style.gap = '2px';
            grid.style.fontSize = '10px';

            // headers
            dayNames.forEach(d => {
                const dn = document.createElement('div');
                dn.textContent = d.charAt(0);
                dn.style.color = 'var(--text-secondary)';
                grid.appendChild(dn);
            });

            const firstDayOfMonth = new Date(year, m, 1);
            const startingDayOfWeek = firstDayOfMonth.getDay();
            const lastDayOfMonth = new Date(year, m + 1, 0);
            const totalDays = lastDayOfMonth.getDate();

            // blank cells
            for (let b = 0; b < startingDayOfWeek; b++) {
                grid.appendChild(document.createElement('div'));
            }

            for (let i = 1; i <= totalDays; i++) {
                const c = document.createElement('div');
                c.textContent = i;
                c.style.padding = '2px';

                const cDate = new Date(year, m, i);
                if (isSameDate(cDate, TODAY)) {
                    c.style.backgroundColor = 'var(--accent-red)';
                    c.style.color = 'white';
                    c.style.borderRadius = '50%';
                    c.style.fontWeight = 'bold';
                }

                // Clicking a day in Year view switches to Day view
                c.style.cursor = 'pointer';
                c.addEventListener('click', () => {
                    viewDate = cDate;
                    document.querySelector('.toggle-btn[data-view="Day"]').click();
                });

                grid.appendChild(c);
            }

            monthWrapper.appendChild(grid);
            container.appendChild(monthWrapper);
        }
    }

    // === DAY VIEW ===
    function renderDayView(date) {
        document.getElementById('currentDateDisplay').innerHTML = `${date.getDate()} ${monthNames[date.getMonth()]} <span class="year">${date.getFullYear()}</span>`;
        document.getElementById('currentDayDisplay').textContent = fullDayNames[date.getDay()];

        const allDayContent = document.querySelector('#view-day .all-day-content');
        allDayContent.innerHTML = '';

        const dayTimeline = document.getElementById('dayTimeline');
        // Clear old events and red line
        dayTimeline.querySelectorAll('.event, .current-time-line').forEach(el => el.remove());

        const ds = formatDateStr(date);
        const todaysEvents = events.filter(e => e.date === ds);

        todaysEvents.forEach(ev => {
            if (ev.allDay) {
                // All day event block
                const evDiv = document.createElement('div');
                evDiv.style.backgroundColor = '#dbeafe';
                evDiv.style.color = '#1d4ed8';
                evDiv.style.fontSize = '11px';
                evDiv.style.padding = '2px 6px';
                evDiv.style.borderRadius = '4px';
                evDiv.style.margin = '2px';
                evDiv.style.fontWeight = '500';
                evDiv.style.display = 'inline-block';
                evDiv.style.cursor = 'pointer';
                evDiv.innerHTML = `★ ${ev.title}`;

                evDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventDetails(ev);
                });

                allDayContent.appendChild(evDiv);
            } else {
                // Timed event
                const startParts = ev.start.split(':');
                const startH = parseInt(startParts[0], 10);
                const startM = parseInt(startParts[1], 10);

                const endParts = ev.end.split(':');
                const endH = parseInt(endParts[0], 10);
                const endM = parseInt(endParts[1], 10);

                if (startH >= 5 && startH <= 23) {
                    const bg = ev.colorCls === 'gray-circle' ? '#a3a3a3' : '#af52de';
                    addEventToTimeline(dayTimeline, ev, bg);
                }
            }
        });

        // Render Red Line if viewing today
        if (isSameDate(date, TODAY)) {
            const timeLine = document.createElement('div');
            timeLine.className = 'current-time-line';
            const h = TODAY.getHours();
            const m = TODAY.getMinutes();
            if (h >= 5 && h <= 23) {
                const topPx = (h - 5) * 60 + m;
                timeLine.style.top = `${topPx}px`;

                let dh = h > 12 ? h - 12 : h;
                if (dh === 0) dh = 12;
                const dm = m.toString().padStart(2, '0');
                timeLine.innerHTML = `<span class="current-time-badge">${dh}:${dm}</span>`;
                dayTimeline.appendChild(timeLine);
            }
        }
    }

    function setupDayTimelineStructure() {
        const dayTimeline = document.getElementById('dayTimeline');
        dayTimeline.innerHTML = ''; // Start pristine
        for (let i = 5; i < 24; i++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.hour = i;
            let displayHour = i > 12 ? i - 12 : i;
            if (displayHour === 0) displayHour = 12;
            let ampm = i >= 12 ? 'PM' : 'AM';
            if (i === 12) {
                slot.innerHTML = `<span class="time">Midday</span>`;
            } else {
                slot.innerHTML = `<span class="time">${displayHour} <span class="ampm">${ampm}</span></span>`;
            }
            dayTimeline.appendChild(slot);
        }
    }

    function addEventToTimeline(container, evData, bg = '#007aff') {
        const startParts = evData.start.split(':');
        const startHour = parseInt(startParts[0], 10);
        const startMin = parseInt(startParts[1], 10);

        const endParts = evData.end.split(':');
        const endHour = parseInt(endParts[0], 10);
        const endMin = parseInt(endParts[1], 10);

        const duration = Math.max(((endHour * 60) + endMin) - ((startHour * 60) + startMin), 15);

        const topPx = ((startHour - 5) * 60) + startMin;
        const ev = document.createElement('div');
        ev.className = 'event';
        ev.style.backgroundColor = bg;
        ev.style.top = `${topPx}px`;
        ev.style.height = `${duration}px`;
        ev.style.cursor = 'pointer';
        ev.innerHTML = `<span style="border: 2px solid white; border-radius: 50%; width: 6px; height: 6px; display: inline-block; margin-right: 6px; margin-top:3px; flex-shrink:0;"></span> <span class="event-title">${evData.title}</span>`;

        ev.addEventListener('click', (e) => {
            e.stopPropagation();
            openEventDetails(evData);
        });

        container.appendChild(ev);
    }

    // === WEEK VIEW ===
    function renderWeekView(date) {
        document.getElementById('weekDateDisplay').innerHTML = `${monthNames[date.getMonth()]} <span class="year">${date.getFullYear()}</span>`;

        const headerRow = document.getElementById('weekHeaderRow');
        headerRow.innerHTML = '<div class="time-column-header"></div>';

        const grid = document.getElementById('weekTimelineGrid');
        grid.innerHTML = '';

        const allDayContent = document.getElementById('weekAllDayContent');
        allDayContent.innerHTML = '';
        allDayContent.style.position = 'relative';

        // Time col
        const timeCol = document.createElement('div');
        timeCol.className = 'week-time-col';
        for (let i = 5; i < 24; i++) {
            const slot = document.createElement('div');
            slot.style.height = '60px'; // 1 hour
            slot.style.position = 'relative';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            let displayHour = i > 12 ? i - 12 : i;
            if (displayHour === 0) displayHour = 12;
            let ampm = i >= 12 ? 'PM' : 'AM';
            if (i === 12) {
                timeSpan.innerHTML = `Midday`;
            } else {
                timeSpan.innerHTML = `${displayHour} <span class="ampm">${ampm}</span>`;
            }
            timeSpan.style.position = 'absolute';
            timeSpan.style.top = '-6px';
            timeSpan.style.right = '8px';
            timeSpan.style.background = 'white';

            slot.appendChild(timeSpan);
            timeCol.appendChild(slot);
        }
        grid.appendChild(timeCol);

        // Find Start of Week
        const startOfWeek = getStartOfWeek(date);

        // Populate 7 days
        for (let i = 0; i < 7; i++) {
            const colDate = new Date(startOfWeek);
            colDate.setDate(colDate.getDate() + i);
            const isToday = isSameDate(colDate, TODAY);
            const colDs = formatDateStr(colDate);

            // Header
            const hCol = document.createElement('div');
            hCol.className = 'week-day-header';
            if (isToday) hCol.classList.add('today');
            hCol.innerHTML = `${dayNames[i]} <span class="date-num">${colDate.getDate()}</span>`;
            headerRow.appendChild(hCol);

            // Column Timeline
            const dCol = document.createElement('div');
            dCol.className = 'week-day-col';

            if (isToday) {
                const h = TODAY.getHours();
                const m = TODAY.getMinutes();
                if (h >= 5 && h <= 23) {
                    const rl = document.createElement('div');
                    rl.className = 'current-time-line';
                    rl.style.left = '0';
                    rl.style.top = `${(h - 5) * 60 + m}px`;
                    dCol.appendChild(rl);
                }
            }

            // Timed events for this column
            const timedEvents = events.filter(e => e.date === colDs && !e.allDay);
            timedEvents.forEach(ev => {
                const startParts = ev.start.split(':');
                const startH = parseInt(startParts[0], 10);
                const startM = parseInt(startParts[1], 10);
                const endParts = ev.end.split(':');
                const endH = parseInt(endParts[0], 10);
                const endM = parseInt(endParts[1], 10);

                if (startH >= 5 && startH <= 23) {
                    const dur = ((endH * 60) + endM) - ((startH * 60) + startM);
                    const evObj = document.createElement('div');
                    evObj.className = 'event';
                    evObj.style.left = '5px';
                    evObj.style.right = '5px';
                    evObj.style.top = `${(startH - 5) * 60 + startM}px`;
                    evObj.style.height = `${Math.max(dur, 15)}px`;
                    evObj.style.backgroundColor = ev.colorCls === 'gray-circle' ? '#a3a3a3' : '#af52de';
                    evObj.innerHTML = `<span style="border: 2px solid white; border-radius: 50%; width: 6px; height: 6px; display: inline-block; margin-right: 6px; margin-top:3px; flex-shrink:0;"></span> <span class="event-title">${ev.title}</span>`;

                    evObj.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEventDetails(ev);
                    });

                    dCol.appendChild(evObj);
                }
            });

            grid.appendChild(dCol);

            // All day content for this day
            const allDayEvals = events.filter(e => e.date === colDs && e.allDay);
            allDayEvals.forEach((ev, idx) => {
                const evDiv = document.createElement('div');
                evDiv.style.position = 'absolute';
                evDiv.style.left = `calc(${(i / 7) * 100}% + 4px)`;
                evDiv.style.width = `calc(${(1 / 7) * 100}% - 8px)`;
                evDiv.style.top = `${2 + (idx * 20)}px`;
                evDiv.style.backgroundColor = '#dbeafe';
                evDiv.style.color = '#1d4ed8';
                evDiv.style.fontSize = '11px';
                evDiv.style.padding = '2px 6px';
                evDiv.style.borderRadius = '12px';
                evDiv.style.fontWeight = '500';
                evDiv.style.cursor = 'pointer';
                evDiv.innerHTML = `★ ${ev.title}`;

                evDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventDetails(ev);
                });

                allDayContent.appendChild(evDiv);
            });
        }
    }

    // === MONTH VIEW ===
    function renderMonthGrid(date) {
        document.getElementById('monthDateDisplay').innerHTML = `${monthNames[date.getMonth()]} <span class="year">${date.getFullYear()}</span>`;
        const monthGrid = document.getElementById('monthGridLarge');
        monthGrid.innerHTML = '';

        const year = date.getFullYear();
        const month = date.getMonth();

        // Find start padded days
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0-6

        // Find total days
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const totalDays = lastDayOfMonth.getDate();

        // 35 or 42 cells? Default to 35, bump to 42 if days spill over
        const cellsNeeded = (startingDayOfWeek + totalDays > 35) ? 42 : 35;

        // Loop and build
        let pointerDate = new Date(year, month, 1 - startingDayOfWeek); // Starts on prev month

        for (let i = 0; i < cellsNeeded; i++) {
            const cellDate = new Date(pointerDate);
            const isCurrentMonth = cellDate.getMonth() === month;
            const ds = formatDateStr(cellDate);

            const cell = document.createElement('div');
            cell.className = 'month-cell';
            if (!isCurrentMonth) cell.classList.add('other-month');

            // Header Row (Day Names) - top 7 cells only
            const header = document.createElement('div');
            header.className = 'month-cell-header';

            if (i < 7) {
                const dayName = document.createElement('span');
                dayName.className = 'day-name';
                dayName.textContent = dayNames[i];
                header.appendChild(dayName);
            }

            const dateNum = document.createElement('span');
            dateNum.className = 'date';
            dateNum.textContent = String(cellDate.getDate());

            if (isSameDate(cellDate, TODAY)) {
                cell.classList.add('today');
            }

            header.appendChild(dateNum);
            cell.appendChild(header);

            // Filter Events
            const daysEvents = events.filter(e => e.date === ds);
            daysEvents.forEach(ev => {
                let timeText = ev.allDay ? "" : ev.start;
                // clean up 09:00 to 9 AM just for display
                if (!ev.allDay && timeText) {
                    const hText = parseInt(timeText.split(':')[0], 10);
                    let dp = hText > 12 ? hText - 12 : hText;
                    if (dp === 0) dp = 12;
                    let amText = hText >= 12 ? 'PM' : 'AM';
                    timeText = `${dp} ${amText}`;
                }

                const evNode = document.createElement('div');
                evNode.className = 'month-event';
                if (ev.colorCls === 'gray-circle' || !ev.allDay) {
                    const bg = ev.colorCls === 'gray-circle' ? '#a3a3a3' : '#007aff';
                    evNode.style.backgroundColor = bg;
                    evNode.style.color = 'white';
                    evNode.style.display = 'flex';
                    evNode.style.justifyContent = 'space-between';
                    evNode.innerHTML = `<span style="display:flex;align-items:center;"><span class="dot" style="background:transparent; border: 2px solid white;"></span> ${ev.title}</span><span>${timeText}</span>`;
                } else {
                    evNode.style.backgroundColor = '#dbeafe';
                    evNode.style.color = '#1d4ed8';
                    evNode.innerHTML = `<span class="star">★</span> <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${ev.title}</span>`;
                }

                evNode.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventDetails(ev);
                });

                cell.appendChild(evNode);
            });

            monthGrid.appendChild(cell);
            pointerDate.setDate(pointerDate.getDate() + 1);
        }
    }

    // === MINI CALENDAR ===
    function renderMiniCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        document.getElementById('miniMonthYear').textContent = `${monthNames[month]} ${year}`;

        const grid = document.getElementById('miniCalendarGrid');
        grid.innerHTML = '';

        dayNames.forEach(d => {
            const h = document.createElement('div');
            h.className = 'day-name';
            h.textContent = d.charAt(0);
            grid.appendChild(h);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();

        let pointerDate = new Date(year, month, 1 - startingDayOfWeek);

        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(pointerDate);
            const isCurrentMonth = cellDate.getMonth() === month;

            const cell = document.createElement('div');
            cell.className = 'day';
            cell.textContent = cellDate.getDate();

            if (!isCurrentMonth) cell.classList.add('prev-month');

            // Note: In Apple Calendar, mini calendar "active" indicates selected date 
            if (isSameDate(cellDate, TODAY)) {
                cell.classList.add('active');
            }

            // Clicking mini calendar jumps global viewDate
            cell.addEventListener('click', () => {
                viewDate = new Date(cellDate);
                updateAllViews();
            });

            grid.appendChild(cell);
            pointerDate.setDate(pointerDate.getDate() + 1);
        }
    }

    // === ADD EVENT MODAL ===
    function setupModals() {
        const addBtn = document.querySelector('.add-btn');
        const modal = document.getElementById('addEventModal');
        const cancelBtn = document.getElementById('cancelEventBtn');
        const saveBtn = document.getElementById('saveEventBtn');

        // Mini calendar nav
        document.getElementById('miniPrev').addEventListener('click', () => {
            currentMiniMonthDate.setMonth(currentMiniMonthDate.getMonth() - 1);
            renderMiniCalendar(currentMiniMonthDate);
        });
        document.getElementById('miniNext').addEventListener('click', () => {
            currentMiniMonthDate.setMonth(currentMiniMonthDate.getMonth() + 1);
            renderMiniCalendar(currentMiniMonthDate);
        });

        addBtn.addEventListener('click', () => {
            document.getElementById('eventTitle').value = '';

            const dateInput = document.getElementById('eventDate');
            const dateSelect = document.getElementById('eventDateSelect');

            if (currentView === 'Week') {
                dateInput.style.display = 'none';
                dateSelect.style.display = 'block';
                dateSelect.innerHTML = '';

                const startOfWeek = getStartOfWeek(viewDate);
                for (let i = 0; i < 7; i++) {
                    const colDate = new Date(startOfWeek);
                    colDate.setDate(colDate.getDate() + i);

                    const opt = document.createElement('option');
                    opt.value = formatDateStr(colDate);
                    opt.textContent = `${dayNames[i]}, ${monthNames[colDate.getMonth()]} ${colDate.getDate()}`;
                    if (isSameDate(colDate, TODAY) || i === 0) opt.selected = true;
                    dateSelect.appendChild(opt);
                }
            } else {
                dateInput.style.display = 'block';
                dateSelect.style.display = 'none';
                dateInput.value = formatDateStr(viewDate);
            }

            document.getElementById('eventStartTime').value = '09:00';
            document.getElementById('eventEndTime').value = '10:00';
            modal.style.display = 'flex';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        saveBtn.addEventListener('click', async () => {
            const title = document.getElementById('eventTitle').value.trim();
            if (!title) {
                alert('Please enter a title');
                return;
            }

            let ds = '';
            if (currentView === 'Week') {
                ds = document.getElementById('eventDateSelect').value;
            } else {
                ds = document.getElementById('eventDate').value;
                if (!ds) {
                    alert('Please select a date');
                    return;
                }
            }

            const startStr = document.getElementById('eventStartTime').value;
            const endStr = document.getElementById('eventEndTime').value;

            if (!user) {
                alert('You must be logged in to create events.');
                return;
            }

            try {
                const res = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: user.id,
                        title: title,
                        date: ds,
                        start: startStr,
                        end: endStr,
                        allDay: false, // Default to false for UI simplicity
                        colorCls: 'blue-star' // Default
                    })
                });

                if (res.ok) {
                    const newEvent = await res.json();
                    events.push({ ...newEvent, id: newEvent._id });
                    updateAllViews();
                    modal.style.display = 'none';
                } else {
                    const err = await res.json();
                    alert(`Failed to save event: ${err.message}`);
                }
            } catch (err) {
                console.error("Error creating event:", err);
                alert("An error occurred while saving the event.");
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // --- Event Details Modal ---
        const detailsModal = document.getElementById('eventDetailsModal');
        const closeDetailsBtn = document.getElementById('closeDetailsBtn');
        const deleteReminderBtn = document.getElementById('deleteReminderBtn');
        const proofUploadArea = document.getElementById('proofUploadArea');
        const proofFileInput = document.getElementById('proofFileInput');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const proofPreview = document.getElementById('proofPreview');

        let currentActiveEventId = null;

        closeDetailsBtn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === detailsModal) detailsModal.style.display = 'none';
        });

        // Trigger file input dialog on click
        proofUploadArea.addEventListener('click', () => {
            proofFileInput.click();
        });

        // Handle File Selection
        proofFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg'))) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    proofPreview.src = e.target.result;
                    proofPreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';

                    // Enable the delete button because proof is provided
                    deleteReminderBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload a valid .jpg image.');
                proofFileInput.value = '';
            }
        });

        // Delete action
        deleteReminderBtn.addEventListener('click', async () => {
            if (currentActiveEventId === null) return;

            try {
                const res = await fetch(`/api/events/${currentActiveEventId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    // Remove from global store
                    const idx = events.findIndex(e => e.id === currentActiveEventId);
                    if (idx > -1) {
                        events.splice(idx, 1);
                    }

                    updateAllViews();
                    detailsModal.style.display = 'none';
                } else {
                    const err = await res.json();
                    alert(`Failed to delete event: ${err.message}`);
                }
            } catch (err) {
                console.error("Error deleting event:", err);
                alert("An error occurred while deleting the event.");
            }
        });

        // Expose open function globally so individual view renderings can call it
        window.openEventDetails = function (ev) {
            currentActiveEventId = ev.id;

            // Populate Details
            document.getElementById('detailsEventTitle').textContent = ev.title;
            const dsObj = new Date(ev.date);
            const friendlyDate = `${fullDayNames[dsObj.getDay()]}, ${monthNames[dsObj.getMonth()]} ${dsObj.getDate()}`;

            if (ev.allDay) {
                document.getElementById('detailsEventTime').textContent = `${friendlyDate} • All-day`;
            } else {
                document.getElementById('detailsEventTime').textContent = `${friendlyDate} • ${ev.start} - ${ev.end}`;
            }

            // Reset upload UI
            proofFileInput.value = '';
            proofPreview.style.display = 'none';
            proofPreview.src = '';
            uploadPlaceholder.style.display = 'block';
            deleteReminderBtn.disabled = true;

            detailsModal.style.display = 'flex';
        };
    }
};
