// Star Effort Chart JavaScript

// LocalStorage key for tasks
const TASKS_STORAGE_KEY = 'starEffortTasks';

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
            descCell.textContent = task.description;
            
            // Star dollars cell
            const starsCell = row.insertCell(2);
            starsCell.innerHTML = `${getStarEmoji(task.starDollars)} ${task.starDollars}`;
            
            // Actions cell with delete button
            const actionsCell = row.insertCell(3);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '💥 Abort';
            deleteBtn.title = 'Abort this space mission';
            deleteBtn.onclick = () => confirmDeleteTask(task.id, task.description, task.childName);
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
    
    // Reset form
    form.reset();
    
    // Set today's date again
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').value = today;
    
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