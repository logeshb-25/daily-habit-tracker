// Daily Goals & Habits Tracker - JavaScript
// This app uses localStorage to save habits and progress

// App State
let habits = [];
let mainGoal = "Daily Habit Tracker";
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Elements
const mainGoalElement = document.getElementById('main-goal');
const editGoalBtn = document.getElementById('edit-goal-btn');
const monthlyPercentageElement = document.getElementById('monthly-percentage');
const habitsContainer = document.getElementById('habits-container');
const addHabitBtn = document.getElementById('add-habit-btn');
const emptyState = document.getElementById('empty-state');
const currentStreakElement = document.getElementById('current-streak');
const habitsCompletedElement = document.getElementById('habits-completed');
const totalHabitsElement = document.getElementById('total-habits');
const bestStreakElement = document.getElementById('best-streak');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const habitModal = document.getElementById('habit-modal');
const goalModal = document.getElementById('goal-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const saveHabitBtn = document.getElementById('save-habit');
const habitForm = document.getElementById('habit-form');
const closeGoalModalBtn = document.getElementById('close-goal-modal');
const cancelGoalModalBtn = document.getElementById('cancel-goal-modal');
const saveGoalBtn = document.getElementById('save-goal');
const goalForm = document.getElementById('goal-form');

// Chart Instances
let dailyChart = null;
let weeklyChart = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAppData();
    setupEventListeners();
    renderHabits();
    updateAnalytics();
    updateMonthlyProgress();
    updateStreak();
    
    // Check if it's a new month and reset progress if needed
    checkForNewMonth();
});

// Load data from localStorage
function loadAppData() {
    // Load main goal
    const savedGoal = localStorage.getItem('mainGoal');
    if (savedGoal) {
        mainGoal = savedGoal;
        mainGoalElement.textContent = mainGoal;
    }
    
    // Load habits
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
        
        // Ensure all habits have required properties
        habits.forEach(habit => {
            if (!habit.id) habit.id = generateId();
            if (!habit.completedDates) habit.completedDates = [];
            if (!habit.streak) habit.streak = 0;
            if (!habit.bestStreak) habit.bestStreak = 0;
        });
    }
    
    // Load current month/year
    const savedMonth = localStorage.getItem('currentMonth');
    const savedYear = localStorage.getItem('currentYear');
    if (savedMonth && savedYear) {
        currentMonth = parseInt(savedMonth);
        currentYear = parseInt(savedYear);
    }
}

// Save data to localStorage
function saveAppData() {
    localStorage.setItem('mainGoal', mainGoal);
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('currentMonth', currentMonth.toString());
    localStorage.setItem('currentYear', currentYear.toString());
}

// Generate unique ID for habits
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Setup event listeners
function setupEventListeners() {
    // Goal editing
    editGoalBtn.addEventListener('click', openGoalModal);
    saveGoalBtn.addEventListener('click', saveGoal);
    closeGoalModalBtn.addEventListener('click', closeGoalModal);
    cancelGoalModalBtn.addEventListener('click', closeGoalModal);
    
    // Habit management
    addHabitBtn.addEventListener('click', openHabitModal);
    closeModalBtn.addEventListener('click', closeHabitModal);
    cancelModalBtn.addEventListener('click', closeHabitModal);
    saveHabitBtn.addEventListener('click', saveHabit);
    
    // Close modals when clicking overlay
    modalOverlay.addEventListener('click', function() {
        closeHabitModal();
        closeGoalModal();
    });
}

// Open habit modal for adding/editing
function openHabitModal(habitId = null) {
    const modalTitle = document.getElementById('modal-title');
    const habitIdInput = document.getElementById('habit-id');
    
    if (habitId) {
        // Edit existing habit
        modalTitle.textContent = 'Edit Habit';
        const habit = habits.find(h => h.id === habitId);
        
        if (habit) {
            document.getElementById('habit-name').value = habit.name;
            document.getElementById('habit-category').value = habit.category;
            document.getElementById('habit-time').value = habit.time;
            habitIdInput.value = habit.id;
        }
    } else {
        // Add new habit
        modalTitle.textContent = 'Add New Habit';
        habitForm.reset();
        habitIdInput.value = '';
    }
    
    habitModal.style.display = 'block';
    modalOverlay.style.display = 'block';
}

