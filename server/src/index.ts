import express from "express";
import cors from "cors";
import { createTask, deleteTask, getAllTasks, updateTask } from "./store.js";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim());
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json());

const MAX_TITLE_LENGTH = 200;

function validateTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const title = raw.trim();
  if (!title || title.length > MAX_TITLE_LENGTH) return null;
  return title;
}

app.get("/api/tasks", (_req, res) => {
  res.json({ tasks: getAllTasks() });
});

app.post("/api/tasks", (req, res) => {
  const title = validateTitle(req.body?.title);
  if (!title) {
    res.status(400).json({ error: "title must be a non-empty string up to 200 characters" });
    return;
  }
  res.status(201).json({ task: createTask(title) });
});

app.patch("/api/tasks/:id", (req, res) => {
  const { title: rawTitle, done: rawDone } = req.body as {
    title?: unknown;
    done?: unknown;
  };

  if (rawTitle === undefined && rawDone === undefined) {
    res.status(400).json({ error: "provide title and/or done" });
    return;
  }

  const patch: { title?: string; done?: boolean } = {};
  if (rawTitle !== undefined) {
    const title = validateTitle(rawTitle);
    if (!title) {
      res.status(400).json({ error: "title must be a non-empty string up to 200 characters" });
      return;
    }
    patch.title = title;
  }
  if (rawDone !== undefined) {
    if (typeof rawDone !== "boolean") {
      res.status(400).json({ error: "done must be a boolean" });
      return;
    }
    patch.done = rawDone;
  }

  const task = updateTask(req.params.id, patch);
  if (!task) {
    res.status(404).json({ error: "task not found" });
    return;
  }
  res.json({ task });
});

app.delete("/api/tasks/:id", (req, res) => {
  if (!deleteTask(req.params.id)) {
    res.status(404).json({ error: "task not found" });
    return;
  }
  res.status(204).end();
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
