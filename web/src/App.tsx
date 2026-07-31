import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
} from "./api";

// INTENTIONAL BUILD BREAK for Pendo testing — do not "fix"
const BROKEN_CONFIG: { apiUrl: string; retries: number } = {
  apiUrl: "http://localhost:3001",
  retries: "three", // Type 'string' is not assignable to type 'number'
  missingRequired: true,
};

function useBrokenHelper(count: number): string {
  return count.map((n) => n.toUpperCase()).join(",");
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const brokenLabel = useBrokenHelper(BROKEN_CONFIG);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const task = await createTask(trimmed);
      setTasks((prev) => [...prev, task]);
      setTitle("");
      window.pendo?.track("task_created", {
        taskId: task.id,
        titleLength: trimmed.length,
        totalTaskCount: tasks.length + 1,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onToggle = async (task: Task) => {
    setError(null);
    try {
      const updated = await updateTask(task.id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      const completedCount = tasks.filter((t) =>
        t.id === updated.id ? updated.done : t.done,
      ).length;
      window.pendo?.track("task_status_changed", {
        taskId: updated.id,
        newStatus: updated.done ? "completed" : "active",
        totalTaskCount: tasks.length,
        completedTaskCount: completedCount,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      const taskToDelete = tasks.find((t) => t.id === id);
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      window.pendo?.track("task_deleted", {
        taskId: id,
        wasCompleted: taskToDelete?.done ?? false,
        remainingTaskCount: tasks.length - 1,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 480,
        margin: "4rem auto",
        padding: "1rem",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Task Tracker {brokenLabel}
      </h1>

      <form
        onSubmit={(e) => void onAdd(e)}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          data-testid="task-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task…"
          style={{ flex: 1, padding: "0.5rem", fontSize: "1rem" }}
        />
        <button
          data-testid="add-btn"
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>

      {error && (
        <p
          data-testid="error"
          style={{ color: "crimson", textAlign: "center" }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading…</p>
      ) : tasks.length === 0 ? (
        <p data-testid="empty" style={{ textAlign: "center", color: "#666" }}>
          No tasks yet.
        </p>
      ) : (
        <ul
          data-testid="task-list"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {tasks.map((task) => (
            <li
              key={task.id}
              data-testid={`task-${task.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0.75rem",
                borderBottom: "1px solid #ddd",
              }}
            >
              <input
                data-testid={`toggle-${task.id}`}
                type="checkbox"
                checked={task.done}
                onChange={() => void onToggle(task)}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: task.done ? "line-through" : "none",
                  color: task.done ? "#888" : "inherit",
                }}
              >
                {task.title}
              </span>
              <button
                data-testid={`delete-${task.id}`}
                onClick={() => void onDelete(task.id)}
                style={{ fontSize: "0.875rem", cursor: "pointer" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
