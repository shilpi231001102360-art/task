
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";

const initialTasks = [
  {
    id: "101",
    title: "Complete React Assignment",
    description: "Build the Task Manager with routing and authentication.",
    priority: "High",
    category: "Academic",
    raisedAt: new Date().toISOString(),
    dueDate: "2026-09-30",
    status: "Pending",
  },
  {
    id: "102",
    title: "Prepare for Semester Exam",
    description: "Revise React, JavaScript and Data Structures.",
    priority: "Medium",
    category: "Academic",
    raisedAt: new Date().toISOString(),
    dueDate: "2026-10-05",
    status: "Raised",
  },
  {
    id: "103",
    title: "Organize Study Desk",
    description: "Arrange notes, books and study materials.",
    priority: "Low",
    category: "Personal",
    raisedAt: new Date().toISOString(),
    dueDate: "2026-09-28",
    status: "Closed",
  },
];

function getSavedTasks() {
  try {
    return JSON.parse(localStorage.getItem("taskflow_tasks")) || initialTasks;
  } catch {
    return initialTasks;
  }
}

function makeToken(username) {
  // Academic JWT simulation only; not a real secure JWT.
  const payload = btoa(
    JSON.stringify({
      username,
      exp: Date.now() + 60 * 60 * 1000,
    })
  );
  return `demo-header.${payload}.demo-signature`;
}

