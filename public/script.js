// Star Effort Chart JavaScript with Firebase Backend

// Firebase Firestore imports will be available globally via firebase-config.js
// Collections
const TASKS_COLLECTION = 'tasks';
const MISSIONS_COLLECTION = 'missions';
const REWARDS_COLLECTION = 'rewards';
const REDEMPTIONS_COLLECTION = 'redemptions';

// Wait for Firebase to be initialized
let isFirebaseReady = false;
let currentUser = null;

window.addEventListener('firebase-ready', () => {
    isFirebaseReady = true;
    window.isFirebaseReady = true; // Make it globally accessible
    console.log('🚀 Firebase ready for Star Effort Chart!');
    
    // Set up authentication state listener
    setupAuthStateListener();
});

// Firebase is guaranteed to be ready when these functions are called
// (page-level initialization ensures this)

// ============= AUTHENTICATION FUNCTIONS =============

// Set up authentication state listener
function setupAuthStateListener() {
    try {
        const { onAuthStateChanged } = window.authFunctions;
        const auth = window.auth;
        
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                console.log('✅ User is signed in:', user.email);
                // User is signed in, show logout button if on main pages
                showLogoutButton();
            } else {
                console.log('❌ User is signed out');
                // User is signed out, redirect to login unless already on login page
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    } catch (error) {
        console.error('Error setting up auth listener:', error);
    }
}