// Close habit modal
function closeHabitModal() {
    habitModal.style.display = 'none';
    modalOverlay.style.display = 'none';
    habitForm.reset();
}

// Open goal modal
function openGoalModal() {
    document.getElementById('goal-name').value = mainGoal;
    goalModal.style.display = 'block';
    modalOverlay.style.display = 'block';
}

// Close goal modal
function closeGoalModal() {
    goalModal.style.display = 'none';
    modalOverlay.style.display = 'none';
}

// Save main goal
function saveGoal() {
    const goalName = document.getElementById('goal-name').value.trim();
    
    if (goalName) {
        mainGoal = goalName;
        mainGoalElement.textContent = mainGoal;
        saveAppData();
        closeGoalModal();
    }
}

// Save habit (add or update)
function saveHabit() {
    const habitName = document.getElementById('habit-name').value.trim();
    const habitCategory = document.getElementById('habit-category').value;
    const habitTime = document.getElementById('habit-time').value;
    const habitId = document.getElementById('habit-id').value;
    
    if (!habitName) {
        alert('Please enter a habit name');
        return;
    }
    
    if (habitId) {
        // Update existing habit
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index].name = habitName;
            habits[index].category = habitCategory;
            habits[index].time = habitTime;
        }
    } else {
        // Add new habit
        const newHabit = {
            id: generateId(),
            name: habitName,
            category: habitCategory,
            time: habitTime,
            completedDates: [],
            streak: 0,
            bestStreak: 0,
            createdAt: new Date().toISOString()
        };
        
        habits.push(newHabit);
    }
    
    saveAppData();
    renderHabits();
    updateAnalytics();
    updateMonthlyProgress();
    closeHabitModal();
}

// Render all habits
function renderHabits() {
    // Clear the container
    habitsContainer.innerHTML = '';
    
    if (habits.length === 0) {
        // Show empty state
        emptyState.style.display = 'flex';
        habitsContainer.appendChild(emptyState);
        return;
    }
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Create habit cards
    habits.forEach(habit => {
        const habitCard = createHabitCard(habit);
        habitsContainer.appendChild(habitCard);
    });
}

