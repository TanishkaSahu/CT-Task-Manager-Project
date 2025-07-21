const BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("register.html")) {
    initRegister();
  } else if (path.includes("login.html")) {
    initLogin();
  } else if (path.includes("dashboard.html")) {
    initDashboard();
  }
});

function initRegister() {
  const form = document.getElementById("registerForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userData = {
      username: document.getElementById("username").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful!");
      window.location.href = "login.html";
    } else {
      alert(data.message || "Registration failed");
    }
  });
}

function initLogin() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginData = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Login failed");
    }
  });
}

function initDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  document.getElementById("notificationsIcon").addEventListener("click", toggleNotifications);

  loadUsers();
  loadTasks();
  loadNotifications();

  setInterval(loadNotifications, 10000); 


  const form = document.getElementById("taskForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskData = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      deadline: document.getElementById("deadline").value,
      assignee: document.getElementById("assignee").value,
      category: document.getElementById("category").value
    };

    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (res.ok) {
      alert("Task created!");
      loadTasks();
      loadNotifications(); 
      form.reset();
    } else {
      const data = await res.json();
      alert(data.message || "Task creation failed.");
    }
  });
}

async function loadUsers() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = await res.json();

  const dropdown = document.getElementById("assignee");
  dropdown.innerHTML = '<option value="">-- Select User --</option>';
  users.forEach((user) => {
    dropdown.innerHTML += `<option value="${user._id}">${user.username}</option>`;
  });
}

async function loadTasks() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const tasks = await res.json();
  const sections = {
    "Assignment": [],
    "Minor Project": [],
    "Major Project": []
  };

  if (res.ok && tasks.length > 0) {
    tasks.forEach((task) => {
      sections[task.category].push(task);
    });
  }

  const container = document.getElementById("taskSections");
  container.innerHTML = "";

  for (const category in sections) {
    const section = document.createElement("div");
    section.innerHTML = `<h4>${category}</h4>`;

    if (sections[category].length > 0) {
      sections[category].forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
          <strong>${task.title}</strong> (${task.status})<br/>
          ${task.description}<br/>
          Deadline: ${task.deadline ? new Date(task.deadline).toLocaleString() : "N/A"}<br/>
          Assigned to: ${task.assignee?.username || "N/A"}<br/>
          ${(task.assignee?._id === getCurrentUserId())
            ? `<button onclick="markComplete('${task._id}')">Complete</button>`
            : ""
          }
        ${task.creator?._id === getCurrentUserId() ? `<button onclick="deleteTask('${task._id}')">Delete</button>` : ""}  
        `;
        section.appendChild(card);
      });
    } else {
      section.innerHTML += "<p>No tasks.</p>";
    }
    container.appendChild(section);
  }
}

async function markComplete(id) {
  const token = localStorage.getItem("token");
  await fetch(`${BASE_URL}/tasks/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: "complete" }),
  });
  loadTasks();
}

async function deleteTask(id) {
  const token = localStorage.getItem("token");
  await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  loadTasks();
}
let previousNotificationCount = 0;
async function loadNotifications() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn("Failed to fetch notifications");
      return;
    }

    const notifications = await res.json();
    const dropdown = document.getElementById("notificationsDropdown");
    const badge = document.getElementById("notificationBadge");

    dropdown.innerHTML = ""; 

    if (notifications.length > 0) {
      notifications.forEach(n => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${n.message}</strong>`;
        dropdown.appendChild(div);
      });

      
      if (notifications.length > previousNotificationCount) {
        badge.classList.add("visible");
      }

    } else {
      const div = document.createElement("div");
      div.textContent = "No notifications";
      dropdown.appendChild(div);
      badge.classList.remove("visible");
    }

    previousNotificationCount = notifications.length;

  } catch (err) {
    console.error("Error loading notifications:", err);
  }
}
function toggleNotifications() {
  const dropdown = document.getElementById("notificationsDropdown");
  dropdown.classList.toggle("visible");


  if (dropdown.classList.contains("visible")) {
    document.getElementById("notificationBadge").classList.remove("visible");
  }
}


function getCurrentUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.id;
}    