document.addEventListener("DOMContentLoaded", function () {
    const taskFormPopup = document.getElementById('task-form-popup');
    const addTaskIcon = document.getElementById('add-task-icon');
    const taskList = document.getElementById('task-list');
    const remindersIcon = document.getElementById('reminders-icon');
    const profileIcon = document.getElementById('profile-icon');
    const reminderCheckbox = document.getElementById('reminder-checkbox');
    const reminderDateInput = document.getElementById('reminder-date');
    const categories = document.querySelectorAll('.category');
    const homeNavButton = document.querySelector('#home-icon');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

    const homeView = document.querySelector('.today-tasks');
    const profileView = document.querySelector('.profile-display');
    const reminderView = document.querySelector('.reminder-display');

    let isEditing = false;
    let editIndex = null;

    addTaskIcon.addEventListener('click', function () {
        taskFormPopup.classList.remove('hidden');
        isEditing = false;
    });

    taskFormPopup.addEventListener('click', function (event) {
        if (event.target === taskFormPopup) {
            taskFormPopup.classList.add('hidden');
        }
    });

    reminderCheckbox.addEventListener('change', function () {
        reminderDateInput.style.display = reminderCheckbox.checked ? 'block' : 'none';
    });

    document.getElementById('task-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const taskName = document.getElementById('task-name').value;
        const category = document.getElementById('category-select').value;
        const date = document.getElementById('task-date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const isReminder = reminderCheckbox.checked;
        const reminderDate = isReminder ? document.getElementById('reminder-date').value : null;

        if (taskName && date && startTime && endTime) {
            if (isEditing) {
                tasks[editIndex] = {
                    name: taskName,
                    category: category,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    isReminder: isReminder,
                    reminderDate: reminderDate,
                    completed: tasks[editIndex].completed
                };
                isEditing = false;
            } else {
                const newTask = {
                    name: taskName,
                    category: category,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    isReminder: isReminder,
                    reminderDate: reminderDate,
                    completed: false
                };
                tasks.push(newTask);
            }

            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks('home'); // Render all tasks initially
            document.getElementById('task-form').reset();
            taskFormPopup.classList.add('hidden');
        } else {
            alert('Please fill in all required fields.');
        }
    });

    function renderTasks(view = 'home', category = null) {
        taskList.innerHTML = '';

        const tasksToRender = category ? tasks.filter(task => task.category === category) : tasks;

        if (view === 'home') {
            if (tasksToRender.length === 0) {
                const noTaskMessage = document.createElement('li');
                noTaskMessage.className = 'no-task';
                noTaskMessage.textContent = category 
                ? `No tasks found in "${category}".` 
                : 'Enjoy your day! There are no tasks to be done today.';
                taskList.appendChild(noTaskMessage);
            } else {
                tasksToRender.forEach((task, index) => {
                    const taskItem = document.createElement('li');
                    taskItem.className = task.completed ? 'completed' : '';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = task.completed;

                    checkbox.addEventListener('change', function () {
                        task.completed = checkbox.checked;
                        if (task.completed) {
                            completedTasks.push(task);
                        } else {
                            completedTasks = completedTasks.filter(t => t.name !== task.name);
                        }
                        localStorage.setItem('tasks', JSON.stringify(tasks));
                        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
                        renderTasks('home'); // Re-render tasks after completion status change
                    });

                    const taskText = document.createElement('span');
                    taskText.innerHTML = `<strong>${task.name}</strong> (${task.category})<br>${task.date} ${task.startTime} - ${task.endTime}`;

                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', function () {
                        editTask(index);
                    });

                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.addEventListener('click', function () {
                        if (task.completed) {
                            completedTasks = completedTasks.filter(t => t.name !== task.name);
                            localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
                        }
                        removeTask(index);
                    });

                    taskItem.appendChild(checkbox);
                    taskItem.appendChild(taskText);
                    taskItem.appendChild(editButton);
                    taskItem.appendChild(removeButton);
                    taskList.appendChild(taskItem);
                });
            }
        } else if (view === 'profile') {
            renderProfileView();
        } else if (view === 'reminders') {
            renderRemindersView();
        }
        if (view !== 'home' && tasksToRender.length === 0) {
            const noTaskMessage = document.createElement('li');
            noTaskMessage.className = 'no-task';
            noTaskMessage.textContent = `No tasks found in ${category ? category : 'selected category'}.`;
            taskList.appendChild(noTaskMessage);
        }
    }


    function renderProfileView() {
        const completedCount = completedTasks.length;
        const pendingCount = tasks.filter(task => !task.completed).length;
        const reminderCount = tasks.filter(task => task.isReminder).length;
        const upcomingTasks = tasks.filter(task => new Date(`${task.date}T${task.startTime}`) > new Date());

        profileView.innerHTML =
            `<h2>Profile Overview</h2>
            <p>Total Tasks: ${tasks.length}</p>
            <p>Completed Tasks: ${completedCount}</p>
            <p>Pending Tasks: ${pendingCount}</p>
            <p>Tasks with Reminders: ${reminderCount}</p>
            <h4>Upcoming Tasks</h4>
            <ul>
                ${upcomingTasks.length > 0 ? upcomingTasks.map(task => `<li>${task.name} on ${task.date} at ${task.startTime}</li>`).join('') : 'No upcoming tasks.'}
            </ul>`;
        homeView.style.display = 'none';
        reminderView.style.display = 'none';
        profileView.style.display = 'block';
    }

    function renderRemindersView() {
        const reminders = tasks.filter(task => task.isReminder);
        reminderView.innerHTML =
            `<h2>Reminders</h2>
            <ul>
            ${reminders.length > 0 ? reminders.map(task => {
                const formattedReminderDate = new Date(task.reminderDate).toLocaleString("en-GB", {
                    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return `<li><strong>${task.name}</strong> (${task.category}) - ${formattedReminderDate}</li>`;
            }).join('') : 'No reminders set.'}
            </ul>`;
        homeView.style.display = 'none';
        profileView.style.display = 'none';
        reminderView.style.display = 'block';
    }

    function editTask(index) {
        const task = tasks[index];

        document.getElementById('task-name').value = task.name;
        document.getElementById('category-select').value = task.category;
        document.getElementById('task-date').value = task.date;
        document.getElementById('start-time').value = task.startTime;
        document.getElementById('end-time').value = task.endTime;
        document.getElementById('reminder-checkbox').checked = task.isReminder;

        if (task.isReminder) {
            reminderDateInput.style.display = 'block';
            document.getElementById('reminder-date').value = task.reminderDate;
        } else {
            reminderDateInput.style.display = 'none';
        }

        editIndex = index;
        taskFormPopup.classList.remove('hidden');
        isEditing = true;
    }

    function removeTask(index) {
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks('home'); // Re-render tasks after removal
    }

    categories.forEach((category) => {
        category.addEventListener('click', function () {
            const selectedCategory = this.getAttribute('data-category');
            renderTasks('home', selectedCategory); // Render only the tasks of the selected category
        });
    });

    homeNavButton.addEventListener('click', function () {
        homeView.style.display = 'block';
        profileView.style.display = 'none';
        reminderView.style.display = 'none';
        renderTasks('home'); // Render all tasks when navigating home
    });

    remindersIcon.addEventListener('click', function () {
        homeView.style.display = 'none';
        profileView.style.display = 'none';
        reminderView.style.display = 'block';
        renderRemindersView();
    });

    profileIcon.addEventListener('click', function () {
        homeView.style.display = 'none';
        reminderView.style.display = 'none';
        profileView.style.display = 'block';
        renderProfileView();
    });

    renderTasks(); // Initial render of tasks

    
});