function getSession() {
  try {
    const saved = localStorage.getItem("taskflow_session");
    const temporary = sessionStorage.getItem("taskflow_session");
    const session = JSON.parse(saved || temporary || "null");

    if (!session?.token || !session?.username) return null;

    const payload = JSON.parse(atob(session.token.split(".")[1]));
    if (payload.exp < Date.now()) {
      localStorage.removeItem("taskflow_session");
      sessionStorage.removeItem("taskflow_session");
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState(getSession);
  const [tasks, setTasks] = useState(getSavedTasks);

  useEffect(() => {
    localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
  }, [tasks]);

  function login(username, password, remember) {
    const user = username.trim();
    if (!user || !password) return false;

    const newSession = {
      username: user,
      token: makeToken(user),
    };

    localStorage.removeItem("taskflow_session");
    sessionStorage.removeItem("taskflow_session");

    if (remember) {
      localStorage.setItem("taskflow_session", JSON.stringify(newSession));
    } else {
      sessionStorage.setItem("taskflow_session", JSON.stringify(newSession));
    }

    setSession(newSession);
    return true;
  }

  function logout() {
    localStorage.removeItem("taskflow_session");
    sessionStorage.removeItem("taskflow_session");
    setSession(null);
  }

  function addTask(task) {
    setTasks((old) => [{ ...task, id: Date.now().toString() }, ...old]);
  }

  function updateTask(id, changes) {
    setTasks((old) =>
      old.map((task) => (task.id === id ? { ...task, ...changes } : task))
    );
  }

  function deleteTask(id) {
    setTasks((old) => old.filter((task) => task.id !== id));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={login} />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute session={session}>
              <MainLayout session={session} onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Dashboard tasks={tasks} session={session} />}
          />

          <Route
            path="/tasks"
            element={
              <TasksPage
                tasks={tasks}
                onDelete={deleteTask}
                onUpdate={updateTask}
              />
            }
          />

          <Route
            path="/add-task"
            element={<TaskForm onSave={addTask} />}
          />

          <Route
            path="/edit-task/:id"
            element={
              <TaskForm
                tasks={tasks}
                onSave={addTask}
                onUpdate={updateTask}
                editing
              />
            }
          />

          <Route
            path="/task/:id"
            element={<TaskDetails tasks={tasks} onUpdate={updateTask} />}
          />

          <Route
            path="/completed"
            element={
              <TasksPage
                tasks={tasks.filter((t) => t.status === "Closed")}
                onDelete={deleteTask}
                onUpdate={updateTask}
                completedOnly
              />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const strength =
    password.length === 0
      ? ""
      : password.length < 6
      ? "Weak"
      : password.length < 10 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ? "Medium"
      : "Strong";

  function submit(e) {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    onLogin(username, password, remember);
    navigate("/");
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="brand light-brand">
          <span className="brand-icon">✓</span> TaskFlow
        </div>

        <div className="login-promo">
          <span className="eyebrow">YOUR PRODUCTIVITY PARTNER</span>
          <h1>Make every day a productive day.</h1>
          <p>
            Organize your tasks, track your progress, and achieve your goals
            with one simple workspace.
          </p>

          <div className="promo-stats">
            <div>
              <strong>Plan</strong>
              <span>your priorities</span>
            </div>
            <div>
              <strong>Track</strong>
              <span>your progress</span>
            </div>
            <div>
              <strong>Achieve</strong>
              <span>your goals</span>
            </div>
          </div>
        </div>

        <p className="login-bottom">A smarter way to get things done.</p>
      </div>

      <div className="login-form-area">
        <div className="login-form-box">
          <div className="mobile-brand brand">
            <span className="brand-icon">✓</span> TaskFlow
          </div>

          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="muted">
            Enter your details to access your personal dashboard.
          </p>

          <form onSubmit={submit} className="form-stack">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Enter your username"
              autoComplete="username"
            />

            <div className="label-row">
              <label>Password</label>
              <span className="muted small">Minimum 6 characters</span>
            </div>

            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {password && (
              <div className="strength-area">
                <div className="strength-track">
                  <span className={`strength-fill ${strength.toLowerCase()}`} />
                </div>
                <span className={`strength-text ${strength.toLowerCase()}`}>
                  Password strength: {strength}
                </span>
              </div>
            )}

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>

            {error && <div className="error-box">{error}</div>}

            <button className="primary-btn full-btn" type="submit">
              Sign In <span>→</span>
            </button>
          </form>

          <div className="demo-note">
            <strong>Demo access</strong>
            <p>Use any username and a password with at least 6 characters.</p>
          </div>

          <p className="login-legal">
            Demo authentication for academic project use.
          </p>
        </div>
      </div>
    </div>
  );
}

function MainLayout({ session, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand sidebar-brand">
          <span className="brand-icon">✓</span> TaskFlow
        </Link>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <NavLink to="/" end>
            <span>▦</span> Dashboard
          </NavLink>
          <NavLink to="/tasks">
            <span>☷</span> All Tasks
          </NavLink>
          <NavLink to="/add-task">
            <span>＋</span> Add New Task
          </NavLink>
          <NavLink to="/completed">
            <span>✓</span> Completed
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Stay focused!</strong>
            <p>Small steps every day lead to big results.</p>
          </div>

          <div className="user-profile">
            <div className="avatar">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <strong>{session.username}</strong>
              <span>Student account</span>
            </div>
            <button
              className="logout-icon"
              title="Logout"
              onClick={handleLogout}
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-label">WORKSPACE / TASKFLOW</span>
            <h2>Task Management</h2>
          </div>
          <div className="topbar-right">
            <span className="online-dot" />
            <span className="muted">Signed in as</span>
            <strong>{session.username}</strong>
            <button className="logout-btn" onClick={handleLogout}>
              Logout ↗
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>© 2026 TaskFlow</span>
          <span>Stay organized. Stay productive.</span>
        </footer>
      </main>
    </div>
  );
}

function Dashboard({ tasks, session }) {
  const completed = tasks.filter((t) => t.status === "Closed").length;
  const pending = tasks.filter((t) => t.status !== "Closed").length;
  const high = tasks.filter(
    (t) => t.priority === "High" && t.status !== "Closed"
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    (t) => t.status !== "Closed" && t.dueDate && t.dueDate < today
  ).length;

  const recent = [...tasks].slice(0, 5);

  return (
    <>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">YOUR OVERVIEW</span>
          <h1>Good to see you, {session.username}!</h1>
          <p>Here is what's happening with your tasks today.</p>
          <Link to="/add-task" className="banner-btn">
            + Create a task
          </Link>
        </div>
        <div className="banner-art">
          <div className="art-circle">✓</div>
          <span className="art-star star-one">✦</span>
          <span className="art-star star-two">✧</span>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Overview</h2>
          <p className="muted">Your productivity at a glance</p>
        </div>
        <span className="date-pill">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Tasks"
          value={tasks.length}
          icon="☷"
          color="purple"
          note="All tasks in workspace"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon="✓"
          color="green"
          note="Successfully closed"
        />
        <StatCard
          label="In Progress"
          value={pending}
          icon="◷"
          color="blue"
          note="Raised or pending"
        />
        <StatCard
          label="High Priority"
          value={high}
          icon="⚑"
          color="orange"
          note={`${overdue} overdue task(s)`}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Tasks</h3>
              <p className="muted">Your latest activities</p>
            </div>
            <Link to="/tasks" className="text-link">
              View all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              text="Create your first task to get started."
              link="/add-task"
            />
          ) : (
            <div className="recent-list">
              {recent.map((task) => (
                <Link
                  to={`/task/${task.id}`}
                  className="recent-item"
                  key={task.id}
                >
                  <div
                    className={`task-check ${
                      task.status === "Closed" ? "checked" : ""
                    }`}
                  >
                    {task.status === "Closed" ? "✓" : ""}
                  </div>
                  <div className="recent-task-info">
                    <strong>{task.title}</strong>
                    <span>
                      {task.category} · Due {task.dueDate || "Not set"}
                    </span>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <h3>Task Progress</h3>
              <p className="muted">Completion summary</p>
            </div>
          </div>

          <div className="progress-circle"
           style={{
    background: `conic-gradient(
      #6654e8 ${
        tasks.length ? (completed / tasks.length) * 360 : 0
      }deg,
      #eae8fb 0deg
    )`,
  }}
>
            <div className="progress-inner">
              <strong>
                {tasks.length
                  ? Math.round((completed / tasks.length) * 100)
                  : 0}
                %
              </strong>
              <span>Completed</span>
            </div>
          </div>

          <div className="progress-legend">
            <div>
              <span className="legend-dot green-dot" /> Completed
              <strong>{completed}</strong>
            </div>
            <div>
              <span className="legend-dot blue-dot" /> Remaining
              <strong>{pending}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="quick-actions">
        <div>
          <span className="quick-icon">＋</span>
          <div>
            <strong>Have something to do?</strong>
            <p className="muted">Add a task and keep your day organized.</p>
          </div>
        </div>
        <Link to="/add-task" className="primary-btn">
          Add New Task →
        </Link>
      </section>
    </>
  );
}

function StatCard({ label, value, icon, color, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>
      <strong className="stat-number">{value}</strong>
      <span className="stat-note">{note}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <span /> {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge ${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}

function EmptyState({ title, text, link }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {link && (
        <Link to={link} className="primary-btn">
          Create Task
        </Link>
      )}
    </div>
  );
}

function TasksPage({ tasks, onDelete, onUpdate, completedOnly = false }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");

  const filtered = tasks.filter((task) => {
    const matchSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());

    return (
      matchSearch &&
      (status === "All" || task.status === status) &&
      (category === "All" || task.category === category) &&
      (priority === "All" || task.priority === priority)
    );
  });

  return (
    <>
      <div className="page-title-row">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>{completedOnly ? "Completed Tasks" : "All Tasks"}</h1>
          <p className="muted">
            {completedOnly
              ? "A record of everything you have completed."
              : "Manage, search, filter and update your tasks."}
          </p>
        </div>
        {!completedOnly && (
          <Link to="/add-task" className="primary-btn">
            + Add Task
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="⌕  Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Raised">Raised</option>
          <option value="Pending">Pending</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Academic">Academic</option>
          <option value="Personal">Personal</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <section className="panel tasks-panel">
        <div className="panel-heading">
          <div>
            <h3>{completedOnly ? "Completed list" : "Task list"}</h3>
            <p className="muted">{filtered.length} task(s) found</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching tasks"
            text="Try changing your search or filters."
          />
        ) : (
          <div className="table-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <Link to={`/task/${task.id}`} className="table-task">
                        <strong>{task.title}</strong>
                        <span>
                          {task.description.slice(0, 55)}
                          {task.description.length > 55 ? "..." : ""}
                        </span>
                      </Link>
                    </td>
                    <td>{task.category}</td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>{task.dueDate || "—"}</td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/edit-task/${task.id}`}
                          className="action-btn edit"
                          title="Edit"
                        >
                          ✎
                        </Link>
                        {task.status !== "Closed" && (
                          <button
                            className="action-btn done"
                            title="Mark completed"
                            onClick={() =>
                              onUpdate(task.id, { status: "Closed" })
                            }
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this task?"
                              )
                            ) {
                              onDelete(task.id);
                            }
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function TaskForm({ tasks = [], onSave, onUpdate, editing = false }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const existing = editing ? tasks.find((task) => task.id === id) : null;

  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(
    existing?.description || ""
  );
  const [priority, setPriority] = useState(existing?.priority || "Medium");
  const [category, setCategory] = useState(
    existing?.category || "Academic"
  );
  const [dueDate, setDueDate] = useState(existing?.dueDate || "");
  const [status, setStatus] = useState(existing?.status || "Raised");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a task description.");
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      dueDate,
      status,
      raisedAt: existing?.raisedAt || new Date().toISOString(),
    };

    if (editing && existing) {
      onUpdate(id, data);
    } else {
      onSave(data);
    }

    navigate("/tasks");
  }

  if (editing && !existing) {
    return (
      <div className="panel">
        <h2>Task not found</h2>
        <Link to="/tasks" className="primary-btn">
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-title-row">
        <div>
          <span className="eyebrow">TASK MANAGEMENT</span>
          <h1>{editing ? "Edit Task" : "Create a New Task"}</h1>
          <p className="muted">
            {editing
              ? "Update your task details below."
              : "Fill in the details to add a task to your workspace."}
          </p>
        </div>
        <Link to="/tasks" className="secondary-btn">
          ← Back to Tasks
        </Link>
      </div>

      <div className="form-layout">
        <form className="panel task-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <h3>Task information</h3>
              <p className="muted">Fields marked * are required.</p>
            </div>
          </div>

          <label>Task Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete React assignment"
            maxLength={100}
          />

          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what needs to be done..."
            rows="5"
            maxLength={1000}
          />

          <div className="form-two-col">
            <div>
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Academic</option>
                <option>Personal</option>
              </select>
            </div>
          </div>

          <div className="form-two-col">
            <div>
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Raised</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
            </div>
          </div>

          <div className="raised-date">
            <span>◷</span>
            <div>
              <strong>Raised Date & Time</strong>
              <p>
                {existing
                  ? new Date(existing.raisedAt).toLocaleString()
                  : new Date().toLocaleString()}
              </p>
              <small>Automatically generated</small>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/tasks")}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {editing ? "Save Changes" : "Create Task"} →
            </button>
          </div>
        </form>

        <aside className="form-tip">
          <div className="tip-icon">✦</div>
          <h3>Plan with purpose</h3>
          <p>
            Break large goals into smaller tasks. Set realistic due dates and
            priorities to stay on track.
          </p>
          <div className="tip-divider" />
          <strong>Quick tips</strong>
          <ul>
            <li>Keep titles short and clear.</li>
            <li>Use High priority for urgent tasks.</li>
            <li>Update the status as you progress.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function TaskDetails({ tasks, onUpdate }) {
  const { id } = useParams();
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return (
      <div className="panel">
        <h2>Task not found</h2>
        <p className="muted">This task may have been deleted.</p>
        <Link to="/tasks" className="primary-btn">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-title-row">
        <div>
          <span className="eyebrow">TASK DETAILS / #{task.id}</span>
          <h1>Task Details</h1>
          <p className="muted">Review and update this task.</p>
        </div>
        <Link to="/tasks" className="secondary-btn">
          ← All Tasks
        </Link>
      </div>

      <section className="panel details-panel">
        <div className="details-top">
          <div className="details-symbol">☷</div>
          <div>
            <div className="badge-row">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h2>{task.title}</h2>
            <p className="muted">Created task · ID #{task.id}</p>
          </div>
        </div>

        <div className="details-description">
          <h3>Description</h3>
          <p>{task.description}</p>
        </div>

        <div className="details-info-grid">
          <div>
            <span>Category</span>
            <strong>{task.category}</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{task.priority}</strong>
          </div>
          <div>
            <span>Raised Date & Time</span>
            <strong>{new Date(task.raisedAt).toLocaleString()}</strong>
          </div>
          <div>
            <span>Due Date</span>
            <strong>{task.dueDate || "Not set"}</strong>
          </div>
        </div>

        <div className="details-actions">
          <Link to={`/edit-task/${task.id}`} className="primary-btn">
            ✎ Edit Task
          </Link>
          {task.status !== "Closed" && (
            <button
              className="secondary-btn"
              onClick={() => onUpdate(task.id, { status: "Closed" })}
            >
              ✓ Mark as Completed
            </button>
          )}
        </div>
      </section>
    </>
  );
}

export default App;