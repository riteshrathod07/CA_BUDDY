/* =================================
   CA BUDDY - MAIN APPLICATION
================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Generate a local date key: YYYY-MM-DD.
    function getTodayKey() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const today = getTodayKey();

    // =================================
    // STUDY TIME TRACKER
    // =================================

    const timerDisplay = document.getElementById("timerDisplay");

    if (timerDisplay) {

        const startBtn = document.getElementById("startBtn");
        const pauseBtn = document.getElementById("pauseBtn");
        const resetBtn = document.getElementById("resetBtn");
        const timerStatus = document.getElementById("timerStatus");

        const timeKey = `caBuddy_studyTime_${today}`;
        const runningKey = "caBuddy_timerRunning";
        const startKey = "caBuddy_startTimestamp";
        const dateKey = "caBuddy_runningDate";

        let totalSeconds =
            Number(localStorage.getItem(timeKey)) || 0;

        let isRunning =
            localStorage.getItem(runningKey) === "true";

        let interval = null;

        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remaining = seconds % 60;

            return [hours, minutes, remaining]
                .map(value => String(value).padStart(2, "0"))
                .join(":");
        }

        function updateTimer() {
            timerDisplay.textContent = formatTime(totalSeconds);
        }

        function saveTime() {
            localStorage.setItem(timeKey, String(totalSeconds));
        }

        function startTimer() {

            if (isRunning) return;

            isRunning = true;

            localStorage.setItem(runningKey, "true");
            localStorage.setItem(startKey, String(Date.now()));
            localStorage.setItem(dateKey, today);

            timerStatus.textContent = "You are currently studying.";

            interval = setInterval(() => {
                totalSeconds++;
                saveTime();
                updateTimer();
            }, 1000);
        }

        function pauseTimer() {

            if (!isRunning) return;

            clearInterval(interval);

            isRunning = false;

            localStorage.setItem(runningKey, "false");
            localStorage.removeItem(startKey);
            localStorage.removeItem(dateKey);

            saveTime();
            updateTimer();

            timerStatus.textContent = "Study session paused.";
        }

        function resetTimer() {

            if (!confirm("Reset today's study time?")) return;

            pauseTimer();

            totalSeconds = 0;

            saveTime();
            updateTimer();

            timerStatus.textContent = "Timer reset. Ready to start!";
        }

        function restoreTimer() {

            if (!isRunning) return;

            const savedDate = localStorage.getItem(dateKey);
            const savedStart = Number(localStorage.getItem(startKey));

            if (!savedStart || !savedDate) {
                isRunning = false;
                localStorage.setItem(runningKey, "false");
                timerStatus.textContent = "Ready to start studying.";
                return;
            }

            if (savedDate !== today) {

                const elapsed = Math.max(
                    0,
                    Math.floor((Date.now() - savedStart) / 1000)
                );

                const previousKey = `caBuddy_studyTime_${savedDate}`;

                const previousTime =
                    Number(localStorage.getItem(previousKey)) || 0;

                localStorage.setItem(
                    previousKey,
                    String(previousTime + elapsed)
                );

                isRunning = false;

                localStorage.setItem(runningKey, "false");
                localStorage.removeItem(startKey);
                localStorage.removeItem(dateKey);

                timerStatus.textContent =
                    "Previous study session saved. Start a new session.";

                return;
            }

            const elapsed = Math.max(
                0,
                Math.floor((Date.now() - savedStart) / 1000)
            );

            totalSeconds += elapsed;
            saveTime();

            // Restart the session from the current timestamp.
            localStorage.setItem(startKey, String(Date.now()));

            timerStatus.textContent = "Your study session has been restored.";

            interval = setInterval(() => {
                totalSeconds++;
                saveTime();
                updateTimer();
            }, 1000);
        }

        startBtn.addEventListener("click", startTimer);
        pauseBtn.addEventListener("click", pauseTimer);
        resetBtn.addEventListener("click", resetTimer);

        updateTimer();
        restoreTimer();
    }

    // =================================
    // DAILY STUDY TARGET / TO-DO LIST
    // =================================

    const taskForm = document.getElementById("taskForm");

    if (taskForm) {

        const taskInput = document.getElementById("taskInput");
        const taskList = document.getElementById("taskList");
        const emptyMessage = document.getElementById("emptyMessage");

        const progressFill =
            document.getElementById("taskProgressFill");

        const progressText =
            document.getElementById("taskProgressText");

        const remainingTasks =
            document.getElementById("remainingTasks");

        const clearCompletedBtn =
            document.getElementById("clearCompletedBtn");

        const todayDate = document.getElementById("todayDate");

        const taskKey = `caBuddy_tasks_${today}`;

        let tasks = [];

        // Display today's date.
        todayDate.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

        // Load saved tasks.
        function loadTasks() {

            try {
                const savedTasks = JSON.parse(
                    localStorage.getItem(taskKey) || "[]"
                );

                if (!Array.isArray(savedTasks)) {
                    tasks = [];
                    return;
                }

                tasks = savedTasks.filter(task =>
                    task &&
                    typeof task.id === "string" &&
                    typeof task.text === "string" &&
                    typeof task.completed === "boolean"
                );

            } catch (error) {
                tasks = [];
            }
        }

        // Save tasks in browser storage.
        function saveTasks() {
            localStorage.setItem(
                taskKey,
                JSON.stringify(tasks)
            );
        }

        // Update progress information.
        function updateProgress() {

            const total = tasks.length;

            const completed = tasks.filter(
                task => task.completed
            ).length;

            const remaining = total - completed;

            const percentage = total > 0
                ? (completed / total) * 100
                : 0;

            progressFill.style.width = percentage + "%";

            progressText.textContent =
                `${completed} / ${total} Completed`;

            remainingTasks.textContent =
                `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;

            clearCompletedBtn.disabled = completed === 0;

            if (total > 0 && completed === total) {
                remainingTasks.textContent =
                    "Amazing! All daily targets completed!";
            }
        }

        // Render all tasks.
        function renderTasks() {

            taskList.replaceChildren();

            emptyMessage.hidden = tasks.length > 0;

            tasks.forEach(task => {

                const item = document.createElement("div");

                item.className = "task-item";

                if (task.completed) {
                    item.classList.add("completed");
                }

                const checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.className = "task-checkbox";
                checkbox.checked = task.completed;
                checkbox.setAttribute(
                    "aria-label",
                    "Mark task as completed"
                );

                checkbox.addEventListener("change", () => {

                    task.completed = checkbox.checked;

                    saveTasks();
                    renderTasks();
                });

                const text = document.createElement("span");

                text.className = "task-text";
                text.textContent = task.text;

                const deleteBtn = document.createElement("button");

                deleteBtn.type = "button";
                deleteBtn.className = "delete-task";
                deleteBtn.textContent = "Delete";
                deleteBtn.setAttribute("aria-label", "Delete task");

                deleteBtn.addEventListener("click", () => {

                    tasks = tasks.filter(
                        currentTask => currentTask.id !== task.id
                    );

                    saveTasks();
                    renderTasks();
                });

                item.append(checkbox, text, deleteBtn);

                taskList.appendChild(item);
            });

            updateProgress();
        }

        // Add a new task.
        taskForm.addEventListener("submit", event => {

            event.preventDefault();

            const taskText = taskInput.value.trim();

            if (!taskText) {
                taskInput.focus();
                return;
            }

            const newTask = {
                id: crypto.randomUUID(),
                text: taskText,
                completed: false
            };

            tasks.push(newTask);

            saveTasks();
            renderTasks();

            taskInput.value = "";
            taskInput.focus();
        });

        // Remove all completed tasks.
        clearCompletedBtn.addEventListener("click", () => {

            const completedCount = tasks.filter(
                task => task.completed
            ).length;

            if (completedCount === 0) return;

            const confirmed = confirm(
                `Delete ${completedCount} completed task(s)?`
            );

            if (!confirmed) return;

            tasks = tasks.filter(
                task => !task.completed
            );

            saveTasks();
            renderTasks();
        });

        // Initialize the to-do list.
        loadTasks();
        renderTasks();
    }

});