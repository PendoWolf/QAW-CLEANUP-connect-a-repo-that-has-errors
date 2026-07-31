export interface Task {
  id: string;
  title: string;
  done: boolean;
}

const tasks = new Map<string, Task>();

export function getAllTasks(): Task[] {
  return [...tasks.values()];
}

export function createTask(title: string): Task {
  const task: Task = { id: crypto.randomUUID(), title, done: false };
  tasks.set(task.id, task);
  return task;
}

export function updateTask(
  id: string,
  patch: { title?: string; done?: boolean }
): Task | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;
  if (patch.title !== undefined) task.title = patch.title;
  if (patch.done !== undefined) task.done = patch.done;
  return task;
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}
