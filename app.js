const taskText = document.getElementById('taskText');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const addBtn = document.getElementById('addBtn');
const upcomingTasks = document.getElementById('upcomingTasks');
const completedTasks = document.getElementById('completedTasks');
const themeToggle = document.getElementById('themeToggle');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    upcomingTasks.innerHTML = '';
    completedTasks.innerHTML = '';

    const now = new Date();

    tasks.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.textContent = `${task.text} - ${task.date} ${task.time}`;
        li.className = task.completed ? 'completed' : '';
        li.onclick = () => toggleComplete(index);
        if (task.completed) {
            completedTasks.appendChild(li);
        } else {
            upcomingTasks.appendChild(li);
        }

        // Reminder check
        const taskTime = new Date(task.date + 'T' + task.time);
        if (!task.notified && taskTime <= now) {
            showNotification(`Time for: ${task.text}`);
            task.notified = true;
            saveTasks();
        }
    });
}

function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function addTask() {
    if (!taskText.value || !taskDate.value || !taskTime.value) return;

    tasks.push({
        text: taskText.value,
        date: taskDate.value,
        time: taskTime.value,
        completed: false,
        notified: false,
    });
    taskText.value = '';
    taskDate.value = '';
    taskTime.value = '';
    saveTasks();
    renderTasks();
}

function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification('TaskPulse Reminder', { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('TaskPulse Reminder', { body: message });
            }
        });
    }
}

addBtn.onclick = addTask;
themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
};

setInterval(renderTasks, 15000);
renderTasks();
