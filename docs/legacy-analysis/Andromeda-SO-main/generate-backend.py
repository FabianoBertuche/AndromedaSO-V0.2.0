import os
import zipfile

base = "andromeda-backend"
files = {
    "apps/api/src/index.ts": """import app from "./app";

app.listen(3000, () => {
  console.log("🚀 Andromeda API running on port 3000");
});
""",

    "apps/api/src/app.ts": """import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tasks", taskRoutes);

export default app;
""",

    "apps/api/src/routes/task.routes.ts": """import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const router = Router();

router.post("/", TaskController.create);
router.post("/:id/execute", TaskController.execute);

export default router;
""",

    "apps/api/src/controllers/task.controller.ts": """import { Request, Response } from "express";
import { TaskService } from "../services/task.service";

export const TaskController = {
  create(req: Request, res: Response) {
    const { raw_request } = req.body;
    const task = TaskService.create(raw_request);
    res.json(task);
  },

  async execute(req: Request, res: Response) {
    const task = await TaskService.execute(req.params.id);
    res.json(task);
  }
};
""",

    "apps/api/src/services/task.service.ts": """import { v4 as uuid } from "uuid";
import { TaskRepository } from "../repositories/task.repository";
import { AuditService } from "../audit/audit.service";

export const TaskService = {
  create(raw_request: string) {
    const task = {
      id: uuid(),
      raw_request,
      status: "received",
      created_at: new Date(),
    };

    TaskRepository.save(task);
    return task;
  },

  async execute(id: string) {
    const task = TaskRepository.findById(id);
    if (!task) throw new Error("Task not found");

    task.status = "executing";

    const result = `Resultado da tarefa: ${task.raw_request}`;

    task.result = result;

    const audit = AuditService.audit(result);

    task.audit = audit;
    task.status = "completed";

    TaskRepository.save(task);

    return task;
  }
};
""",

    "apps/api/src/repositories/task.repository.ts": """const tasks = new Map();

export const TaskRepository = {
  save(task) {
    tasks.set(task.id, task);
  },

  findById(id) {
    return tasks.get(id);
  }
};
""",

    "apps/api/src/audit/audit.service.ts": """export const AuditService = {
  audit(result) {
    return {
      approved: true,
      score: 0.9
    };
  }
};
""",

    "apps/api/package.json": """{
  "name": "andromeda-api",
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "uuid": "^9.0.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}"""
}

# cria arquivos
for path, content in files.items():
    full_path = os.path.join(base, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

# cria zip
zip_name = "andromeda-backend.zip"
with zipfile.ZipFile(zip_name, "w") as z:
    for root, dirs, files in os.walk(base):
        for file in files:
            full_path = os.path.join(root, file)
            z.write(full_path)

print("✅ ZIP gerado:", zip_name)