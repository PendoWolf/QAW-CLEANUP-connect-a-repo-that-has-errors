export interface Task {
  id: string;
  title: string;
  done: boolean;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data;
}

export async function fetchTasks(): Promise<Task[]> {
  const { tasks } = await request<{ tasks: Task[] }>("/api/tasks");
  return tasks;
}

export async function createTask(title: string): Promise<Task> {
  const { task } = await request<{ task: Task }>("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return task;
}

export async function updateTask(
  id: string,
  patch: { title?: string; done?: boolean }
): Promise<Task> {
  const { task } = await request<{ task: Task }>(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}