// Create a habit card element
function createHabitCard(habit) {
    const today = new Date().toDateString();
    const isCompletedToday = habit.completedDates.includes(today);
    const completionRate = calculateHabitCompletionRate(habit);
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.id = habit.id;
    
    // Category icon mapping
    const categoryIcons = {
        health: 'fas fa-heartbeat',
        work: 'fas fa-briefcase',
        learning: 'fas fa-graduation-cap',
        personal: 'fas fa-user',
        other: 'fas fa-ellipsis-h'
    };
    
    // Time icon mapping
    const timeIcons = {
        morning: 'fas fa-sun',
        afternoon: 'fas fa-cloud-sun',
        evening: 'fas fa-moon',
        anytime: 'fas fa-clock'
    };
    
    // Create card HTML
    card.innerHTML = `
        <div class="habit-header">
            <div class="habit-info">
                <h3>${habit.name}</h3>
                <div class="habit-meta">
                    <div class="habit-category">
                        <i class="${categoryIcons[habit.category]}"></i>
                        <span>${habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}</span>
                    </div>
                    <div class="habit-time">
                        <i class="${timeIcons[habit.time]}"></i>
                        <span>${habit.time.charAt(0).toUpperCase() + habit.time.slice(1)}</span>
                    </div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="btn-icon btn-edit" data-id="${habit.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" data-id="${habit.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="habit-progress">
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${completionRate}%"></div>
            </div>
            <div class="progress-text">${completionRate}%</div>
            <button class="tick-btn ${isCompletedToday ? 'completed' : ''}" data-id="${habit.id}">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');
    const tickBtn = card.querySelector('.tick-btn');
    
    editBtn.addEventListener('click', () => openHabitModal(habit.id));
    deleteBtn.addEventListener('click', () => deleteHabit(habit.id));
    tickBtn.addEventListener('click', () => toggleHabitCompletion(habit.id));
    
    return card;
}

// Toggle habit completion for today
function toggleHabitCompletion(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date().toDateString();
    const isCompletedToday = habit.completedDates.includes(today);
    const tickBtn = document.querySelector(`.tick-btn[data-id="${habitId}"]`);
    
    if (isCompletedToday) {
        // Remove today from completed dates
        habit.completedDates = habit.completedDates.filter(date => date !== today);
        tickBtn.classList.remove('completed');
        
        // Decrease streak if habit was completed yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (!habit.completedDates.includes(yesterdayStr)) {
            habit.streak = 0;
        }
    } else {
        // Add today to completed dates
        habit.completedDates.push(today);
        tickBtn.classList.add('completed');
        
        // Increase streak if habit was completed yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (habit.completedDates.includes(yesterdayStr)) {
            habit.streak++;
            if (habit.streak > habit.bestStreak) {
                habit.bestStreak = habit.streak;
            }
            
            // Check for streak milestones
            checkStreakMilestone(habit.streak);
        } else {
            // If not completed yesterday, reset streak to 1
            habit.streak = 1;
            if (habit.bestStreak < 1) {
                habit.bestStreak = 1;
            }
        }
    }
    
    saveAppData();
    updateProgressBar(habitId);
    updateAnalytics();
    updateMonthlyProgress();
    updateStreak();
}

// Update progress bar animation
function updateProgressBar(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const completionRate = calculateHabitCompletionRate(habit);
    const progressBar = document.querySelector(`.habit-card[data-id="${habitId}"] .progress-bar`);
    const progressText = document.querySelector(`.habit-card[data-id="${habitId}"] .progress-text`);
    
    if (progressBar && progressText) {
        // Reset width to 0 then animate to new value
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        
        // Force reflow
        progressBar.offsetHeight;
        
        // Animate to new width
        progressBar.style.transition = 'width 0.8s ease';
        progressBar.style.width = `${completionRate}%`;
        
        // Update text
        progressText.textContent = `${completionRate}%`;
    }
}

// Calculate habit completion rate for current month
function calculateHabitCompletionRate(habit) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Count how many days this habit was completed in the current month
    const completedThisMonth = habit.completedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    // Calculate percentage
    return Math.round((completedThisMonth / daysInMonth) * 100);
}

// Delete a habit
function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== habitId);
        saveAppData();
        renderHabits();
        updateAnalytics();
        updateMonthlyProgress();
        updateStreak();
    }
}

// Update monthly progress percentage
function updateMonthlyProgress() {
    if (habits.length === 0) {
        monthlyPercentageElement.textContent = '0%';
        return;
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = currentDate.getDate();
    
    // Calculate total possible completions (habits * days passed this month)
    const totalPossible = habits.length * today;
    
    // Calculate actual completions
    let totalCompleted = 0;
    
    habits.forEach(habit => {
        const completedThisMonth = habit.completedDates.filter(dateStr => {
            const date = new Date(dateStr);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        
        totalCompleted += completedThisMonth;
    });
    
    // Calculate percentage
    const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    monthlyPercentageElement.textContent = `${percentage}%`;
}

// Update streak information
function updateStreak() {
    if (habits.length === 0) {
        currentStreakElement.textContent = '0 days';
        return;
    }
    
    // Calculate current streak (minimum streak among all habits)
    let minStreak = Infinity;
    let maxBestStreak = 0;
    let completedToday = 0;
    
    habits.forEach(habit => {
        if (habit.streak < minStreak) {
            minStreak = habit.streak;
        }
        
        if (habit.bestStreak > maxBestStreak) {
            maxBestStreak = habit.bestStreak;
        }
        
        // Check if habit is completed today
        const today = new Date().toDateString();
        if (habit.completedDates.includes(today)) {
            completedToday++;
        }
    });
    
    // Update streak display
    const streak = minStreak === Infinity ? 0 : minStreak;
    currentStreakElement.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    
    // Update summary stats
    habitsCompletedElement.textContent = completedToday;
    totalHabitsElement.textContent = habits.length;
    bestStreakElement.textContent = maxBestStreak;
}

// Update analytics charts and stats
function updateAnalytics() {
    updateDailyChart();
    updateWeeklyChart();
    updateStreak();
}

// Create daily completion trend chart
function updateDailyChart() {
    const ctx = document.getElementById('daily-chart').getContext('2d');
    
    // Get last 7 days
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dateStr);
        
        // Count completions for this day
        const dateKey = date.toDateString();
        let dayCompletions = 0;
        
        habits.forEach(habit => {
            if (habit.completedDates.includes(dateKey)) {
                dayCompletions++;
            }
        });
        
        data.push(dayCompletions);
    }
    
    // Destroy existing chart if it exists
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    // Create new chart
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Habits Completed',
                data: data,
                backgroundColor: 'rgba(230, 57, 70, 0.1)',
                borderColor: '#e63946',
                borderWidth: 3,
                pointBackgroundColor: '#e63946',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: habits.length,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create weekly summary chart
function updateWeeklyChart() {
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    
    // Calculate completions for each day of the week (current week)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = new Array(7).fill(0);
    
    // Get current week's Monday
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    // Count completions for each day of the week
    habits.forEach(habit => {
        habit.completedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();
            
            // Check if date is within the current week
            const weekStart = new Date(monday);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            if (date >= weekStart && date <= weekEnd) {
                data[dayOfWeek]++;
            }
        });
    });
    
    // Destroy existing chart if it exists
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    // Create new chart
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: daysOfWeek,
            datasets: [{
                label: 'Completions',
                data: data,
                backgroundColor: '#e63946',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: habits.length,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Check for streak milestone and celebrate
function checkStreakMilestone(streak) {
    const milestones = [3, 7, 14, 21, 30, 60, 90];
    
    if (milestones.includes(streak)) {
        celebrateStreak(streak);
    }
}

// Celebrate streak milestone with confetti
function celebrateStreak(streak) {
    const confettiContainer = document.getElementById('confetti-container');
    confettiContainer.style.display = 'block';
    confettiContainer.innerHTML = '';
    
    // Create confetti
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
        confetti.style.opacity = Math.random() + 0.5;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Animation
        const animation = confetti.animate([
            { top: '-20px', opacity: 1, transform: `rotate(0deg)` },
            { top: `${Math.random() * 100 + 100}%`, opacity: 0, transform: `rotate(${Math.random() * 720}deg)` }
        ], {
            duration: Math.random() * 3000 + 2000,
            delay: Math.random() * 1000
        });
        
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        animation.onfinish = () => {
            confetti.remove();
        };
    }
    
    // Show celebration message
    setTimeout(() => {
        alert(`🎉 Amazing! You've reached a ${streak}-day streak! Keep up the great work!`);
    }, 500);
    
    // Hide confetti after 5 seconds
    setTimeout(() => {
        confettiContainer.style.display = 'none';
    }, 5000);
}

// Check if it's a new month and reset progress if needed
function checkForNewMonth() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // If month has changed, reset streaks and progress for new month
    if (currentMonth !== this.currentMonth || currentYear !== this.currentYear) {
        // Reset streaks for all habits (but keep bestStreak)
        habits.forEach(habit => {
            habit.streak = 0;
        });
        
        // Update current month/year
        this.currentMonth = currentMonth;
        this.currentYear = currentYear;
        
        // Save to localStorage
        saveAppData();
        
        // Show notification
        alert(`🎯 New month detected! Your streaks have been reset. Good luck with ${now.toLocaleDateString('en-US', { month: 'long' })}!`);
    }
}

// Export functions for debugging (optional)
window.app = {
    habits,
    mainGoal,
    saveAppData,
    loadAppData,
    renderHabits,
    updateAnalytics
};