const API_BASE_URL = 'http://127.0.0.1:8000/api/tasks';
let tasks = [];
let quickTaskCounter = 1;

// Strategy descriptions
const strategyDescriptions = {
    'smart_balance': 'Balanced approach considering urgency, importance, effort, and dependencies equally',
    'fastest_wins': 'Prioritizes quick, low-effort tasks for momentum building',
    'high_impact': 'Focuses on high-value tasks that unlock other work',
    'deadline_driven': 'Time-sensitive approach for deadline pressure scenarios'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    setupEventListeners();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').setAttribute('min', today);
});

// Setup Event Listeners
function setupEventListeners() {
    // Importance slider
    const importanceSlider = document.getElementById('task-importance');
    importanceSlider.addEventListener('input', (e) => {
        updateImportanceDisplay(e.target.value);
    });
    
    // Strategy selector
    document.getElementById('strategy').addEventListener('change', (e) => {
        updateStrategyDescription(e.target.value);
    });
    
    // Due date change
    document.getElementById('task-date').addEventListener('change', (e) => {
        updateDaysUntil(e.target.value);
    });
    
    // Quick form
    document.getElementById('quick-form').addEventListener('submit', handleQuickAdd);
    
    // Task form
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
}

// Update importance display with badge
function updateImportanceDisplay(value) {
    const valueDisplay = document.getElementById('importance-value');
    const badge = document.getElementById('importance-badge');
    
    valueDisplay.textContent = value;
    
    let label = 'Medium';
    let color = '#f59e0b';
    
    if (value <= 3) {
        label = 'Low';
        color = '#10b981';
    } else if (value >= 8) {
        label = 'High';
        color = '#ef4444';
    }
    
    badge.textContent = label;
    badge.style.background = color;
    badge.style.color = 'white';
    badge.style.padding = '4px 12px';
    badge.style.borderRadius = '20px';
}

// Update strategy description
function updateStrategyDescription(strategy) {
    const desc = document.getElementById('strategy-desc');
    desc.textContent = strategyDescriptions[strategy] || 'Select a strategy';
    desc.style.animation = 'fadeIn 0.3s ease';
}

// Calculate days until due date
function updateDaysUntil(dateString) {
    const hint = document.getElementById('days-until');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        hint.textContent = `⚠️ Past due by ${Math.abs(diffDays)} days!`;
        hint.style.color = '#ef4444';
        hint.style.fontWeight = '600';
    } else if (diffDays === 0) {
        hint.textContent = '🚨 Due today!';
        hint.style.color = '#ef4444';
        hint.style.fontWeight = '600';
    } else if (diffDays <= 3) {
        hint.textContent = `⏰ Due in ${diffDays} day${diffDays > 1 ? 's' : ''} - Urgent!`;
        hint.style.color = '#f59e0b';
        hint.style.fontWeight = '600';
    } else if (diffDays <= 7) {
        hint.textContent = `📅 Due in ${diffDays} days`;
        hint.style.color = '#3b82f6';
    } else {
        hint.textContent = `📆 Due in ${diffDays} days`;
        hint.style.color = '#6b7280';
    }
}

// Tab switching with animation
function showTab(tabName) {
    document.querySelectorAll('.input-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(`${tabName}-input`);
    selectedTab.classList.add('active');
    event.target.classList.add('active');
    
    // Add entrance animation
    selectedTab.style.animation = 'fadeIn 0.4s ease';
}

// Handle task form submission
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value.trim();
    
    // Check for duplicate ID
    if (tasks.some(t => t.task_id === taskId)) {
        showToast('Task ID already exists!', 'error');
        return;
    }
    
    const task = {
        task_id: taskId,
        title: document.getElementById('task-title').value.trim(),
        due_date: document.getElementById('task-date').value,
        estimated_hours: parseFloat(document.getElementById('task-hours').value),
        importance: parseInt(document.getElementById('task-importance').value),
        dependencies: document.getElementById('task-dependencies').value
            .split(',')
            .map(d => d.trim())
            .filter(d => d.length > 0)
    };
    
    tasks.push(task);
    updateTaskList();
    updateStats();
    e.target.reset();
    
    // Reset displays
    document.getElementById('importance-value').textContent = '5';
    updateImportanceDisplay(5);
    document.getElementById('days-until').textContent = '';
    
    showToast('✅ Task added successfully!', 'success');
}

// Handle quick add
function handleQuickAdd(e) {
    e.preventDefault();
    
    const title = document.getElementById('quick-title').value.trim();
    const urgency = document.getElementById('quick-urgency').value;
    const effort = document.getElementById('quick-effort').value;
    
    // Calculate due date based on urgency
    const today = new Date();
    let daysToAdd = 7;
    let importance = 5;
    
    if (urgency === 'high') {
        daysToAdd = 2;
        importance = 9;
    } else if (urgency === 'medium') {
        daysToAdd = 5;
        importance = 6;
    } else {
        daysToAdd = 14;
        importance = 4;
    }
    
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysToAdd);
    
    // Calculate hours based on effort
    let hours = 3;
    if (effort === 'quick') hours = 1;
    else if (effort === 'long') hours = 6;
    
    const task = {
        task_id: `QUICK-${String(quickTaskCounter).padStart(3, '0')}`,
        title: title,
        due_date: dueDate.toISOString().split('T')[0],
        estimated_hours: hours,
        importance: importance,
        dependencies: []
    };
    
    tasks.push(task);
    quickTaskCounter++;
    updateTaskList();
    updateStats();
    e.target.reset();
    
    showToast('⚡ Quick task added!', 'success');
}