// Check if user is authenticated
function requireAuth() {
    if (!currentUser && !window.location.pathname.includes('login.html')) {
        console.log('🔒 Authentication required, redirecting to login...');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Show logout button in header
function showLogoutButton() {
    // Only show on main pages, not on login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // Check if logout button already exists
    if (document.getElementById('logoutBtn')) {
        return;
    }
    
    // Find the header or a suitable place to add logout button
    const header = document.querySelector('.header-buttons') || document.querySelector('header') || document.querySelector('h1');
    
    if (header) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.addEventListener('click', handleLogout);
        
        // Add to header
        if (header.classList.contains('header-buttons')) {
            header.appendChild(logoutBtn);
        } else {
            header.style.position = 'relative';
            logoutBtn.style.position = 'absolute';
            logoutBtn.style.top = '10px';
            logoutBtn.style.right = '10px';
            header.appendChild(logoutBtn);
        }
    }
}

// Handle logout
async function handleLogout() {
    try {
        const { signOut } = window.authFunctions;
        const auth = window.auth;
        
        await signOut(auth);
        console.log('👋 User signed out successfully');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// ============= FIREBASE TASK FUNCTIONS =============

// Get tasks from Firestore
async function getTasks() {
    try {
        const { collection, getDocs, query, orderBy } = window.firestoreFunctions;
        const db = window.db;
        
        const tasksQuery = query(collection(db, TASKS_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(tasksQuery);
        
        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        
        return tasks;
    } catch (error) {
        console.error('Error getting tasks:', error);
        return [];
    }
}

// Add a new task to Firestore
async function addTask(task) {
    try {
        const { collection, addDoc } = window.firestoreFunctions;
        const db = window.db;
        
        task.timestamp = new Date().toISOString();
        task.createdAt = new Date();
        
        const docRef = await addDoc(collection(db, TASKS_COLLECTION), task);
        console.log('Task added with ID: ', docRef.id);
        
        return { id: docRef.id, ...task };
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
}

// Delete a task by ID from Firestore
async function deleteTask(taskId) {
    try {
        const { doc, deleteDoc } = window.firestoreFunctions;
        const db = window.db;
        
        await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
        console.log('Task deleted:', taskId);
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Error deleting mission. Please try again.');
    }
}



// Confirm task deletion with space-themed message
async function confirmDeleteTask(taskId, taskDescription, childName) {
    const message = `🚀 Are you sure you want to abort this space mission?\n\n` +
                   `Mission: "${taskDescription}"\n` +
                   `Space Explorer: ${childName}\n\n` +
                   `⚠️ This action cannot be undone! 🌌`;
    
    if (confirm(message)) {
        await deleteTask(taskId);
        alert(`🌟 Mission successfully aborted from the space log! 🌟`);
        // Always refresh current page for the child
        renderChildTasksTable(childName, 'refresh');
    }
}

// ============= FIREBASE MISSION FUNCTIONS =============

// Get missions from Firestore
async function getMissions() {
    try {
        console.log('🔍 Getting missions from Firestore...');
        
        const { collection, getDocs, query, orderBy } = window.firestoreFunctions;
        const db = window.db;
        const missionsQuery = query(collection(db, MISSIONS_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(missionsQuery);
        
        console.log('📋 Processing query results...');
        const missions = [];
        querySnapshot.forEach((doc) => {
            missions.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Found ${missions.length} missions`);
        return missions;
    } catch (error) {
        console.error('❌ Error getting missions:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            name: error.name
        });
        
        // Return empty array so the app can continue
        return [];
    }
}

// ============= FIREBASE REWARD FUNCTIONS =============

// Get rewards from Firestore
async function getRewards() {
    try {
        const { collection, getDocs, query, orderBy } = window.firestoreFunctions;
        const db = window.db;
        const rewardsQuery = query(collection(db, REWARDS_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(rewardsQuery);
        const rewards = [];
        querySnapshot.forEach((doc) => rewards.push({ id: doc.id, ...doc.data() }));
        return rewards;
    } catch (error) {
        console.error('Error getting rewards:', error);
        return [];
    }
}

// ============= FIREBASE REDEMPTION/BALANCE FUNCTIONS =============

// Get redemptions
async function getRedemptions() {
    try {
        const { collection, getDocs, query, orderBy } = window.firestoreFunctions;
        const db = window.db;
        const q = query(collection(db, REDEMPTIONS_COLLECTION), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        return list;
    } catch (e) {
        console.error('Error getting redemptions:', e);
        return [];
    }
}

// Add a redemption (does not enforce balance in rules; enforced in UI)
async function addRedemption(redemption) {
    const { collection, addDoc } = window.firestoreFunctions;
    const db = window.db;
    redemption.timestamp = new Date().toISOString();
    redemption.createdAt = new Date();
    const docRef = await addDoc(collection(db, REDEMPTIONS_COLLECTION), redemption);
    return { id: docRef.id, ...redemption };
}

async function getTotalEarnedFromTasks() {
    const tasks = await getTasks();
    return tasks.reduce((sum, t) => sum + parseInt(t.starDollars || 0, 10), 0);
}

async function getTotalSpentFromRedemptions() {
    const redemptions = await getRedemptions();
    return redemptions.reduce((sum, r) => sum + parseInt(r.costAtRedemption || 0, 10), 0);
}

async function getCombinedBalance() {
    const [earned, spent] = await Promise.all([
        getTotalEarnedFromTasks(),
        getTotalSpentFromRedemptions()
    ]);
    return Math.max(0, earned - spent);
}

// Add a new reward
async function addReward(reward) {
    try {
        const { collection, addDoc } = window.firestoreFunctions;
        const db = window.db;
        reward.timestamp = new Date().toISOString();
        reward.createdAt = new Date();
        reward.active = reward.active !== undefined ? reward.active : true;
        const docRef = await addDoc(collection(db, REWARDS_COLLECTION), reward);
        return { id: docRef.id, ...reward };
    } catch (error) {
        console.error('Error adding reward:', error);
        throw error;
    }
}

// Update an existing reward
async function updateReward(rewardId, updatedReward) {
    try {
        const { doc, updateDoc } = window.firestoreFunctions;
        const db = window.db;
        updatedReward.updatedAt = new Date();
        await updateDoc(doc(db, REWARDS_COLLECTION, rewardId), updatedReward);
        return { id: rewardId, ...updatedReward };
    } catch (error) {
        console.error('Error updating reward:', error);
        throw error;
    }
}

// Delete a reward
async function deleteReward(rewardId) {
    try {
        const { doc, deleteDoc } = window.firestoreFunctions;
        const db = window.db;
        await deleteDoc(doc(db, REWARDS_COLLECTION, rewardId));
        return true;
    } catch (error) {
        console.error('Error deleting reward:', error);
        throw error;
    }
}

// Get active rewards only
async function getActiveRewards() {
    const rewards = await getRewards();
    return rewards.filter(r => r.active !== false);
}

// Add a new mission to Firestore
async function addMission(mission) {
    try {
        console.log('🚀 Attempting to add mission:', mission);
        
        const { collection, addDoc } = window.firestoreFunctions;
        const db = window.db;
        
        // Check if user is authenticated
        if (!currentUser) {
            console.warn('⚠️ No authenticated user found');
            throw new Error('Authentication required to add missions');
        }
        
        console.log('✅ User authenticated:', currentUser.email);
        
        mission.timestamp = new Date().toISOString();
        mission.createdAt = new Date();
        mission.active = mission.active !== undefined ? mission.active : true;
        
        console.log('📤 Sending mission to Firestore...', mission);
        const docRef = await addDoc(collection(db, MISSIONS_COLLECTION), mission);
        console.log('✅ Mission added with ID:', docRef.id);
        
        return { id: docRef.id, ...mission };
    } catch (error) {
        console.error('❌ Error adding mission:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            name: error.name
        });
        throw error;
    }
}

// Update an existing mission in Firestore
async function updateMission(missionId, updatedMission) {
    try {
        const { doc, updateDoc } = window.firestoreFunctions;
        const db = window.db;
        
        updatedMission.updatedAt = new Date();
        
        await updateDoc(doc(db, MISSIONS_COLLECTION, missionId), updatedMission);
        console.log('Mission updated:', missionId);
        
        return { id: missionId, ...updatedMission };
    } catch (error) {
        console.error('Error updating mission:', error);
        throw error;
    }
}

// Delete a mission by ID from Firestore
async function deleteMission(missionId) {
    try {
        const { doc, deleteDoc } = window.firestoreFunctions;
        const db = window.db;
        
        await deleteDoc(doc(db, MISSIONS_COLLECTION, missionId));
        console.log('Mission deleted:', missionId);
        
        // Note: We'll handle task updates differently in Firebase
        // Tasks will reference mission IDs, but we won't automatically convert them
    return true;
    } catch (error) {
        console.error('Error deleting mission:', error);
        throw error;
    }
}

// Get active missions only
async function getActiveMissions() {
    const missions = await getMissions();
    return missions.filter(mission => mission.active !== false);
}



// Confirm mission deletion
function confirmDeleteMission(missionId, missionDescription) {
    const message = `🚀 Are you sure you want to delete this mission?\n\n` +
                   `Mission: "${missionDescription}"\n\n` +
                   `⚠️ This will affect any completed tasks using this mission! 🌌`;
    
    if (confirm(message)) {
        deleteMission(missionId);
        displayMissions();
        alert(`🌟 Mission successfully deleted from Mission Control! 🌟`);
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// (removed getStarEmoji)

// Format star dollars with label, handling large values compactly
function formatStarDollars(amount) {
    const n = parseInt(amount, 10) || 0;
    if (n <= 5) return `${'⭐'.repeat(n)} ${n} Star Dollars`;
    return `⭐ × ${n} Star Dollars`;
}

// ============= PAGINATED CHILD TASKS (LAST 10 WITH NAV) =============


// Pager state per child (module-level, sequential-only)
const pagerStateByChild = new Map();
// state shape per child: { pageSize, currentPage, pageStarts: QueryDocumentSnapshot[], lastDocs: QueryDocumentSnapshot[] }

async function getTasksForChildPaginated(childName, action = 'init', pageSize = 10) {
    const { collection, getDocs, query, orderBy, where, limit, startAfter, startAt } = window.firestoreFunctions;
    const db = window.db;

    // initialize or reuse state
    let s = pagerStateByChild.get(childName);
    if (!s || s.pageSize !== pageSize) {
        s = { pageSize, currentPage: 0, pageStarts: [], lastDocs: [] };
        pagerStateByChild.set(childName, s);
    }

    // base query
    let q = query(collection(db, TASKS_COLLECTION), where('childName', '==', childName), orderBy('date', 'desc'));

    // cursor selection
    if (action === 'next' && s.lastDocs[s.currentPage]) {
        q = query(q, startAfter(s.lastDocs[s.currentPage]), limit(s.pageSize));
    } else if (action === 'prev' && s.currentPage > 0) {
        q = query(q, startAt(s.pageStarts[s.currentPage - 1]), limit(s.pageSize));
    } else if (action === 'refresh' && s.pageStarts[s.currentPage]) {
        q = query(q, startAt(s.pageStarts[s.currentPage]), limit(s.pageSize));
    } else {
        q = query(q, limit(s.pageSize));
    }

    // execute and capture cursors
    const snap = await getDocs(q);
    const tasks = [];
    let firstDoc = null;
    let lastDoc = null;
    snap.forEach((docSnap) => {
        if (!firstDoc) firstDoc = docSnap;
        lastDoc = docSnap;
        tasks.push({ id: docSnap.id, ...docSnap.data() });
    });

    // update state sequentially
    if (action === 'init') {
        s.currentPage = 0;
        s.pageStarts[0] = firstDoc || null;
        s.lastDocs[0] = lastDoc || null;
    } else if (action === 'next' && tasks.length > 0) {
        s.currentPage += 1;
        s.pageStarts[s.currentPage] = firstDoc || null;
        s.lastDocs[s.currentPage] = lastDoc || null;
    } else if (action === 'prev' && s.currentPage > 0) {
        s.currentPage -= 1;
    } else if (action === 'refresh') {
        s.pageStarts[s.currentPage] = firstDoc || s.pageStarts[s.currentPage];
        s.lastDocs[s.currentPage] = lastDoc || s.lastDocs[s.currentPage];
    }

    const pageNumber = s.currentPage;
    const hasPrev = pageNumber > 0;
    const hasNext = tasks.length === s.pageSize;

    return { tasks, pageNumber, hasPrev, hasNext };
}

async function getTotalEarnedForChild(childName) {
    try {
        const { collection, getDocs, query, where } = window.firestoreFunctions;
        const db = window.db;
        const q = query(collection(db, TASKS_COLLECTION), where('childName', '==', childName));
        const snap = await getDocs(q);
        let total = 0;
        snap.forEach((d) => { total += parseInt(d.data().starDollars || 0, 10); });
        return total;
    } catch (e) {
        console.error('Error calculating total for', childName, e);
        return 0;
    }
}

function getChildTasksDOMElements(childName) {
    const lower = childName.toLowerCase();
    const tableId = `${lower}-tasks`;
    const noTasksId = `${lower}-no-tasks`;
    const totalId = `${lower}-total`;
    return {
        tableId,
        tableBody: document.querySelector(`#${tableId} tbody`),
        tableEl: document.getElementById(tableId),
        noTasksEl: document.getElementById(noTasksId),
        totalEl: document.getElementById(totalId),
        loadingEl: document.getElementById(`${lower}-loading`),
        paginationEl: document.getElementById(`${lower}-pagination`),
        prevBtn: document.getElementById(`${lower}-prev`),
        nextBtn: document.getElementById(`${lower}-next`),
        pageInfoEl: document.getElementById(`${lower}-page-info`)
    };
}

function renderChildTasksRows(tasks, ui, childName) {
    ui.tableBody.innerHTML = '';
    tasks.forEach(task => {
        const row = ui.tableBody.insertRow();
        const dateCell = row.insertCell(0);
        dateCell.textContent = formatDate(task.date);
        const descCell = row.insertCell(1);
        descCell.textContent = task.missionDescription || task.description;
        const starsCell = row.insertCell(2);
        starsCell.innerHTML = `${formatStarDollars(task.starDollars)}`;
        const actionsCell = row.insertCell(3);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '💥 Abort';
        deleteBtn.title = 'Abort this space mission';
        deleteBtn.onclick = () => confirmDeleteTask(task.id, task.missionDescription || task.description, task.childName);
        actionsCell.appendChild(deleteBtn);
    });
}

async function renderChildTasksTable(childName, action = 'init') {
    const ui = getChildTasksDOMElements(childName);
    if (!ui || !ui.tableBody) return;
    try {
        if (ui.loadingEl) ui.loadingEl.style.display = 'block';
        const { tasks, pageNumber, hasPrev, hasNext } = await getTasksForChildPaginated(childName, action, 10);

        // Render
        if (ui.loadingEl) ui.loadingEl.style.display = 'none';
        if (tasks.length === 0 && state.currentPage === 0) {
            if (ui.noTasksEl) ui.noTasksEl.style.display = 'block';
            if (ui.tableEl) ui.tableEl.style.display = 'none';
            if (ui.paginationEl) ui.paginationEl.style.display = 'none';
        } else {
            if (ui.noTasksEl) ui.noTasksEl.style.display = 'none';
            if (ui.tableEl) ui.tableEl.style.display = 'table';
            renderChildTasksRows(tasks, ui, childName);
            if (ui.paginationEl) ui.paginationEl.style.display = 'flex';
        }

        // Update page info and buttons
        if (ui.pageInfoEl) ui.pageInfoEl.textContent = `Page ${pageNumber + 1}`;
        if (ui.prevBtn) ui.prevBtn.disabled = !hasPrev;
        if (ui.nextBtn) ui.nextBtn.disabled = !hasNext;

        // Update totals (all-time)
        const total = await getTotalEarnedForChild(childName);
        if (ui.totalEl) ui.totalEl.textContent = total;

        // If refreshing and the page is empty (due to deletions), go back one page automatically
        if ((action === 'refresh') && tasks.length === 0 && pageNumber > 0) {
            await renderChildTasksTable(childName, 'prev');
        }
    } catch (error) {
        console.error('Error loading page for', childName, error);
        if (ui.loadingEl) ui.loadingEl.style.display = 'none';
        if (ui.noTasksEl) {
            ui.noTasksEl.innerHTML = '❌ Error loading missions. Please refresh the page.';
            ui.noTasksEl.style.display = 'block';
        }
        if (ui.tableEl) ui.tableEl.style.display = 'none';
        if (ui.paginationEl) ui.paginationEl.style.display = 'none';
    }
}


// Display tasks for a specific child (Firebase version) with pagination (last 10)
async function displayTasksForChild(childName, tableId, noTasksId, totalId) {
    const ui = getChildTasksDOMElements(childName);
    // Wire pagination buttons once
    if (ui.prevBtn && !ui.prevBtn.dataset.wired) {
        ui.prevBtn.addEventListener('click', () => renderChildTasksTable(childName, 'prev'));
        ui.prevBtn.dataset.wired = 'true';
    }
    if (ui.nextBtn && !ui.nextBtn.dataset.wired) {
        ui.nextBtn.addEventListener('click', () => renderChildTasksTable(childName, 'next'));
        ui.nextBtn.dataset.wired = 'true';
    }
    return renderChildTasksTable(childName, 'init');
}

// Display all tasks on main page (Firebase version)
async function displayAllTasks() {
    if (document.getElementById('asha-tasks')) {
        const [_, __, balance] = await Promise.all([
            displayTasksForChild('ASHA', 'asha-tasks', 'asha-no-tasks', 'asha-total'),
            displayTasksForChild('EKAA', 'ekaa-tasks', 'ekaa-no-tasks', 'ekaa-total'),
            getCombinedBalance()
        ]);
        const headerBalance = document.getElementById('combined-balance-header');
        if (headerBalance) headerBalance.textContent = balance;
    }
}

// Handle form submission (Firebase version)
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const missionId = formData.get('missionId');
    
    try {
    // If using mission system
    if (missionId) {
            const missions = await getMissions();
        const selectedMission = missions.find(m => m.id == missionId);
        
        if (!selectedMission) {
            alert('🚀 Selected mission not found! Please try again. 🚀');
            return;
        }
        
        const task = {
            date: formData.get('date'),
            childName: formData.get('childName'),
            missionId: selectedMission.id,
            missionDescription: selectedMission.description,
            starDollars: selectedMission.starDollars
        };

        // Basic validation
        if (!task.date || !task.childName) {
            alert('🚀 Please fill in all mission details before launching! 🚀');
            return;
        }

        // Add task
            await addTask(task);
        
        // Show success message
        alert(`🌟 Amazing! ${task.childName} completed "${selectedMission.description}" and earned ${formatStarDollars(selectedMission.starDollars)}! 🌟`);
    } else {
        // Legacy mode - for backward compatibility
        const task = {
            date: formData.get('date'),
            childName: formData.get('childName'),
            description: formData.get('description'),
            starDollars: formData.get('starDollars')
        };

        // Basic validation
        if (!task.date || !task.childName || !task.description || !task.starDollars) {
            alert('🚀 Please fill in all mission details before launching! 🚀');
            return;
        }

        // Add task
            await addTask(task);
        
        // Show success message
        alert(`🌟 Amazing! ${task.childName} completed "${task.description}" and earned ${formatStarDollars(task.starDollars)}! 🌟`);
    }
    
    // Reset form
    form.reset();
    
    // Set today's date again
    const today = new Date().toISOString().split('T')[0];
    const taskDate = document.getElementById('task-date');
    if (taskDate) taskDate.value = today;
    
    // Hide mission preview
    const missionPreview = document.getElementById('mission-preview');
    if (missionPreview) missionPreview.style.display = 'none';
    
    // Reload missions dropdown
        await loadMissionsDropdown();
    
    // Redirect to main page after short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
        
    } catch (error) {
        console.error('Error submitting task:', error);
        alert('❌ Error saving mission. Please try again.');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission if on add task page
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }

// Add some fun animations and interactions
    // Add click animation to buttons
    const buttons = document.querySelectorAll('.btn, .add-task-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add hover effect to table rows
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            });
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });
    });
});

// ============= MISSION DISPLAY AND MANAGEMENT UI =============

// Display missions in the manage missions page (Firebase version)
async function displayMissions() {
    console.log('🎯 Starting displayMissions...');
    
    const missionsTable = document.getElementById('missions-table');
    const noMissionsDiv = document.getElementById('no-missions');
    const activeCountSpan = document.getElementById('active-missions-count');
    const inactiveCountSpan = document.getElementById('inactive-missions-count');
    const loadingDiv = document.getElementById('missions-loading');
    
    if (!missionsTable) {
        console.log('❌ Missions table not found, exiting...');
        return; // Exit if not on missions page
    }
    
    try {
        // Show loading state
        if (loadingDiv) loadingDiv.style.display = 'block';
        
        console.log('🔄 Calling getMissions...');
        const missions = await getMissions();
        console.log('✅ Got missions, sorting...');
        
        // Hide loading state
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        const sortedMissions = missions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const tableBody = missionsTable.querySelector('tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
        if (sortedMissions.length === 0) {
        noMissionsDiv.style.display = 'block';
        missionsTable.style.display = 'none';
    } else {
        noMissionsDiv.style.display = 'none';
        missionsTable.style.display = 'table';
        
            sortedMissions.forEach(mission => {
            const row = tableBody.insertRow();
            
            // Description cell
            const descCell = row.insertCell(0);
            descCell.textContent = mission.description;
            
            // Star dollars cell
            const starsCell = row.insertCell(1);
            starsCell.innerHTML = `${formatStarDollars(mission.starDollars)}`;
            
            // Status cell
            const statusCell = row.insertCell(2);
            const statusSpan = document.createElement('span');
            statusSpan.className = mission.active !== false ? 'status-active' : 'status-inactive';
            statusSpan.textContent = mission.active !== false ? '🚀 Active' : '⏸️ Inactive';
            statusCell.appendChild(statusSpan);
            
            // Actions cell
            const actionsCell = row.insertCell(3);
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-small btn-edit';
            editBtn.innerHTML = '✏️ Edit';
            editBtn.onclick = () => editMission(mission.id);
            
            // Toggle status button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn-small btn-toggle';
            toggleBtn.innerHTML = mission.active !== false ? '⏸️' : '🚀';
            toggleBtn.title = mission.active !== false ? 'Deactivate mission' : 'Activate mission';
            toggleBtn.onclick = () => toggleMissionStatus(mission.id);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-small btn-delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete mission';
            deleteBtn.onclick = () => confirmDeleteMission(mission.id, mission.description);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(toggleBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Update counts
        const activeMissions = sortedMissions.filter(m => m.active !== false);
        const inactiveMissions = sortedMissions.filter(m => m.active === false);
    
    if (activeCountSpan) activeCountSpan.textContent = activeMissions.length;
    if (inactiveCountSpan) inactiveCountSpan.textContent = inactiveMissions.length;
    } catch (error) {
        console.error('Error displaying missions:', error);
        
        // Hide loading state
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        if (noMissionsDiv) {
            noMissionsDiv.innerHTML = '❌ Error loading missions. Please refresh the page.';
            noMissionsDiv.style.display = 'block';
        }
        if (missionsTable) {
            missionsTable.style.display = 'none';
        }
    }
}

// ============= REWARD DISPLAY AND MANAGEMENT UI =============

// Display rewards in the Astral Rewards Bay
async function displayRewards() {
    const rewardsTable = document.getElementById('rewards-table');
    const noRewardsDiv = document.getElementById('no-rewards');
    const loadingDiv = document.getElementById('rewards-loading');
    if (!rewardsTable) return;

    try {
        if (loadingDiv) loadingDiv.style.display = 'block';
        const rewards = await getRewards();
        if (loadingDiv) loadingDiv.style.display = 'none';

        const sorted = rewards.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const tbody = rewardsTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (sorted.length === 0) {
            noRewardsDiv.style.display = 'block';
            rewardsTable.style.display = 'none';
        } else {
            noRewardsDiv.style.display = 'none';
            rewardsTable.style.display = 'table';
            sorted.forEach(reward => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = reward.description;
                row.insertCell(1).innerHTML = `${formatStarDollars(reward.cost)}`;
                const statusCell = row.insertCell(2);
                const statusSpan = document.createElement('span');
                statusSpan.className = reward.active !== false ? 'status-active' : 'status-inactive';
                statusSpan.textContent = reward.active !== false ? '🛰️ Active' : '🪐 Inactive';
                statusCell.appendChild(statusSpan);

                const actions = row.insertCell(3);
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-small btn-edit';
                editBtn.innerHTML = '✏️ Edit';
                editBtn.onclick = () => editReward(reward.id);

                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'btn-small btn-toggle';
                toggleBtn.innerHTML = reward.active !== false ? '⏸️' : '🚀';
                toggleBtn.title = reward.active !== false ? 'Deactivate' : 'Activate';
                toggleBtn.onclick = () => toggleRewardStatus(reward.id);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-small btn-delete';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.title = 'Delete reward';
                deleteBtn.onclick = () => confirmDeleteReward(reward.id, reward.description);

                actions.appendChild(editBtn);
                actions.appendChild(toggleBtn);
                actions.appendChild(deleteBtn);
            });
        }
    } catch (error) {
        console.error('Error displaying rewards:', error);
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (noRewardsDiv) {
            noRewardsDiv.innerHTML = '❌ Error loading Astral Rewards. Please refresh the page.';
            noRewardsDiv.style.display = 'block';
        }
        if (rewardsTable) rewardsTable.style.display = 'none';
    }
}

function confirmDeleteReward(rewardId, rewardDescription) {
    const message = `🛸 Delete this Astral Reward?\n\nReward: "${rewardDescription}"\n\nThis cannot be undone.`;
    if (confirm(message)) {
        deleteReward(rewardId);
        displayRewards();
        alert('🗑️ Astral Reward removed.');
    }
}

async function editReward(rewardId) {
    const rewards = await getRewards();
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    document.getElementById('reward-description').value = reward.description;
    document.getElementById('reward-cost').value = reward.cost;
    document.getElementById('reward-active').value = reward.active !== false ? 'true' : 'false';

    const submitBtn = document.getElementById('reward-submit-btn');
    const cancelBtn = document.getElementById('reward-cancel-edit-btn');
    submitBtn.textContent = '💫 Update Astral Reward';
    submitBtn.dataset.editingId = rewardId;
    cancelBtn.style.display = 'inline-block';

    document.querySelector('.reward-form-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelRewardEdit() {
    document.getElementById('reward-form').reset();
    const submitBtn = document.getElementById('reward-submit-btn');
    const cancelBtn = document.getElementById('reward-cancel-edit-btn');
    submitBtn.textContent = '🌟 Add Astral Reward';
    delete submitBtn.dataset.editingId;
    cancelBtn.style.display = 'none';
}

async function toggleRewardStatus(rewardId) {
    try {
        const rewards = await getRewards();
        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) return;
        const newStatus = reward.active !== false ? false : true;
        await updateReward(rewardId, { active: newStatus });
        await displayRewards();
    } catch (e) {
        console.error('Error toggling reward status:', e);
        alert('❌ Failed to toggle reward status.');
    }
}

async function handleRewardFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('reward-submit-btn');
    const rewardData = {
        description: formData.get('description'),
        cost: parseInt(formData.get('cost')),
        active: formData.get('active') === 'true'
    };
    if (!rewardData.description || !rewardData.cost) {
        alert('🛰️ Please fill in all Astral Reward details.');
        return;
    }
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '🚀 Saving...';
    try {
        if (submitBtn.dataset.editingId) {
            await updateReward(submitBtn.dataset.editingId, rewardData);
            alert('💫 Astral Reward updated!');
            cancelRewardEdit();
        } else {
            await addReward(rewardData);
            alert('🌟 Astral Reward added!');
            form.reset();
            document.getElementById('reward-active').value = 'true';
        }
        await displayRewards();
    } catch (e) {
        console.error('Error saving reward:', e);
        alert('❌ Could not save Astral Reward.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function initializeRewardsPage() {
    try {
        await displayRewards();
        const cancelBtn = document.getElementById('reward-cancel-edit-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', cancelRewardEdit);
        const activeSelect = document.getElementById('reward-active');
        if (activeSelect) activeSelect.value = 'true';
    } catch (e) {
        console.error('Error initializing rewards page:', e);
    }
}

// ============= OPEN CARGO BAY (REDEEM UI) =============

async function displayRedeemableRewards() {
    const balanceSpan = document.getElementById('combined-balance');
    const rewardsContainer = document.getElementById('redeem-rewards');
    const loading = document.getElementById('redeem-loading');
    if (!rewardsContainer) return;

    try {
        if (loading) loading.style.display = 'block';
        const [balance, rewards] = await Promise.all([
            getCombinedBalance(),
            getActiveRewards()
        ]);
        if (balanceSpan) balanceSpan.textContent = balance;
        if (loading) loading.style.display = 'none';

        rewardsContainer.innerHTML = '';
        rewards.sort((a,b) => a.cost - b.cost).forEach(reward => {
            const card = document.createElement('div');
            card.className = 'reward-card';
            const affordable = balance >= reward.cost;
            card.innerHTML = `
                <div class="reward-card-inner ${affordable ? '' : 'reward-disabled'}">
                  <div class="reward-title">${reward.description}</div>
                  <div class="reward-cost">${formatStarDollars(reward.cost)}</div>
                  <button class="btn btn-primary reward-redeem-btn" ${affordable ? '' : 'disabled'}>🧰 Open Cargo Bay</button>
                </div>`;
            const btn = card.querySelector('.reward-redeem-btn');
            btn.addEventListener('click', () => redeemReward(reward));
            rewardsContainer.appendChild(card);
        });
    } catch (e) {
        console.error('Error displaying redeemable rewards:', e);
        if (loading) loading.style.display = 'none';
        rewardsContainer.innerHTML = '❌ Error loading rewards.';
    }
}

async function redeemReward(reward) {
    try {
        const balance = await getCombinedBalance();
        if (balance < reward.cost) {
            alert('⚠️ Not enough Star Dollars to open this cargo.');
            return;
        }
        const requester = (document.getElementById('redeem-requester')?.value) || 'FAMILY';
        const note = (document.getElementById('redeem-note')?.value || '').trim();
        const ok = confirm(`Open Cargo Bay for "${reward.description}"\nCost: ${reward.cost} Star Dollars\nRequested by: ${requester}${note ? `\nNote: ${note}` : ''}`);
        if (!ok) return;
        await addRedemption({
            rewardId: reward.id,
            rewardDescriptionSnapshot: reward.description,
            costAtRedemption: reward.cost,
            requestedBy: requester,
            note
        });
        alert('🎉 Cargo opened! Enjoy your Astral Reward.');
        await displayRedeemableRewards();
        await displayRedemptionsHistory();
    } catch (e) {
        console.error('Error redeeming reward:', e);
        alert('❌ Could not open cargo bay.');
    }
}

async function displayRedemptionsHistory() {
    const table = document.getElementById('redemptions-table');
    const tbody = table ? table.querySelector('tbody') : null;
    const loading = document.getElementById('redemptions-loading');
    const empty = document.getElementById('no-redemptions');
    if (!table || !tbody) return;

    try {
        if (loading) loading.style.display = 'block';
        const list = await getRedemptions();
        if (loading) loading.style.display = 'none';

        tbody.innerHTML = '';
        if (!list.length) {
            table.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';
        table.style.display = 'table';

        list.forEach(r => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = formatDate(r.timestamp || r.createdAt);
            row.insertCell(1).textContent = r.rewardDescriptionSnapshot || '(deleted reward)';
            row.insertCell(2).innerHTML = `${formatStarDollars(r.costAtRedemption)}`;
            row.insertCell(3).textContent = r.note || '';
            const actions = row.insertCell(4);
            const del = document.createElement('button');
            del.className = 'btn-small btn-delete';
            del.innerHTML = '🗑️';
            del.title = 'Delete redemption';
            del.onclick = () => confirmDeleteRedemption(r.id);
            actions.appendChild(del);
        });
    } catch (e) {
        console.error('Error displaying redemption history:', e);
        if (loading) loading.style.display = 'none';
        if (tbody) tbody.innerHTML = '<tr><td colspan="4">❌ Error loading history.</td></tr>';
        table.style.display = 'table';
    }
}

function confirmDeleteRedemption(redemptionId) {
    if (!confirm('🗑️ Remove this redemption from the cargo manifest?')) return;
    deleteRedemption(redemptionId)
        .then(async () => {
            await Promise.all([
                displayRedeemableRewards(),
                displayRedemptionsHistory()
            ]);
        })
        .catch(() => alert('❌ Failed to delete redemption.'));
}

async function deleteRedemption(redemptionId) {
    const { doc, deleteDoc } = window.firestoreFunctions;
    const db = window.db;
    await deleteDoc(doc(db, REDEMPTIONS_COLLECTION, redemptionId));
}

async function initializeRedeemPage() {
    await Promise.all([
        displayRedeemableRewards(),
        displayRedemptionsHistory()
    ]);
}

// Load missions into dropdown for task form (Firebase version)
async function loadMissionsDropdown() {
    const missionSelect = document.getElementById('mission-select');
    if (!missionSelect) return;
    
    try {
        const activeMissions = (await getActiveMissions()).sort((a, b) => a.description.localeCompare(b.description));
    
    // Clear existing options except the first one
    missionSelect.innerHTML = '<option value="">Choose your mission...</option>';
    
    activeMissions.forEach(mission => {
        const option = document.createElement('option');
        option.value = mission.id;
        option.textContent = `${mission.description} (${formatStarDollars(mission.starDollars)})`;
        option.dataset.starDollars = mission.starDollars;
        option.dataset.description = mission.description;
        missionSelect.appendChild(option);
    });
        
        if (activeMissions.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No missions available - Create some in Mission Control!";
            option.disabled = true;
            missionSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading missions dropdown:', error);
        missionSelect.innerHTML = '<option value="">Error loading missions - Please refresh</option>';
    }
}

// Edit mission functionality
async function editMission(missionId) {
    const missions = await getMissions();
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    
    // Populate form with mission data
    document.getElementById('mission-description').value = mission.description;
    document.getElementById('mission-star-dollars').value = mission.starDollars;
    document.getElementById('mission-active').value = mission.active !== false ? 'true' : 'false';
    
    // Update form state
    const submitBtn = document.getElementById('mission-submit-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    submitBtn.textContent = '💫 Update Mission';
    submitBtn.dataset.editingId = missionId;
    cancelBtn.style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.mission-form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel edit mode
function cancelEdit() {
    document.getElementById('mission-form').reset();
    const submitBtn = document.getElementById('mission-submit-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    submitBtn.textContent = '🚀 Launch Mission';
    delete submitBtn.dataset.editingId;
    cancelBtn.style.display = 'none';
}

// Toggle mission active status
async function toggleMissionStatus(missionId) {
    try {
        const missions = await getMissions();
    const mission = missions.find(m => m.id === missionId);
        if (!mission) {
            alert('❌ Mission not found!');
            return;
        }
    
    const newStatus = mission.active !== false ? false : true;
        await updateMission(missionId, { active: newStatus });
        await displayMissions();
    
    const statusText = newStatus ? 'activated' : 'deactivated';
    alert(`🌟 Mission ${statusText} successfully! 🌟`);
    } catch (error) {
        console.error('Error toggling mission status:', error);
        alert('❌ Failed to toggle mission status. Please try again.');
    }
}

// Handle mission form submission
async function handleMissionFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('mission-submit-btn');
    
    const missionData = {
        description: formData.get('description'),
        starDollars: parseInt(formData.get('starDollars')),
        active: formData.get('active') === 'true'
    };
    
    // Validation
    if (!missionData.description || !missionData.starDollars) {
        alert('🚀 Please fill in all mission details before launching! 🚀');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '🚀 Launching...';
    
    try {
    if (submitBtn.dataset.editingId) {
        // Update existing mission
            const missionId = submitBtn.dataset.editingId;
            await updateMission(missionId, missionData);
        alert('💫 Mission updated successfully! 💫');
        cancelEdit();
    } else {
        // Add new mission
            await addMission(missionData);
        alert('🚀 New mission launched successfully! 🚀');
        form.reset();
        document.getElementById('mission-active').value = 'true'; // Reset to active
    }
    
        // Refresh the missions display
        await displayMissions();
        
    } catch (error) {
        console.error('Error with mission operation:', error);
        
        // Show user-friendly error message
        let errorMessage = '❌ Mission launch failed! ';
        if (error.code === 'permission-denied') {
            errorMessage += 'Please make sure you are logged in.';
        } else if (error.code === 'network-request-failed') {
            errorMessage += 'Please check your internet connection.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}



// Initialize missions page (Firebase version)
async function initializeMissionsPage() {
    try {
        console.log('🔧 Initializing missions page...');
    
    // Display missions
        console.log('📊 Loading missions...');
        await displayMissions();
        console.log('✅ Missions loaded');
    
    // Set up cancel edit button
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
            console.log('✅ Cancel edit button set up');
    }
    
    // Set default status to active
    const activeSelect = document.getElementById('mission-active');
    if (activeSelect) {
        activeSelect.value = 'true';
            console.log('✅ Default mission status set to active');
        }
        
        console.log('🎉 Missions page initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing missions page:', error);
        // Show error in UI
        const missionsHeader = document.querySelector('.missions-header h2');
        if (missionsHeader) {
            missionsHeader.innerHTML = '❌ Error loading Mission Control';
        }
    }
}