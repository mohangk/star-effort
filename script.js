// Star Effort Chart JavaScript

// LocalStorage keys
const TASKS_STORAGE_KEY = 'starEffortTasks';
const MISSIONS_STORAGE_KEY = 'starEffortMissions';

// Get tasks from localStorage
function getTasks() {
    const tasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
}

// Save tasks to localStorage
function saveTasks(tasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

// Add a new task
function addTask(task) {
    const tasks = getTasks();
    task.id = Date.now(); // Simple ID generation
    task.timestamp = new Date().toISOString(); // For sorting
    tasks.push(task);
    saveTasks(tasks);
}

// Delete a task by ID
function deleteTask(taskId) {
    const tasks = getTasks();
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
    displayAllTasks(); // Refresh the display
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

// ============= MISSION MANAGEMENT FUNCTIONS =============

// Get missions from localStorage
function getMissions() {
    const missions = localStorage.getItem(MISSIONS_STORAGE_KEY);
    return missions ? JSON.parse(missions) : [];
}

// Save missions to localStorage
function saveMissions(missions) {
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
}

// Add a new mission
function addMission(mission) {
    const missions = getMissions();
    mission.id = Date.now(); // Simple ID generation
    mission.timestamp = new Date().toISOString();
    mission.active = mission.active !== undefined ? mission.active : true;
    missions.push(mission);
    saveMissions(missions);
    return mission;
}

// Update an existing mission
function updateMission(missionId, updatedMission) {
    const missions = getMissions();
    const index = missions.findIndex(mission => mission.id === missionId);
    if (index !== -1) {
        missions[index] = { ...missions[index], ...updatedMission };
        saveMissions(missions);
        return missions[index];
    }
    return null;
}

// Delete a mission by ID
function deleteMission(missionId) {
    const missions = getMissions();
    const updatedMissions = missions.filter(mission => mission.id !== missionId);
    saveMissions(updatedMissions);
    
    // Update any tasks that reference this mission
    const tasks = getTasks();
    const updatedTasks = tasks.map(task => {
        if (task.missionId === missionId) {
            // Convert back to legacy format
            return {
                ...task,
                description: task.missionDescription || task.description,
                missionId: undefined,
                missionDescription: undefined
            };
        }
        return task;
    });
    saveTasks(updatedTasks);
    
    return true;
}

// Get active missions only
function getActiveMissions() {
    return getMissions().filter(mission => mission.active !== false);
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

// Display tasks for a specific child
function displayTasksForChild(childName, tableId, noTasksId, totalId) {
    const tasks = getTasks();
    const childTasks = tasks
        .filter(task => task.childName === childName)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

    const tableBody = document.querySelector(`#${tableId} tbody`);
    const noTasksDiv = document.getElementById(noTasksId);
    const totalSpan = document.getElementById(totalId);

    if (!tableBody) return; // Exit if not on main page

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
}

// Display all tasks on main page
function displayAllTasks() {
    if (document.getElementById('asha-tasks')) {
        displayTasksForChild('ASHA', 'asha-tasks', 'asha-no-tasks', 'asha-total');
        displayTasksForChild('EKAA', 'ekaa-tasks', 'ekaa-no-tasks', 'ekaa-total');
    }
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const missionId = formData.get('missionId');
    
    // If using mission system
    if (missionId) {
        const missions = getMissions();
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
        addTask(task);
        
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
        addTask(task);
        
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
    loadMissionsDropdown();
    
    // Redirect to main page after short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Display tasks if on main page
    displayAllTasks();
    
    // Handle form submission if on add task page
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Add some sample data for testing (only if no tasks exist)
    const existingTasks = getTasks();
    if (existingTasks.length === 0) {
        // Add some sample tasks for demonstration
        const sampleTasks = [
            {
                id: 1,
                date: new Date().toISOString().split('T')[0],
                childName: 'ASHA',
                description: 'Cleaned my bedroom and organized toys',
                starDollars: '4',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
                childName: 'EKAA',
                description: 'Helped set the dinner table',
                starDollars: '3',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 3,
                date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
                childName: 'ASHA',
                description: 'Finished homework without reminders',
                starDollars: '5',
                timestamp: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        
        saveTasks(sampleTasks);
        displayAllTasks(); // Refresh display with sample data
    }
});

// Add some fun animations and interactions
document.addEventListener('DOMContentLoaded', function() {
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

// Display missions in the manage missions page
function displayMissions() {
    const missionsTable = document.getElementById('missions-table');
    const noMissionsDiv = document.getElementById('no-missions');
    const activeCountSpan = document.getElementById('active-missions-count');
    const inactiveCountSpan = document.getElementById('inactive-missions-count');
    
    if (!missionsTable) return; // Exit if not on missions page
    
    const missions = getMissions().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const tableBody = missionsTable.querySelector('tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (missions.length === 0) {
        noMissionsDiv.style.display = 'block';
        missionsTable.style.display = 'none';
    } else {
        noMissionsDiv.style.display = 'none';
        missionsTable.style.display = 'table';
        
        missions.forEach(mission => {
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
    const activeMissions = missions.filter(m => m.active !== false);
    const inactiveMissions = missions.filter(m => m.active === false);
    
    if (activeCountSpan) activeCountSpan.textContent = activeMissions.length;
    if (inactiveCountSpan) inactiveCountSpan.textContent = inactiveMissions.length;
}

// Load missions into dropdown for task form
function loadMissionsDropdown() {
    const missionSelect = document.getElementById('mission-select');
    if (!missionSelect) return;
    
    const activeMissions = getActiveMissions().sort((a, b) => a.description.localeCompare(b.description));
    
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
function toggleMissionStatus(missionId) {
    const missions = getMissions();
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    
    const newStatus = mission.active !== false ? false : true;
    updateMission(missionId, { active: newStatus });
    displayMissions();
    
    const statusText = newStatus ? 'activated' : 'deactivated';
    alert(`🌟 Mission ${statusText} successfully! 🌟`);
}

// Handle mission form submission
function handleMissionFormSubmit(event) {
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
    
    if (submitBtn.dataset.editingId) {
        // Update existing mission
        const missionId = parseInt(submitBtn.dataset.editingId);
        updateMission(missionId, missionData);
        alert('💫 Mission updated successfully! 💫');
        cancelEdit();
    } else {
        // Add new mission
        addMission(missionData);
        alert('🚀 New mission launched successfully! 🚀');
        form.reset();
        document.getElementById('mission-active').value = 'true'; // Reset to active
    }
    
    displayMissions();
}

// Migrate existing tasks to create missions
function migrateExistingTasks() {
    const tasks = getTasks();
    const existingMissions = getMissions();
    
    // Group tasks by description to create unique missions
    const missionMap = new Map();
    
    tasks.forEach(task => {
        if (!task.missionId && task.description) {
            const key = `${task.description}_${task.starDollars}`;
            if (!missionMap.has(key)) {
                missionMap.set(key, {
                    description: task.description,
                    starDollars: parseInt(task.starDollars),
                    active: true,
                    tasks: []
                });
            }
            missionMap.get(key).tasks.push(task);
        }
    });
    
    // Create missions from unique task descriptions
    let migratedCount = 0;
    missionMap.forEach((missionData, key) => {
        // Check if mission already exists
        const existingMission = existingMissions.find(m => 
            m.description === missionData.description && 
            m.starDollars === missionData.starDollars
        );
        
        let mission;
        if (existingMission) {
            mission = existingMission;
        } else {
            mission = addMission({
                description: missionData.description,
                starDollars: missionData.starDollars,
                active: true
            });
            migratedCount++;
        }
        
        // Update tasks to reference the mission
        const updatedTasks = getTasks().map(task => {
            if (missionData.tasks.includes(task)) {
                return {
                    ...task,
                    missionId: mission.id,
                    missionDescription: mission.description
                };
            }
            return task;
        });
        
        saveTasks(updatedTasks);
    });
    
    if (migratedCount > 0) {
        console.log(`🚀 Migrated ${migratedCount} missions from existing tasks!`);
    }
}

// Initialize missions page
function initializeMissionsPage() {
    // Run migration on first load
    migrateExistingTasks();
    
    // Display missions
    displayMissions();
    
    // Set up form handler
    const missionForm = document.getElementById('mission-form');
    if (missionForm) {
        missionForm.addEventListener('submit', handleMissionFormSubmit);
    }
    
    // Set up cancel edit button
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
    
    // Set default status to active
    const activeSelect = document.getElementById('mission-active');
    if (activeSelect) {
        activeSelect.value = 'true';
    }
}