// Update task list display
function updateTaskList() {
    const preview = document.getElementById('tasks-preview');
    const count = document.getElementById('task-count');
    count.textContent = tasks.length;
    
    if (tasks.length === 0) {
        preview.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No tasks added yet</p>';
        return;
    }
    
    preview.innerHTML = tasks.map((task, index) => {
        const urgencyIcon = getUrgencyIcon(task.due_date);
        const importanceColor = task.importance >= 8 ? '#ef4444' : task.importance >= 5 ? '#f59e0b' : '#10b981';
        
        return `
            <div class="task-preview-item">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <strong style="color: var(--primary);">${task.task_id}</strong>
                        <span style="font-size: 1.2em;">${urgencyIcon}</span>
                    </div>
                    <div style="margin-bottom: 5px;">${task.title}</div>
                    <small style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <span><i class="fas fa-calendar"></i> ${task.due_date}</span>
                        <span><i class="fas fa-clock"></i> ${task.estimated_hours}h</span>
                        <span><i class="fas fa-star" style="color: ${importanceColor};"></i> ${task.importance}/10</span>
                        ${task.dependencies.length > 0 ? `<span><i class="fas fa-link"></i> ${task.dependencies.length} dep</span>` : ''}
                    </small>
                </div>
                <button onclick="removeTask(${index})" title="Remove task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Get urgency icon based on due date
function getUrgencyIcon(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '🚨';
    if (diffDays === 0) return '⚠️';
    if (diffDays <= 3) return '⏰';
    if (diffDays <= 7) return '📅';
    return '📆';
}

// Remove task
function removeTask(index) {
    if (confirm('Are you sure you want to remove this task?')) {
        tasks.splice(index, 1);
        updateTaskList();
        updateStats();
        showToast('Task removed', 'info');
    }
}

// Clear all tasks
function clearAllTasks() {
    if (tasks.length === 0) {
        showToast('No tasks to clear', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${tasks.length} tasks?`)) {
        tasks = [];
        updateTaskList();
        updateStats();
        clearResults();
        showToast('All tasks cleared', 'info');
    }
}

// Show tasks as JSON
function showTasksInJSON() {
    if (tasks.length === 0) {
        showToast('No tasks to display', 'info');
        return;
    }
    
    document.getElementById('json-textarea').value = JSON.stringify(tasks, null, 2);
    showTab('json');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    showToast('Tasks exported to JSON view', 'success');
}

// Load sample JSON
function loadSampleJSON() {
    const sample = [
        {
            "task_id": "TASK-001",
            "title": "Fix critical bug in production",
            "due_date": "2025-11-27",
            "estimated_hours": 2,
            "importance": 10,
            "dependencies": []
        },
        {
            "task_id": "TASK-002",
            "title": "Write unit tests for new feature",
            "due_date": "2025-12-01",
            "estimated_hours": 5,
            "importance": 7,
            "dependencies": ["TASK-001"]
        },
        {
            "task_id": "TASK-003",
            "title": "Update project documentation",
            "due_date": "2025-12-05",
            "estimated_hours": 3,
            "importance": 6,
            "dependencies": []
        },
        {
            "task_id": "TASK-004",
            "title": "Code review for PR #123",
            "due_date": "2025-11-28",
            "estimated_hours": 1,
            "importance": 8,
            "dependencies": []
        }
    ];
    
    document.getElementById('json-textarea').value = JSON.stringify(sample, null, 2);
    showToast('Sample JSON loaded', 'success');
}

// Validate JSON
function validateJSON() {
    const jsonText = document.getElementById('json-textarea').value.trim();
    const validationMsg = document.getElementById('json-validation');
    
    if (!jsonText) {
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = '❌ JSON input is empty';
        return false;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        
        if (!Array.isArray(parsed)) {
            validationMsg.className = 'validation-message error';
            validationMsg.textContent = '❌ JSON must be an array of tasks';
            return false;
        }
        
        // Validate task structure
        for (let i = 0; i < parsed.length; i++) {
            const task = parsed[i];
            const required = ['task_id', 'title', 'due_date', 'estimated_hours', 'importance'];
            
            for (const field of required) {
                if (!(field in task)) {
                    validationMsg.className = 'validation-message error';
                    validationMsg.textContent = `❌ Task ${i + 1} is missing required field: ${field}`;
                    return false;
                }
            }
        }
        
        validationMsg.className = 'validation-message success';
        validationMsg.textContent = `✅ Valid JSON with ${parsed.length} tasks`;
        return true;
        
    } catch (error) {
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = `❌ Invalid JSON: ${error.message}`;
        return false;
    }
}

