// Star Effort Chart JavaScript with Firebase Backend

// Firebase Firestore imports will be available globally via firebase-config.js
// Collections
const TASKS_COLLECTION = 'tasks';
const MISSIONS_COLLECTION = 'missions';

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
        
        displayAllTasks(); // Refresh the display
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Error deleting mission. Please try again.');
    }
}



// Confirm task deletion with space-themed message
function confirmDeleteTask(taskId, taskDescription, childName) {
    const message = `🚀 Are you sure you want to abort this space mission?\n\n` +
                   `Mission: "${taskDescription}"\n` +
                   `Space Explorer: ${childName}\n\n` +
                   `⚠️ This action cannot be undone! 🌌`;
    
    if (confirm(message)) {
        deleteTask(taskId);
        alert(`🌟 Mission successfully aborted from the space log! 🌟`);
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

// Get star emoji representation
function getStarEmoji(amount) {
    return '⭐'.repeat(parseInt(amount));
}

// Display tasks for a specific child (Firebase version)
async function displayTasksForChild(childName, tableId, noTasksId, totalId) {
    const loadingId = `${childName.toLowerCase()}-loading`;
    const loadingDiv = document.getElementById(loadingId);
    
    try {
        // Show loading state
        if (loadingDiv) loadingDiv.style.display = 'block';
        
        const tasks = await getTasks();
        const childTasks = tasks
            .filter(task => task.childName === childName)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

        const tableBody = document.querySelector(`#${tableId} tbody`);
        const noTasksDiv = document.getElementById(noTasksId);
        const totalSpan = document.getElementById(totalId);

        if (!tableBody) return; // Exit if not on main page

        // Hide loading state
        if (loadingDiv) loadingDiv.style.display = 'none';

        // Clear existing rows
        tableBody.innerHTML = '';

        if (childTasks.length === 0) {
            // Show no tasks message
            noTasksDiv.style.display = 'block';
            document.getElementById(tableId).style.display = 'none';
        } else {
            // Hide no tasks message and show table
            noTasksDiv.style.display = 'none';
            document.getElementById(tableId).style.display = 'table';

            // Add tasks to table
            childTasks.forEach(task => {
                const row = tableBody.insertRow();
                
                // Date cell
                const dateCell = row.insertCell(0);
                dateCell.textContent = formatDate(task.date);
                
                // Description cell
                const descCell = row.insertCell(1);
                descCell.textContent = task.missionDescription || task.description;
                
                // Star dollars cell
                const starsCell = row.insertCell(2);
                starsCell.innerHTML = `${getStarEmoji(task.starDollars)} ${task.starDollars}`;
                
                // Actions cell with delete button
                const actionsCell = row.insertCell(3);
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '💥 Abort';
                deleteBtn.title = 'Abort this space mission';
                deleteBtn.onclick = () => confirmDeleteTask(task.id, task.missionDescription || task.description, task.childName);
                actionsCell.appendChild(deleteBtn);
            });
        }

        // Calculate and display total star dollars
        const total = childTasks.reduce((sum, task) => sum + parseInt(task.starDollars), 0);
        if (totalSpan) {
            totalSpan.textContent = total;
        }
    } catch (error) {
        console.error('Error displaying tasks for', childName, ':', error);
        
        // Hide loading state
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        // Show error message in the UI
        const noTasksDiv = document.getElementById(noTasksId);
        if (noTasksDiv) {
            noTasksDiv.innerHTML = '❌ Error loading missions. Please refresh the page.';
            noTasksDiv.style.display = 'block';
        }
        
        // Hide table in case of error
        const table = document.getElementById(tableId);
        if (table) table.style.display = 'none';
    }
}

// Display all tasks on main page (Firebase version)
async function displayAllTasks() {
    if (document.getElementById('asha-tasks')) {
        await Promise.all([
            displayTasksForChild('ASHA', 'asha-tasks', 'asha-no-tasks', 'asha-total'),
            displayTasksForChild('EKAA', 'ekaa-tasks', 'ekaa-no-tasks', 'ekaa-total')
        ]);
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
            alert(`🌟 Amazing! ${task.childName} completed "${selectedMission.description}" and earned ${getStarEmoji(selectedMission.starDollars)} ${selectedMission.starDollars} Star Dollars! 🌟`);
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
            alert(`🌟 Amazing! ${task.childName} completed "${task.description}" and earned ${getStarEmoji(task.starDollars)} ${task.starDollars} Star Dollars! 🌟`);
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
        
        // Add timeout to prevent hanging
        const missionsPromise = getMissions();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: getMissions took too long')), 10000)
        );
        
        const missions = await Promise.race([missionsPromise, timeoutPromise]);
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
            starsCell.innerHTML = `${getStarEmoji(mission.starDollars)} ${mission.starDollars}`;
            
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
            option.textContent = `${mission.description} (${getStarEmoji(mission.starDollars)} ${mission.starDollars})`;
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
function editMission(missionId) {
    const missions = getMissions();
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