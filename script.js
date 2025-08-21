// Fitness Tracker Dashboard JavaScript


'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  // Sidebar navigation
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      activateSection(item.dataset.section);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateSection(item.dataset.section);
      }
    });
  });

  function activateSection(sectionId) {
    navItems.forEach((el) => {
      el.classList.toggle('active', el.dataset.section === sectionId);
      if (el.dataset.section === sectionId) {
        el.setAttribute('aria-current', 'page');
      } else {
        el.removeAttribute('aria-current');
      }
    });
    sections.forEach((sec) => {
      sec.hidden = sec.id !== sectionId;
      sec.classList.toggle('active', sec.id === sectionId);
    });
  }

  /*** THEME TOGGLE ***/
  const themeToggle = document.getElementById('themeToggle');
  let currentTheme = localStorage.getItem('theme') || 'light';

  function applyTheme(theme) {
    if (theme === 'dark') {
      app.classList.add('dark-theme');
      app.classList.remove('light-theme');
      themeToggle.textContent = '🌜';
    } else {
      app.classList.add('light-theme');
      app.classList.remove('dark-theme');
      themeToggle.textContent ='☀️';
    }
  }
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
  });

  /*** STATS & PROGRESS CARDS ***/

  const dashboardCardsContainer = document.getElementById('dashboardCards');

  const statsData = [
    {
      id: 'steps',
      label: 'Steps',
      value: 9050,
      goal: 10000,
      icon:'<FontAwesomeIcon icon={faPersonWalking} />',
     
    },
    {
      id: 'calories',
      label: 'Calories',
      value: 480,
      goal: 600,
      icon:'<FontAwesomeIcon icon={faPersonWalking} />'
      
    },
    {
      id: 'distance',
      label: 'Distance (km)',
      value: 6.3,
      goal: 8,
      icon:'<FontAwesomeIcon icon={faPersonWalking} />'
      
    },
    {
      id: 'activeMinutes',
      label: 'Active Minutes',
      value: 42,
      goal: 60,
      icon:'<FontAwesomeIcon icon={faPersonWalking} />'
      
    },
    {
      id: 'heartRate',
      label: 'Heart Rate',
      value: 75,
      goal: 130,
      icon:'<FontAwesomeIcon icon={faPersonWalking} />'
      
    },
  ];

  function renderStatsCards() {
    dashboardCardsContainer.innerHTML = '';
    statsData.forEach((stat) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('draggable', true);
      card.dataset.id = stat.id;
      card.setAttribute('aria-label', `${stat.label}: ${stat.value}`);

      const progressPercent = Math.min(
        Math.round((stat.value / stat.goal) * 100),
        100
      );

      card.innerHTML = `
        <h4>${stat.icon} ${stat.label}</h4>
        <div class="number animate-number" aria-live="polite" aria-atomic="true" data-value="${stat.value}">${stat.value}</div>
        <div class="progress-bar-bg" aria-hidden="true">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <small>Goal: ${stat.goal}</small>
      `;
      dashboardCardsContainer.appendChild(card);
    });
  }
  renderStatsCards();

  function animateNumbers() {
    const numbers = dashboardCardsContainer.querySelectorAll('.number');
    numbers.forEach((numEl) => {
      const targetValue = parseFloat(numEl.dataset.value);
      if (isNaN(targetValue)) return;

      let current = 0;
      let increment = targetValue / 60;

      if (targetValue < 1) increment = targetValue / 30;

      const display = () => {
        current += increment;
        if (current >= targetValue) {
          numEl.textContent = targetValue.toFixed(1).replace(/\.0$/, '') || 0;
        } else {
          numEl.textContent = current.toFixed(1).replace(/\.0$/, '') || 0;
          requestAnimationFrame(display);
        }
      };

      display();
    });
  }
  animateNumbers();

  /*** DRAG & DROP FOR DASHBOARD CARDS ***/
  let draggedCard = null;

  dashboardCardsContainer.addEventListener('dragstart', (e) => {
    const target = e.target.closest('.card');
    if (!target) return;
    draggedCard = target;
    target.classList.add('dragging');
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', target.dataset.id);
  });

  dashboardCardsContainer.addEventListener('dragend', (e) => {
    if (draggedCard) draggedCard.classList.remove('dragging');
    draggedCard = null;
  });

  dashboardCardsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(dashboardCardsContainer, e.clientX, e.clientY);
    if (afterElement == null) {
      dashboardCardsContainer.appendChild(draggedCard);
    } else {
      dashboardCardsContainer.insertBefore(draggedCard, afterElement);
    }
  });

  function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /*** WORKOUTS SECTION ***/

  const workoutListEl = document.getElementById('workoutList');
  const workoutForm = document.getElementById('workoutForm');
  const workoutNameInput = document.getElementById('newWorkoutName');
  const workoutTypeSelect = document.getElementById('newWorkoutType');
  const workoutFilters = document.querySelectorAll('.filter-btn');

  let workouts = [
    { id: 1, name: 'Morning Run', type: 'cardio' },
    { id: 2, name: 'Weight Lifting', type: 'strength' },
    { id: 3, name: 'Yoga Stretch', type: 'flexibility' },
  ];

  let currentWorkoutFilter = 'all';

  function renderWorkoutList() {
    workoutListEl.innerHTML = '';

    let filteredWorkouts = workouts;
    if (currentWorkoutFilter !== 'all') {
      filteredWorkouts = workouts.filter((w) => w.type === currentWorkoutFilter);
    }

    if (filteredWorkouts.length === 0) {
      workoutListEl.innerHTML = '<li>No workouts found.</li>';
      return;
    }

    filteredWorkouts.forEach((w) => {
      const li = document.createElement('li');
      li.className = 'workout-item';
      li.setAttribute('draggable', 'false');
      li.innerHTML = `
        ${w.name} <span class="type">(${capitalize(w.type)})</span>
        <button aria-label="Remove workout ${w.name}" title="Remove Workout">&times;</button>
      `;

      const btn = li.querySelector('button');
      btn.addEventListener('click', () => {
        removeWorkout(w.id);
      });

      workoutListEl.appendChild(li);
    });
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function removeWorkout(id) {
    workouts = workouts.filter((w) => w.id !== id);
    renderWorkoutList();
    showNotification('Workout removed');
    checkAchievementsAndUpdate();
    updateCalendarActivities();
  }

  workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = workoutNameInput.value.trim();
    const type = workoutTypeSelect.value;
    if (!name || !type) return;

    workouts.push({
      id: Date.now(),
      name,
      type,
    });

    workoutNameInput.value = '';
    workoutTypeSelect.value = '';
    renderWorkoutList();
    showNotification('Workout added');
    checkAchievementsAndUpdate();
    updateCalendarActivities();
  });

  workoutFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      workoutFilters.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentWorkoutFilter = btn.dataset.filter;
      renderWorkoutList();
    });
  });

  renderWorkoutList();

  /*** NUTRITION TRACKER ***/

  const mealCardsContainer = document.getElementById('mealCards');
  const nutritionForm = document.getElementById('nutritionForm');

  const mealNameInput = document.getElementById('mealName');
  const caloriesInput = document.getElementById('calories');
  const proteinInput = document.getElementById('protein');
  const carbsInput = document.getElementById('carbs');
  const fatsInput = document.getElementById('fats');

  let meals = [
    {
      id: 1,
      name: 'Breakfast - Oatmeal',
      calories: 320,
      protein: 12,
      carbs: 54,
      fats: 5,
    },
    {
      id: 2,
      name: 'Lunch - Grilled Chicken Salad',
      calories: 450,
      protein: 40,
      carbs: 20,
      fats: 10,
    },
  ];

  function renderMealCards() {
    mealCardsContainer.innerHTML = '';
    if (meals.length === 0) {
      mealCardsContainer.innerHTML = '<p>No meals logged.</p>';
      return;
    }

    meals.forEach((meal) => {
      const card = document.createElement('div');
      card.className = 'meal-card';
      card.setAttribute('aria-label', `${meal.name} - Calories: ${meal.calories}, Protein: ${meal.protein}, Carbs: ${meal.carbs}, Fats: ${meal.fats}`);

      card.innerHTML = `
        <h4>${meal.name}</h4>
        <div class="meal-stats">
          <span>🔥 ${meal.calories} kcal</span>
          <span>💪 ${meal.protein} g Protein</span>
          <span>🍞 ${meal.carbs} g Carbs</span>
          <span>🥑 ${meal.fats} g Fats</span>
        </div>
        <button class="remove-btn" aria-label="Remove meal ${meal.name}">&times;</button>
      `;

      card.querySelector('.remove-btn').addEventListener('click', () => {
        meals = meals.filter((m) => m.id !== meal.id);
        renderMealCards();
        showNotification('Meal removed');
        checkAchievementsAndUpdate();
        updateCalendarActivities();
      });

      mealCardsContainer.appendChild(card);
    });
  }

  nutritionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = mealNameInput.value.trim();
    const calories = parseInt(caloriesInput.value, 10);
    const protein = parseInt(proteinInput.value, 10);
    const carbs = parseInt(carbsInput.value, 10);
    const fats = parseInt(fatsInput.value, 10);

    if (
      !name ||
      isNaN(calories) ||
      isNaN(protein) ||
      isNaN(carbs) ||
      isNaN(fats)
    ) {
      alert('Please fill all the fields correctly.');
      return;
    }

    meals.push({
      id: Date.now(),
      name,
      calories,
      protein,
      carbs,
      fats,
    });

    mealNameInput.value = '';
    caloriesInput.value = '';
    proteinInput.value = '';
    carbsInput.value = '';
    fatsInput.value = '';

    renderMealCards();
    showNotification('Meal added');
    checkAchievementsAndUpdate();
    updateCalendarActivities();
  });

  renderMealCards();

  /*** PROGRESS CHARTS ***/

  const weeklyChartCtx = document.getElementById('weeklyChart').getContext('2d');
  const monthlyChartCtx = document.getElementById('monthlyChart').getContext('2d');

  let weeklyChart = new Chart(weeklyChartCtx, {
    type: 'line',
    data: {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{
        label: 'Steps',
        data: [8000, 10000, 7500, 12000, 9000, 11000, 8500],
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
        borderColor: 'rgba(76, 175, 80, 1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 1500 },
      plugins: {
        tooltip: { enabled: true, mode: 'nearest', intersect: false },
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 2000 } },
      },
    },
  });

  let monthlyChart = new Chart(monthlyChartCtx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Calories Burned',
        data: [2800, 3100, 2650, 3000],
        backgroundColor: 'rgba(129, 199, 132, 0.5)',
        borderColor: 'rgba(129, 199, 132, 1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 1500 },
      plugins: {
        tooltip: { enabled: true, mode: 'nearest', intersect: false },
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 500 } },
      },
    },
  });

  /*** ACHIEVEMENTS / BADGES WITH DEFAULT SHOW AND CONDITIONAL NOTIFS ***/

  const achievementBadgesContainer = document.getElementById('achievementBadges');

  const unlockedAchievements = new Set();

  const achievements = [
    {
      id: 1,
      name: '10k Steps',
      icon: '🥾',
      condition: () => statsData.find((s) => s.id === 'steps').value >= 10000,
    },
    {
      id: 2,
      name: '500 Calories Burned',
      icon: '🔥',
      condition: () => statsData.find((s) => s.id === 'calories').value >= 500,
    },
    {
      id: 3,
      name: 'Active 60+ Min',
      icon: '⏱️',
      condition: () => statsData.find((s) => s.id === 'activeMinutes').value >= 60,
    },
  ];

  function showNotification(message, timeout = 3000) {
    const notificationsContainer = document.getElementById('notifications-container');
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notificationsContainer.appendChild(notif);
    setTimeout(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translateX(0)';
    }, 50);
    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateX(100%)';
      setTimeout(() => notificationsContainer.removeChild(notif), 400);
    }, timeout);
  }

  function renderAchievementBadges() {
    achievementBadgesContainer.innerHTML = '';
    achievements.forEach((ach) => {
      // Always show badges unconditionally
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.setAttribute('aria-label', `Achievement: ${ach.name}`);
      badge.textContent = ach.icon;
      achievementBadgesContainer.appendChild(badge);

      // Show notification only if condition is met and first time
      if (ach.condition()) {
        if (!unlockedAchievements.has(ach.id)) {
          showNotification(`Achievement unlocked: ${ach.name} ${ach.icon}`, 4000);
          unlockedAchievements.add(ach.id);
        }
      } else {
        unlockedAchievements.delete(ach.id);
      }
    });
  }
  renderAchievementBadges();

  function checkAchievementsAndUpdate() {
    renderAchievementBadges();
  }

  /*** DAILY ACTIVITY TIMELINE ***/

  const activityTimelineEl = document.getElementById('activityTimeline');

  const dailyActivities = [
    { time: '07:00', activity: 'Woke up' },
    { time: '07:30', activity: 'Morning run - 3 km' },
    { time: '09:00', activity: 'Breakfast: Oatmeal' },
    { time: '12:30', activity: 'Lunch: Grilled Chicken Salad' },
    { time: '16:00', activity: 'Yoga session 30 mins' },
    { time: '19:00', activity: 'Dinner - Light meal' },
    { time: '22:00', activity: 'Sleep' },
  ];

  function renderActivityTimeline() {
    activityTimelineEl.innerHTML = '';
    dailyActivities.forEach((act) => {
      const li = document.createElement('li');
      li.textContent = `${act.time} — ${act.activity}`;
      activityTimelineEl.appendChild(li);
    });
  }

  renderActivityTimeline();

  /*** INTERACTIVE CALENDAR NAVIGATION ***/

  const calendarEl = document.getElementById('calendar');
  const calendarMonthYear = document.getElementById('calendarMonthYear');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  const today = new Date();
  let displayedYear = today.getFullYear();
  let displayedMonth = today.getMonth();

  let activityDates = {};

  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  function updateCalendarActivities() {
    activityDates = {};

    workouts.forEach((w, i) => {
      let day = 3 + (i * 4);
      if (day > 28) day = 28;
      const key = `${displayedYear}-${pad(displayedMonth + 1)}-${pad(day)}`;
      if (!activityDates[key]) activityDates[key] = [];
      activityDates[key].push('Workout');
    });

    meals.forEach((m, i) => {
      let day = 7 + (i * 5);
      if (day > 28) day = 28;
      const key = `${displayedYear}-${pad(displayedMonth + 1)}-${pad(day)}`;
      if (!activityDates[key]) activityDates[key] = [];
      activityDates[key].push('Nutrition');
    });

    renderCalendar(displayedYear, displayedMonth);
  }

  function getMonthName(monthIndex) {
    const date = new Date(2000, monthIndex, 1);
    return date.toLocaleString('default', { month: 'long' });
  }

  function renderCalendar(year, month) {
    calendarEl.innerHTML = '';
    calendarMonthYear.textContent = `${getMonthName(month)} ${year}`;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarEl.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;

      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;

      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        dayEl.classList.add('today');
      }

      if (activityDates[dateKey]) {
        dayEl.classList.add('has-activity');
        dayEl.title = `Activities: ${activityDates[dateKey].join(', ')}`;
      }

      calendarEl.appendChild(dayEl);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    displayedMonth--;
    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear--;
    }
    updateCalendarActivities();
  });

  nextMonthBtn.addEventListener('click', () => {
    displayedMonth++;
    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear++;
    }
    updateCalendarActivities();
  });

  updateCalendarActivities();

  /*** MINI NOTIFICATIONS ***/

  const notificationsContainer = document.getElementById('notifications-container');

  function showNotification(message, timeout = 3000) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notificationsContainer.appendChild(notif);
    setTimeout(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translateX(0)';
    }, 50);
    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateX(100%)';
      setTimeout(() => notificationsContainer.removeChild(notif), 400);
    }, timeout);
  }
});