// Load from JSON
function loadFromJSON() {
    if (!validateJSON()) return;
    
    try {
        const jsonText = document.getElementById('json-textarea').value;
        const parsed = JSON.parse(jsonText);
        tasks = parsed;
        updateTaskList();
        updateStats();
        showTab('form');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        showToast(`✅ Successfully loaded ${tasks.length} tasks!`, 'success');
    } catch (error) {
        showToast('Failed to load JSON', 'error');
    }
}

// Update statistics
function updateStats() {
    document.getElementById('total-tasks-header').textContent = tasks.length;
    
    const totalHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    document.getElementById('total-hours').textContent = totalHours.toFixed(1) + 'h';
}

// Analyze tasks
async function analyzeTasks() {
    if (tasks.length === 0) {
        showToast('⚠️ Please add at least one task before analyzing', 'error');
        return;
    }
    
    const strategy = document.getElementById('strategy').value;
    const loading = document.getElementById('loading');
    const error = document.getElementById('error-message');
    const results = document.getElementById('results');
    const emptyState = document.getElementById('empty-state');
    
    // Show loading
    loading.style.display = 'block';
    error.style.display = 'none';
    emptyState.style.display = 'none';
    results.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/analyze/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tasks: tasks,
                strategy: strategy
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }
        
        displayResults(data);
        document.getElementById('analyzed-count').textContent = data.total_tasks;
        document.getElementById('export-btn').style.display = 'inline-flex';
        document.getElementById('clear-results-btn').style.display = 'inline-flex';
        
        showToast('✅ Analysis complete!', 'success');
        
    } catch (err) {
        document.getElementById('error-text').textContent = err.message;
        error.style.display = 'flex';
        showToast('❌ Analysis failed', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

// Display results
function displayResults(data) {
    const results = document.getElementById('results');
    
    const strategyName = data.strategy.replace(/_/g, ' ').toUpperCase();
    const strategyEmoji = {
        'SMART BALANCE': '⚖️',
        'FASTEST WINS': '⚡',
        'HIGH IMPACT': '🎯',
        'DEADLINE DRIVEN': '⏰'
    }[strategyName] || '📊';
    
    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 20px; border-radius: 15px; margin-bottom: 25px;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
            <h3 style="margin: 0 0 10px 0; font-size: 1.4em;">
                ${strategyEmoji} Strategy: ${strategyName}
            </h3>
            <p style="margin: 0; opacity: 0.95;">
                Successfully analyzed ${data.total_tasks} tasks in priority order
            </p>
        </div>
    `;
    
    data.tasks.forEach((task, index) => {
        const priorityClass = task.priority_score >= 7 ? 'high' : 
                             task.priority_score >= 5 ? 'medium' : 'low';
        const priorityLabel = task.priority_score >= 7 ? 'HIGH PRIORITY' :
                             task.priority_score >= 5 ? 'MEDIUM' : 'LOW';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📌';
        
        html += `
            <div class="task-card">
                <div class="task-header">
                    <h3>${rankEmoji} #${index + 1} - ${task.title}</h3>
                    <span class="priority-badge priority-${priorityClass}">
                        ${priorityLabel}<br>Score: ${task.priority_score}
                    </span>
                </div>
                <div class="task-details">
                    <div><strong><i class="fas fa-hashtag"></i> Task ID:</strong> ${task.task_id}</div>
                    <div><strong><i class="fas fa-calendar"></i> Due Date:</strong> ${task.due_date}</div>
                    <div><strong><i class="fas fa-clock"></i> Est. Hours:</strong> ${task.estimated_hours}h</div>
                    <div><strong><i class="fas fa-star"></i> Importance:</strong> ${task.importance}/10</div>
                </div>
                ${task.dependencies && task.dependencies.length > 0 ? `
                    <div style="margin: 10px 0; padding: 10px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <strong><i class="fas fa-link"></i> Dependencies:</strong> ${task.dependencies.join(', ')}
                    </div>
                ` : ''}
                <div class="task-explanation">
                    <strong>💡 Why this priority?</strong><br>
                    ${task.explanation}
                </div>
            </div>
        `;
    });
    
    results.innerHTML = html;
    results.style.animation = 'slideUp 0.5s ease';
}

// Export results
function exportResults() {
    const results = document.getElementById('results');
    if (!results.innerHTML.trim()) {
        showToast('No results to export', 'info');
        return;
    }
    
    const strategy = document.getElementById('strategy').value;
    const exportData = {
        analysis_date: new Date().toISOString(),
        strategy: strategy,
        total_tasks: tasks.length,
        tasks: tasks
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('📥 Results exported successfully!', 'success');
}

// Clear results
function clearResults() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('export-btn').style.display = 'none';
    document.getElementById('clear-results-btn').style.display = 'none';
    document.getElementById('analyzed-count').textContent = '0';
    showToast('Results cleared', 'info');
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeTasks();
    }
    
    // Ctrl/Cmd + K to clear all
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearAllTasks();
    }
});
